export interface ProductDTO {
  id: string;
  name: string;
  sku: string;
  materialType?: string;
  weightG?: number;
  status: "CONFIRMED" | "NEEDS_REVIEW" | "ARCHIVED";
  quantitySold?: number;
}

export interface SalesImportDTO {
  id: string;
  fileName: string;
  date: Date;
  status: "COMPLETED" | "PROCESSING" | "FAILED";
  rowCount: number;
}

export interface ImportMapping {
  name: string;
  sku: string;
  quantity: string;
}
