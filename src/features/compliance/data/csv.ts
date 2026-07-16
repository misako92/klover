import Papa from "papaparse";

import type { CsvMapping, CsvPreview, ParsedImportRow } from "./types";

function normalizeCell(value: unknown) {
  return String(value ?? "").trim();
}

export function parseCsvPreview(csvText: string): CsvPreview {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    const critical = parsed.errors.find((error) => error.code !== "UndetectableDelimiter");
    if (critical) {
      throw new Error(`CSV invalide: ${critical.message}`);
    }
  }

  const rows = parsed.data
    .map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, normalizeCell(value)])))
    .filter((row) => Object.values(row).some((value) => value.length > 0));

  const headers = parsed.meta.fields?.map((field) => field.trim()) ?? [];

  return { headers, rows };
}

export function parseMappedCsvRows(csvText: string, mapping: CsvMapping) {
  const preview = parseCsvPreview(csvText);
  const requiredColumns = [mapping.sku, mapping.name, mapping.quantity];

  for (const column of requiredColumns) {
    if (!preview.headers.includes(column)) {
      throw new Error(`Colonne manquante: ${column}`);
    }
  }

  const rows: ParsedImportRow[] = [];
  const errors: string[] = [];

  preview.rows.forEach((row, index) => {
    const line = index + 2;
    const sku = normalizeCell(row[mapping.sku]);
    const name = normalizeCell(row[mapping.name]);
    const quantityRaw = normalizeCell(row[mapping.quantity]);
    const quantity = Number.parseInt(quantityRaw, 10);

    if (!sku || !name) {
      errors.push(`Ligne ${line}: SKU ou nom manquant`);
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      errors.push(`Ligne ${line}: quantité invalide`);
      return;
    }

    rows.push({
      sku,
      name,
      quantity,
      raw: row,
    });
  });

  return {
    rows,
    errors,
    headers: preview.headers,
    previewRows: preview.rows,
  };
}
