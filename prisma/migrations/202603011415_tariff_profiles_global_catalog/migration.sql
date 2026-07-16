DROP INDEX IF EXISTS "TariffProfile_orgId_ecoOrganism_versionLabel_key";
DROP INDEX IF EXISTS "TariffProfile_orgId_idx";
DROP INDEX IF EXISTS "TariffProfile_orgId_ecoOrganism_isActive_idx";
DROP INDEX IF EXISTS "TariffProfile_orgId_ecoOrganism_effectiveFrom_idx";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TariffProfile_orgId_fkey'
  ) THEN
    ALTER TABLE "TariffProfile" DROP CONSTRAINT "TariffProfile_orgId_fkey";
  END IF;
END
$$;

ALTER TABLE "TariffProfile" DROP COLUMN IF EXISTS "orgId";

CREATE UNIQUE INDEX IF NOT EXISTS "TariffProfile_ecoOrganism_versionLabel_key"
ON "TariffProfile"("ecoOrganism", "versionLabel");

CREATE INDEX IF NOT EXISTS "TariffProfile_ecoOrganism_isActive_idx"
ON "TariffProfile"("ecoOrganism", "isActive");

CREATE INDEX IF NOT EXISTS "TariffProfile_ecoOrganism_effectiveFrom_idx"
ON "TariffProfile"("ecoOrganism", "effectiveFrom");
