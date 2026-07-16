"use server";

import Papa from "papaparse";

import prisma from "@/lib/db";
import { normalizeSku } from "@/lib/sku";
import { checkProductLimit } from "@/lib/subscription/plan-limits";
import { createClient } from "@/lib/supabase/server";
import { applyClassificationRules, getActiveClassificationRules } from "@/services/classification";
import type { ImportMapping } from "@/types/mock-import";

interface CSVRow {
  [key: string]: string;
}

interface ProcessResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}

async function processCsvText(
  sessionId: string,
  orgId: string,
  mapping: ImportMapping,
  csvText: string,
): Promise<ProcessResult> {
  const result: ProcessResult = {
    success: true,
    created: 0,
    updated: 0,
    errors: [],
  };

  try {
    // Verifier la limite produits du plan avant import
    const limit = await checkProductLimit();
    if (!limit.allowed) {
      const nextPlanName = limit.nextPlan?.name ?? "superieur";
      result.success = false;
      result.errors.push(
        `Limite de ${limit.max} produits atteinte (plan ${limit.plan.name}). Passez au plan ${nextPlanName} pour importer.`,
      );
      return result;
    }

    const parsed = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      const criticalErrors = parsed.errors.filter((error) => error.type === "FieldMismatch" || error.type === "Quotes");
      if (criticalErrors.length > 0) {
        throw new Error(`CSV parsing errors: ${criticalErrors.map((error) => error.message).join(", ")}`);
      }
    }

    const rows = parsed.data;
    if (rows.length === 0) {
      throw new Error("CSV file is empty or has no data rows");
    }

    const uniqueSkus = Array.from(
      new Set(rows.map((row) => normalizeSku(row[mapping.sku])).filter((sku): sku is string => Boolean(sku))),
    );
    const existingProducts = uniqueSkus.length
      ? await prisma.product.findMany({
          where: { orgId, sku: { in: uniqueSkus } },
          select: { id: true, sku: true, quantitySold: true },
        })
      : [];
    const existingBySku = new Map(
      existingProducts
        .filter((product) => Boolean(product.sku))
        .map((product) => [product.sku?.toLowerCase(), product] as const),
    );
    const activeRules = await getActiveClassificationRules(orgId);

    const headers = Object.keys(rows[0] || {});
    for (const [field, column] of Object.entries(mapping)) {
      if (column && !headers.includes(column)) {
        result.errors.push(`Column "${column}" (mapped to ${field}) not found in CSV`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
      return result;
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        const sku = normalizeSku(row[mapping.sku]);
        const name = row[mapping.name]?.trim();
        const quantityRaw = row[mapping.quantity]?.trim();

        if (!sku || !name) {
          result.errors.push(`Row ${index + 2}: missing SKU or name, skipped`);
          continue;
        }

        const quantity = Number.parseInt(quantityRaw || "0", 10);
        if (Number.isNaN(quantity) || quantity < 0) {
          result.errors.push(`Row ${index + 2}: invalid quantity "${quantityRaw}", defaulting to 0`);
        }

        const existing = existingBySku.get(sku.toLowerCase());

        // Verifier la limite en cours d'import pour les nouveaux produits
        if (!existing && Number.isFinite(limit.max) && limit.current + result.created >= limit.max) {
          result.errors.push(
            `Ligne ${index + 2}: limite de ${limit.max} produits atteinte. Les lignes restantes ont ete ignorees.`,
          );
          break;
        }

        if (existing) {
          const nextQuantitySold = (existing.quantitySold ?? 0) + Math.max(0, quantity);
          await prisma.product.update({
            where: { id: existing.id },
            data: {
              name,
              quantitySold: nextQuantitySold,
            },
          });
          existing.quantitySold = nextQuantitySold;
          result.updated++;
        } else {
          const newProduct = await prisma.product.create({
            data: {
              orgId,
              sku,
              name,
              quantitySold: Math.max(0, quantity),
              status: "NEEDS_REVIEW",
              classificationSource: "MANUAL",
            },
          });

          existingBySku.set(sku.toLowerCase(), {
            id: newProduct.id,
            sku: newProduct.sku,
            quantitySold: newProduct.quantitySold,
          });

          try {
            const classification = await applyClassificationRules(newProduct, orgId, activeRules);
            if (classification) {
              await prisma.product.update({
                where: { id: newProduct.id },
                data: {
                  materialType: classification.materialType,
                  ecoOrganism: classification.ecoOrganism,
                  // biome-ignore lint/suspicious/noExplicitAny: local type mismatch with Prisma enum
                  packagingType: classification.packagingType as any,
                  status: "PENDING",
                  classificationSource: "RULE_BASED",
                },
              });
            }
          } catch {
            // Classification failure is non-critical: product stays NEEDS_REVIEW
          }

          result.created++;
        }
      } catch (rowError) {
        result.errors.push(`Row ${index + 2}: ${rowError instanceof Error ? rowError.message : "unknown error"}`);
      }
    }

    await prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: result.errors.length > 5 ? "FAILED" : "COMPLETED",
      },
    });
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown processing error");

    try {
      await prisma.importSession.update({
        where: { id: sessionId },
        data: { status: "FAILED" },
      });
    } catch {
      // Session update failure is secondary
    }
  }

  return result;
}

export async function processCSVImport(
  sessionId: string,
  orgId: string,
  mapping: ImportMapping,
  fileUrl: string,
): Promise<ProcessResult> {
  const supabase = await createClient();
  const { data: fileData, error: downloadError } = await supabase.storage.from("imports").download(fileUrl);

  if (downloadError || !fileData) {
    throw new Error(`Failed to download file: ${downloadError?.message}`);
  }

  const csvText = await fileData.text();
  return processCsvText(sessionId, orgId, mapping, csvText);
}

export async function processCSVTextImport(sessionId: string, orgId: string, mapping: ImportMapping, csvText: string) {
  return processCsvText(sessionId, orgId, mapping, csvText);
}
