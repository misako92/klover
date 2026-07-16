-- =============================================================================
-- KLOVER — Migration SQL complète pour Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → New Query
-- =============================================================================
-- Ce script est idempotent (IF NOT EXISTS / IF EXISTS partout).
-- Il peut être relancé sans risque.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaterialType') THEN
    CREATE TYPE "MaterialType" AS ENUM ('PLASTIC', 'PLASTIC_PET', 'CARDBOARD', 'GLASS', 'ALUMINUM', 'STEEL', 'WOOD', 'TEXTILE', 'COMPOSITE', 'UNKNOWN');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EcoOrganism') THEN
    CREATE TYPE "EcoOrganism" AS ENUM ('CITEO', 'LEKO', 'ECOMAISON', 'VALDELIA', 'OTHER');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PackagingType') THEN
    CREATE TYPE "PackagingType" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClassificationStatus') THEN
    CREATE TYPE "ClassificationStatus" AS ENUM ('CONFIRMED', 'NEEDS_REVIEW', 'PENDING', 'ARCHIVED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DeclarationStatus') THEN
    CREATE TYPE "DeclarationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ARCHIVED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ImportStatus') THEN
    CREATE TYPE "ImportStatus" AS ENUM ('MAPPING_REQUIRED', 'PROCESSING', 'COMPLETED', 'FAILED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RuleType') THEN
    CREATE TYPE "RuleType" AS ENUM ('REGEX', 'KEYWORD', 'SKU_PREFIX');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubscriptionStatus') THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'UNPAID');
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. CORE TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- User
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "avatar" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Organization
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "logo" TEXT,
  "plan" TEXT NOT NULL DEFAULT 'free',
  "idu" TEXT,
  "stripeCustomerId" TEXT,
  "stripeSubscriptionId" TEXT,
  "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "trialEndsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);
-- Add columns first (needed if table already exists without Stripe fields)
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'free';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "idu" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" DEFAULT 'ACTIVE';
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);

-- Indexes (after columns exist)
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "Organization_stripeSubscriptionId_key" ON "Organization"("stripeSubscriptionId");

-- OrganizationMember
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "userId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_userId_orgId_key" ON "OrganizationMember"("userId", "orgId");
CREATE INDEX IF NOT EXISTS "OrganizationMember_orgId_idx" ON "OrganizationMember"("orgId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationMember_userId_fkey') THEN
    ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationMember_orgId_fkey') THEN
    ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- OrganizationInvitation
CREATE TABLE IF NOT EXISTS "OrganizationInvitation" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
  "token" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "invitedByUserId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_orgId_idx" ON "OrganizationInvitation"("orgId");
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");
CREATE INDEX IF NOT EXISTS "OrganizationInvitation_status_idx" ON "OrganizationInvitation"("status");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationInvitation_orgId_fkey') THEN
    ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OrganizationInvitation_invitedByUserId_fkey') THEN
    ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedByUserId_fkey"
      FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DOMAIN TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Product
CREATE TABLE IF NOT EXISTS "Product" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "materialType" "MaterialType",
  "ecoOrganism" "EcoOrganism",
  "packagingType" "PackagingType" NOT NULL DEFAULT 'PRIMARY',
  "isReusable" BOOLEAN NOT NULL DEFAULT false,
  "reuseCount" INTEGER NOT NULL DEFAULT 0,
  "weightG" INTEGER,
  "quantitySold" INTEGER,
  "status" "ClassificationStatus" NOT NULL DEFAULT 'NEEDS_REVIEW',
  "classificationSource" TEXT NOT NULL DEFAULT 'MANUAL',
  "reviewReason" TEXT,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);
-- Add columns first (needed if table already exists without newer fields)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "classificationSource" TEXT DEFAULT 'MANUAL';
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "confidence" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isReusable" BOOLEAN DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reuseCount" INTEGER DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewReason" TEXT;

-- Indexes (after columns exist)
CREATE INDEX IF NOT EXISTS "Product_orgId_idx" ON "Product"("orgId");
CREATE INDEX IF NOT EXISTS "Product_orgId_status_idx" ON "Product"("orgId", "status");
CREATE INDEX IF NOT EXISTS "Product_sku_idx" ON "Product"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_orgId_sku_key" ON "Product"("orgId", "sku");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Product_orgId_fkey') THEN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ImportSession
CREATE TABLE IF NOT EXISTS "ImportSession" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "status" "ImportStatus" NOT NULL DEFAULT 'MAPPING_REQUIRED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ImportSession_orgId_idx" ON "ImportSession"("orgId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ImportSession_orgId_fkey') THEN
    ALTER TABLE "ImportSession" ADD CONSTRAINT "ImportSession_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ComplianceDeclaration
CREATE TABLE IF NOT EXISTS "ComplianceDeclaration" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "period" TIMESTAMP(3) NOT NULL,
  "ecoOrganism" "EcoOrganism" NOT NULL,
  "status" "DeclarationStatus" NOT NULL DEFAULT 'DRAFT',
  "totals" JSONB NOT NULL,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComplianceDeclaration_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ComplianceDeclaration_orgId_idx" ON "ComplianceDeclaration"("orgId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ComplianceDeclaration_orgId_fkey') THEN
    ALTER TABLE "ComplianceDeclaration" ADD CONSTRAINT "ComplianceDeclaration_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ClassificationRule
CREATE TABLE IF NOT EXISTS "ClassificationRule" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "inputField" TEXT NOT NULL,
  "type" "RuleType" NOT NULL,
  "pattern" TEXT NOT NULL,
  "outputMaterial" "MaterialType",
  "outputEcoOrganism" "EcoOrganism",
  "outputPackaging" "PackagingType",
  "confidenceBoost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassificationRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ClassificationRule_orgId_idx" ON "ClassificationRule"("orgId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassificationRule_orgId_fkey') THEN
    ALTER TABLE "ClassificationRule" ADD CONSTRAINT "ClassificationRule_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Order
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "customerName" TEXT,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Order_orgId_idx" ON "Order"("orgId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Order_orgId_fkey') THEN
    ALTER TABLE "Order" ADD CONSTRAINT "Order_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. AUDIT & MONITORING TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AuditLog_orgId_idx" ON "AuditLog"("orgId");
CREATE INDEX IF NOT EXISTS "AuditLog_orgId_createdAt_idx" ON "AuditLog"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_orgId_fkey') THEN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Alert
CREATE TABLE IF NOT EXISTS "Alert" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'INFO',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "entityType" TEXT,
  "entityId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Alert_orgId_idx" ON "Alert"("orgId");
CREATE INDEX IF NOT EXISTS "Alert_orgId_isRead_idx" ON "Alert"("orgId", "isRead");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Alert_orgId_fkey') THEN
    ALTER TABLE "Alert" ADD CONSTRAINT "Alert_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- EcoOrganismConfig
CREATE TABLE IF NOT EXISTS "EcoOrganismConfig" (
  "id" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "organism" "EcoOrganism" NOT NULL,
  "apiKey" TEXT,
  "apiSecret" TEXT,
  "portalLogin" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EcoOrganismConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EcoOrganismConfig_orgId_organism_key" ON "EcoOrganismConfig"("orgId", "organism");
CREATE INDEX IF NOT EXISTS "EcoOrganismConfig_orgId_idx" ON "EcoOrganismConfig"("orgId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EcoOrganismConfig_orgId_fkey') THEN
    ALTER TABLE "EcoOrganismConfig" ADD CONSTRAINT "EcoOrganismConfig_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Integration
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Integration_orgId_idx" ON "Integration"("orgId");
CREATE UNIQUE INDEX IF NOT EXISTS "Integration_orgId_platform_key" ON "Integration"("orgId", "platform");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Integration_orgId_fkey') THEN
    ALTER TABLE "Integration" ADD CONSTRAINT "Integration_orgId_fkey"
      FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- TariffProfile (global — no orgId)
CREATE TABLE IF NOT EXISTS "TariffProfile" (
  "id" TEXT NOT NULL,
  "ecoOrganism" "EcoOrganism" NOT NULL,
  "versionLabel" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "rates" JSONB NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TariffProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TariffProfile_ecoOrganism_versionLabel_key" ON "TariffProfile"("ecoOrganism", "versionLabel");
CREATE INDEX IF NOT EXISTS "TariffProfile_ecoOrganism_isActive_idx" ON "TariffProfile"("ecoOrganism", "isActive");
CREATE INDEX IF NOT EXISTS "TariffProfile_ecoOrganism_effectiveFrom_idx" ON "TariffProfile"("ecoOrganism", "effectiveFrom");

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CONTACT & NEWSLETTER
-- ─────────────────────────────────────────────────────────────────────────────

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

CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ImportSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComplianceDeclaration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassificationRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EcoOrganismConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TariffProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- ✅ DONE
-- ─────────────────────────────────────────────────────────────────────────────
