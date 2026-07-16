import "server-only";

import { DEFAULT_PLAN, PLANS, type SubscriptionPlan } from "@/config/subscriptions";
import prisma from "@/lib/db";
import { normalizeSku } from "@/lib/sku";

import type { EcommerceConnector, OrderData, ProductData, SyncResult } from "./types";

/**
 * Shopify connector using the REST Admin API.
 * Requires a Shopify Private App access token.
 *
 * Setup: In Shopify Admin → Settings → Apps and Sales Channels → Develop Apps
 * Create a custom app with `read_products` and `read_orders` scopes.
 */
export class ShopifyConnector implements EcommerceConnector {
  private shopUrl: string;
  private accessToken: string;
  private apiVersion = "2024-01";

  constructor(shopUrl: string, accessToken: string) {
    // Normalize the shop URL to just the domain
    this.shopUrl = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    this.accessToken = accessToken;
  }

  private async apiRequest<T>(endpoint: string): Promise<T> {
    const url = `https://${this.shopUrl}/admin/api/${this.apiVersion}/${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; shopName?: string; error?: string }> {
    try {
      const data = await this.apiRequest<{ shop: { name: string } }>("shop.json");
      return { success: true, shopName: data.shop.name };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Échec de connexion à Shopify",
      };
    }
  }

  async syncProducts(orgId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    try {
      // Check plan product limit
      const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { plan: true },
      });
      const plan = PLANS[(org?.plan as SubscriptionPlan) || DEFAULT_PLAN] || PLANS[DEFAULT_PLAN];
      const maxProducts = plan.features.maxProducts;
      let currentCount = await prisma.product.count({ where: { orgId } });

      let pageInfo: string | null = null;
      let hasNextPage = true;

      while (hasNextPage) {
        const endpoint: string = pageInfo ? `products.json?limit=50&page_info=${pageInfo}` : "products.json?limit=50";

        const response: Response = await fetch(`https://${this.shopUrl}/admin/api/${this.apiVersion}/${endpoint}`, {
          headers: {
            "X-Shopify-Access-Token": this.accessToken,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          result.errors.push(`API error: ${response.status}`);
          result.success = false;
          break;
        }

        // biome-ignore lint/suspicious/noExplicitAny: Shopify API response
        const data: any = await response.json();
        const products: ProductData[] = this.mapProducts(data.products || []);

        for (const product of products) {
          try {
            const sku = normalizeSku(product.sku) ?? normalizeSku(product.externalId);
            if (!sku) {
              result.skippedCount++;
              continue;
            }

            // Check if product already exists by SKU
            const existing = await prisma.product.findFirst({
              where: { orgId, sku },
            });

            if (existing) {
              // Update existing product
              await prisma.product.update({
                where: { id: existing.id },
                data: {
                  name: product.name,
                  weightG: product.weightG,
                },
              });
              result.updatedCount++;
            } else {
              // Check limit before creating
              if (Number.isFinite(maxProducts) && currentCount + result.createdCount >= maxProducts) {
                result.errors.push(
                  `Limite de ${maxProducts} produits atteinte (plan ${plan.name}). Synchronisation interrompue.`,
                );
                hasNextPage = false;
                break;
              }
              await prisma.product.create({
                data: {
                  orgId,
                  name: product.name,
                  sku,
                  weightG: product.weightG,
                  status: "NEEDS_REVIEW",
                  classificationSource: "SHOPIFY_IMPORT",
                },
              });
              result.createdCount++;
            }
            result.syncedCount++;
          } catch {
            result.skippedCount++;
          }
        }

        // Check for pagination
        const linkHeader: string | null = response.headers.get("link");
        if (linkHeader?.includes('rel="next"')) {
          const match: RegExpMatchArray | null = linkHeader.match(/page_info=([^>&]*)/);
          pageInfo = match ? match[1] : null;
          hasNextPage = !!pageInfo;
        } else {
          hasNextPage = false;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  async syncOrders(orgId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
    };

    try {
      const data = await this.apiRequest<{ orders: Array<Record<string, unknown>> }>("orders.json?status=any&limit=50");

      const orders: OrderData[] = this.mapOrders(data.orders || []);

      for (const order of orders) {
        try {
          // Check if order already exists by orderNumber
          const existing = await prisma.order.findFirst({
            where: { orgId, orderNumber: order.orderNumber },
          });

          if (!existing) {
            await prisma.order.create({
              data: {
                orgId,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                totalAmount: order.totalAmount,
                date: order.date,
              },
            });
            result.createdCount++;
            result.syncedCount++;
          } else {
            result.skippedCount++;
          }
        } catch {
          result.skippedCount++;
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  }

  // biome-ignore lint/suspicious/noExplicitAny: Shopify API response mapping
  private mapProducts(shopifyProducts: any[]): ProductData[] {
    return shopifyProducts.flatMap((product) =>
      // biome-ignore lint/suspicious/noExplicitAny: Shopify variant
      (product.variants || [product]).map((variant: any) => ({
        externalId: String(variant.id || product.id),
        name: variant.title !== "Default Title" ? `${product.title} - ${variant.title}` : product.title,
        sku: variant.sku || null,
        weightG: variant.weight ? Math.round(this.convertToGrams(variant.weight, variant.weight_unit)) : null,
        materialType: null,
      })),
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Shopify API response mapping
  private mapOrders(shopifyOrders: any[]): OrderData[] {
    return shopifyOrders.map((order) => ({
      externalId: String(order.id),
      orderNumber: order.name || `#${order.order_number}`,
      customerName: order.customer
        ? `${order.customer.first_name || ""} ${order.customer.last_name || ""}`.trim()
        : null,
      totalAmount: Number.parseFloat(order.total_price) || 0,
      date: new Date(order.created_at),
    }));
  }

  private convertToGrams(weight: number, unit: string): number {
    switch (unit) {
      case "kg":
        return weight * 1000;
      case "lb":
        return weight * 453.592;
      case "oz":
        return weight * 28.3495;
      default:
        return weight;
    }
  }
}
