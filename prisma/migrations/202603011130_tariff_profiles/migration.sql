CREATE TABLE IF NOT EXISTS "TariffProfile" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "ecoOrganism" "EcoOrganism" NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "rates" JSONB NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TariffProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TariffProfile_orgId_ecoOrganism_versionLabel_key"
ON "TariffProfile"("orgId", "ecoOrganism", "versionLabel");

CREATE INDEX IF NOT EXISTS "TariffProfile_orgId_idx" ON "TariffProfile"("orgId");
CREATE INDEX IF NOT EXISTS "TariffProfile_orgId_ecoOrganism_isActive_idx"
ON "TariffProfile"("orgId", "ecoOrganism", "isActive");

CREATE INDEX IF NOT EXISTS "TariffProfile_orgId_ecoOrganism_effectiveFrom_idx"
ON "TariffProfile"("orgId", "ecoOrganism", "effectiveFrom");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'TariffProfile_orgId_fkey'
  ) THEN
    ALTER TABLE "TariffProfile"
      ADD CONSTRAINT "TariffProfile_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
