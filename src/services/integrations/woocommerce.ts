import "server-only";

import { DEFAULT_PLAN, PLANS, type SubscriptionPlan } from "@/config/subscriptions";
import prisma from "@/lib/db";
import { normalizeSku } from "@/lib/sku";

import type { EcommerceConnector, OrderData, ProductData, SyncResult } from "./types";

/**
 * WooCommerce connector using the REST API v3.
 * Uses consumer key / consumer secret for authentication (Basic Auth over HTTPS).
 *
 * Setup: In WordPress Admin → WooCommerce → Settings → Advanced → REST API
 * Create API keys with Read permissions.
 */
export class WooCommerceConnector implements EcommerceConnector {
  private baseUrl: string;
  private consumerKey: string;
  private consumerSecret: string;

  constructor(siteUrl: string, consumerKey: string, consumerSecret: string) {
    this.baseUrl = siteUrl.replace(/\/$/, "");
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
  }

  private async apiRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/wp-json/wc/v3/${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const basicAuth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64");
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WooCommerce API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; shopName?: string; error?: string }> {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: WooCommerce API response
      const data = await this.apiRequest<any>("system_status");
      const shopName = data?.settings?.blogname || data?.environment?.site_url || this.baseUrl;
      return { success: true, shopName };
    } catch (_error) {
      // Fallback: try a simpler endpoint
      try {
        await this.apiRequest("products", { per_page: "1" });
        return { success: true, shopName: this.baseUrl };
      } catch (error2) {
        return {
          success: false,
          error: error2 instanceof Error ? error2.message : "Échec de connexion à WooCommerce",
        };
      }
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
      const currentCount = await prisma.product.count({ where: { orgId } });

      let page = 1;
      let hasMore = true;

      while (hasMore) {
        // biome-ignore lint/suspicious/noExplicitAny: WooCommerce API response
        const products: any[] = await this.apiRequest("products", {
          per_page: "50",
          page: String(page),
        });

        if (products.length === 0) {
          hasMore = false;
          break;
        }

        const mapped: ProductData[] = this.mapProducts(products);

        for (const product of mapped) {
          try {
            const sku = normalizeSku(product.sku) ?? normalizeSku(`wc-${product.externalId}`);
            if (!sku) {
              result.skippedCount++;
              continue;
            }
            const existing = await prisma.product.findFirst({
              where: { orgId, sku },
            });

            if (existing) {
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
                hasMore = false;
                break;
              }
              await prisma.product.create({
                data: {
                  orgId,
                  name: product.name,
                  sku,
                  weightG: product.weightG,
                  status: "NEEDS_REVIEW",
                  classificationSource: "WOOCOMMERCE_IMPORT",
                },
              });
              result.createdCount++;
            }
            result.syncedCount++;
          } catch {
            result.skippedCount++;
          }
        }

        page++;
        if (products.length < 50) hasMore = false;
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
      // biome-ignore lint/suspicious/noExplicitAny: WooCommerce API response
      const orders: any[] = await this.apiRequest("orders", {
        per_page: "50",
        page: "1",
      });

      const mapped: OrderData[] = this.mapOrders(orders);

      for (const order of mapped) {
        try {
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

  // biome-ignore lint/suspicious/noExplicitAny: WooCommerce API response mapping
  private mapProducts(wooProducts: any[]): ProductData[] {
    return wooProducts.flatMap((product) => {
      // If product has variations, we'd need separate calls for each variation
      // For simplicity, we sync the parent product with its main data
      const weightKg = product.weight ? Number.parseFloat(product.weight) : null;

      return [
        {
          externalId: String(product.id),
          name: product.name,
          sku: product.sku || null,
          weightG: weightKg ? Math.round(weightKg * 1000) : null, // WooCommerce weight in kg by default
          materialType: null,
        },
      ];
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: WooCommerce API response mapping
  private mapOrders(wooOrders: any[]): OrderData[] {
    return wooOrders.map((order) => ({
      externalId: String(order.id),
      orderNumber: `#${order.number || order.id}`,
      customerName: order.billing ? `${order.billing.first_name || ""} ${order.billing.last_name || ""}`.trim() : null,
      totalAmount: Number.parseFloat(order.total) || 0,
      date: new Date(order.date_created),
    }));
  }
}
