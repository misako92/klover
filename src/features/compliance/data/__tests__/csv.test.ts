import { describe, expect, it } from "vitest";

import { parseMappedCsvRows } from "../csv";

describe("parseMappedCsvRows", () => {
  it("maps required columns and parses numeric quantity", () => {
    const csv = ["SKU,Nom,Quantite", "A-001,Bouteille PET 500ml,12", "A-002,Boite carton S,7"].join("\n");

    const result = parseMappedCsvRows(csv, {
      sku: "SKU",
      name: "Nom",
      quantity: "Quantite",
    });

    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ sku: "A-001", name: "Bouteille PET 500ml", quantity: 12 });
  });
});
