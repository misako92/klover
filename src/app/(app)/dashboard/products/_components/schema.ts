"use client";

import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  materialType: z.string().nullable(),
  weightG: z.number().nullable(),
  status: z.enum(["CONFIRMED", "NEEDS_REVIEW", "PENDING", "ARCHIVED"]),
});

export type Product = z.infer<typeof productSchema>;
