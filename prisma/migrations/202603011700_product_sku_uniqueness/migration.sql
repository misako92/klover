UPDATE "Product"
SET "sku" = NULL
WHERE "sku" IS NOT NULL
  AND BTRIM("sku") = '';

UPDATE "Product"
SET "sku" = UPPER(BTRIM("sku"))
WHERE "sku" IS NOT NULL;

WITH ranked_products AS (
  SELECT
    id,
    "orgId",
    "sku",
    COALESCE("quantitySold", 0) AS quantity_sold,
    ROW_NUMBER() OVER (
      PARTITION BY "orgId", "sku"
      ORDER BY
        CASE WHEN "materialType" IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE WHEN "ecoOrganism" IS NOT NULL THEN 1 ELSE 0 END DESC,
        CASE WHEN "weightG" IS NOT NULL AND "weightG" > 0 THEN 1 ELSE 0 END DESC,
        CASE WHEN "status" = 'CONFIRMED' THEN 1 ELSE 0 END DESC,
        "updatedAt" DESC,
        id ASC
    ) AS row_rank
  FROM "Product"
  WHERE "sku" IS NOT NULL
),
canonical_products AS (
  SELECT
    ranked_products.id,
    ranked_products."orgId",
    ranked_products."sku",
    SUM(duplicates.quantity_sold) AS merged_quantity
  FROM ranked_products
  JOIN ranked_products AS duplicates
    ON duplicates."orgId" = ranked_products."orgId"
   AND duplicates."sku" = ranked_products."sku"
  WHERE ranked_products.row_rank = 1
  GROUP BY ranked_products.id, ranked_products."orgId", ranked_products."sku"
),
duplicate_rows AS (
  SELECT id
  FROM ranked_products
  WHERE row_rank > 1
)
UPDATE "Product" AS product
SET "quantitySold" = canonical_products.merged_quantity
FROM canonical_products
WHERE product.id = canonical_products.id;

DELETE FROM "Product"
WHERE id IN (
  SELECT id
  FROM (
    SELECT id
    FROM (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY "orgId", "sku"
          ORDER BY
            CASE WHEN "materialType" IS NOT NULL THEN 1 ELSE 0 END DESC,
            CASE WHEN "ecoOrganism" IS NOT NULL THEN 1 ELSE 0 END DESC,
            CASE WHEN "weightG" IS NOT NULL AND "weightG" > 0 THEN 1 ELSE 0 END DESC,
            CASE WHEN "status" = 'CONFIRMED' THEN 1 ELSE 0 END DESC,
            "updatedAt" DESC,
            id ASC
        ) AS row_rank
      FROM "Product"
      WHERE "sku" IS NOT NULL
    ) ranked
    WHERE row_rank > 1
  ) duplicate_ids
);

CREATE UNIQUE INDEX IF NOT EXISTS "Product_orgId_sku_key" ON "Product"("orgId", "sku");
