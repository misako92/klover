/**
 * Common interface for e-commerce platform connectors.
 * All connectors implement this interface to provide a unified API for syncing products and orders.
 */

export interface EcommerceConnector {
  /** Test the connection with the provided credentials */
  testConnection(): Promise<{ success: boolean; shopName?: string; error?: string }>;

  /** Sync products from the platform into Klover */
  syncProducts(orgId: string): Promise<SyncResult>;

  /** Sync orders from the platform into Klover */
  syncOrders(orgId: string): Promise<SyncResult>;
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}

export interface IntegrationCredentials {
  platform: "shopify" | "woocommerce";
  shopUrl: string;
  accessToken?: string;
  apiKey?: string;
  apiSecret?: string;
}

export interface ProductData {
  externalId: string;
  name: string;
  sku: string | null;
  weightG: number | null;
  materialType: string | null;
}

export interface OrderData {
  externalId: string;
  orderNumber: string;
  customerName: string | null;
  totalAmount: number;
  date: Date;
}
