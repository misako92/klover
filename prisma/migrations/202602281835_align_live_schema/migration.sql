DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'PackagingType'
  ) THEN
    CREATE TYPE "PackagingType" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY');
  END IF;
END
$$;

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "plan" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "idu" TEXT;

UPDATE "Organization"
SET "plan" = 'starter'
WHERE "plan" IS NULL;

ALTER TABLE "Organization"
  ALTER COLUMN "plan" SET DEFAULT 'starter',
  ALTER COLUMN "plan" SET NOT NULL;

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "classificationSource" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isReusable" BOOLEAN;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reuseCount" INTEGER;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewReason" TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Product'
      AND column_name = 'classificationMethod'
  ) THEN
    UPDATE "Product"
    SET "classificationSource" = CASE
      WHEN UPPER(COALESCE("classificationMethod", '')) IN ('AUTO', 'AUTOMATIC') THEN 'AUTO'
      WHEN UPPER(COALESCE("classificationMethod", '')) IN ('AI', 'AI_SUGGESTION') THEN 'AI_SUGGESTION'
      ELSE COALESCE("classificationSource", 'MANUAL')
    END
    WHERE "classificationMethod" IS NOT NULL;

    ALTER TABLE "Product" DROP COLUMN "classificationMethod";
  END IF;
END
$$;

UPDATE "Product"
SET "classificationSource" = 'MANUAL'
WHERE "classificationSource" IS NULL;

UPDATE "Product"
SET "confidence" = 0
WHERE "confidence" IS NULL;

UPDATE "Product"
SET "isReusable" = false
WHERE "isReusable" IS NULL;

UPDATE "Product"
SET "reuseCount" = 0
WHERE "reuseCount" IS NULL;

ALTER TABLE "Product"
  ALTER COLUMN "classificationSource" SET DEFAULT 'MANUAL',
  ALTER COLUMN "classificationSource" SET NOT NULL,
  ALTER COLUMN "confidence" SET DEFAULT 0,
  ALTER COLUMN "confidence" SET NOT NULL,
  ALTER COLUMN "isReusable" SET DEFAULT false,
  ALTER COLUMN "isReusable" SET NOT NULL,
  ALTER COLUMN "reuseCount" SET DEFAULT 0,
  ALTER COLUMN "reuseCount" SET NOT NULL;

DO $$
DECLARE
  current_udt TEXT;
BEGIN
  SELECT udt_name
  INTO current_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Product'
    AND column_name = 'packagingType';

  IF current_udt IS NULL THEN
    ALTER TABLE "Product" ADD COLUMN "packagingType" "PackagingType";
    UPDATE "Product" SET "packagingType" = 'PRIMARY' WHERE "packagingType" IS NULL;
    ALTER TABLE "Product"
      ALTER COLUMN "packagingType" SET DEFAULT 'PRIMARY',
      ALTER COLUMN "packagingType" SET NOT NULL;
  ELSIF current_udt <> 'PackagingType' THEN
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "packagingType_v2" "PackagingType";

    EXECUTE '
      UPDATE "Product"
      SET "packagingType_v2" = CASE
        WHEN UPPER(COALESCE("packagingType"::text, '''')) = ''SECONDARY'' THEN ''SECONDARY''::"PackagingType"
        WHEN UPPER(COALESCE("packagingType"::text, '''')) = ''TERTIARY'' THEN ''TERTIARY''::"PackagingType"
        ELSE ''PRIMARY''::"PackagingType"
      END
    ';

    UPDATE "Product"
    SET "packagingType_v2" = 'PRIMARY'
    WHERE "packagingType_v2" IS NULL;

    ALTER TABLE "Product"
      ALTER COLUMN "packagingType_v2" SET DEFAULT 'PRIMARY',
      ALTER COLUMN "packagingType_v2" SET NOT NULL;

    ALTER TABLE "Product" DROP COLUMN "packagingType";
    ALTER TABLE "Product" RENAME COLUMN "packagingType_v2" TO "packagingType";
  ELSE
    UPDATE "Product"
    SET "packagingType" = 'PRIMARY'
    WHERE "packagingType" IS NULL;

    ALTER TABLE "Product"
      ALTER COLUMN "packagingType" SET DEFAULT 'PRIMARY',
      ALTER COLUMN "packagingType" SET NOT NULL;
  END IF;
END
$$;

DO $$
DECLARE
  current_udt TEXT;
BEGIN
  SELECT udt_name
  INTO current_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'ClassificationRule'
    AND column_name = 'outputPackaging';

  IF current_udt IS NULL THEN
    ALTER TABLE "ClassificationRule" ADD COLUMN "outputPackaging" "PackagingType";
  ELSIF current_udt <> 'PackagingType' THEN
    ALTER TABLE "ClassificationRule" ADD COLUMN IF NOT EXISTS "outputPackaging_v2" "PackagingType";

    EXECUTE '
      UPDATE "ClassificationRule"
      SET "outputPackaging_v2" = CASE
        WHEN UPPER(COALESCE("outputPackaging"::text, '''')) = ''SECONDARY'' THEN ''SECONDARY''::"PackagingType"
        WHEN UPPER(COALESCE("outputPackaging"::text, '''')) = ''TERTIARY'' THEN ''TERTIARY''::"PackagingType"
        WHEN COALESCE("outputPackaging"::text, '''') = '''' THEN NULL
        ELSE ''PRIMARY''::"PackagingType"
      END
    ';

    ALTER TABLE "ClassificationRule" DROP COLUMN "outputPackaging";
    ALTER TABLE "ClassificationRule" RENAME COLUMN "outputPackaging_v2" TO "outputPackaging";
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "Integration" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "shopUrl" TEXT NOT NULL,
  "accessToken" TEXT,
  "apiKey" TEXT,
  "apiSecret" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncAt" TIMESTAMP(3),
  "productCount" INTEGER NOT NULL DEFAULT 0,
  "orderCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "orgId" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "platform" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "shopUrl" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "accessToken" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "apiKey" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "apiSecret" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT false;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "lastSyncAt" TIMESTAMP(3);
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "productCount" INTEGER DEFAULT 0;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "orderCount" INTEGER DEFAULT 0;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);

UPDATE "Integration" SET "isActive" = false WHERE "isActive" IS NULL;
UPDATE "Integration" SET "productCount" = 0 WHERE "productCount" IS NULL;
UPDATE "Integration" SET "orderCount" = 0 WHERE "orderCount" IS NULL;
UPDATE "Integration" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE "Integration" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

ALTER TABLE "Integration"
  ALTER COLUMN "orgId" SET NOT NULL,
  ALTER COLUMN "platform" SET NOT NULL,
  ALTER COLUMN "shopUrl" SET NOT NULL,
  ALTER COLUMN "isActive" SET DEFAULT false,
  ALTER COLUMN "isActive" SET NOT NULL,
  ALTER COLUMN "productCount" SET DEFAULT 0,
  ALTER COLUMN "productCount" SET NOT NULL,
  ALTER COLUMN "orderCount" SET DEFAULT 0,
  ALTER COLUMN "orderCount" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Integration_orgId_idx" ON "Integration"("orgId");
CREATE UNIQUE INDEX IF NOT EXISTS "Integration_orgId_platform_key" ON "Integration"("orgId", "platform");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Integration_orgId_fkey'
  ) THEN
    ALTER TABLE "Integration"
      ADD CONSTRAINT "Integration_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "ContactRequest" (
  "id" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "companyType" TEXT NOT NULL,
  "productCount" TEXT NOT NULL,
  "urgency" TEXT,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "companyType" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "productCount" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "urgency" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "message" TEXT;
ALTER TABLE "ContactRequest" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "ContactRequest" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;

ALTER TABLE "ContactRequest"
  ALTER COLUMN "company" SET NOT NULL,
  ALTER COLUMN "email" SET NOT NULL,
  ALTER COLUMN "companyType" SET NOT NULL,
  ALTER COLUMN "productCount" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "createdAt" SET NOT NULL;
