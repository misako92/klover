-- Row Level Security: enablement + policies for all tables (public schema).
-- Tables with RLS enabled but NO policy are deny-all through the Supabase
-- Data API (anon/authenticated) on purpose: they are only touched server-side
-- through Prisma (postgres role, bypasses RLS).

-- 0. Server-side-only tables: RLS on, no policies (deny-all via Data API)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EcoOrganismConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsletterSubscriber" ENABLE ROW LEVEL SECURITY;

-- 1. Organizations
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organizations" 
ON "Organization" 
FOR SELECT 
USING (
  id IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- 2. Organization Members
ALTER TABLE "OrganizationMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view other members of their orgs"
ON "OrganizationMember"
FOR SELECT
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- 2b. Organization Invitations
ALTER TABLE "OrganizationInvitation" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view invitations of their orgs"
ON "OrganizationInvitation"
FOR SELECT
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- 3. Products (and other org-scoped entities)
-- We'll use a generic pattern for table with "orgId"

ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access products of their orgs"
ON "Product"
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access orders of their orgs"
ON "Order"
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

ALTER TABLE "ImportSession" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access imports of their orgs"
ON "ImportSession"
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

ALTER TABLE "ComplianceDeclaration" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access declarations of their orgs"
ON "ComplianceDeclaration"
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

ALTER TABLE "ClassificationRule" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access classification rules of their orgs"
ON "ClassificationRule"
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access integrations of their orgs"
ON "Integration"
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- TariffProfile is a global read-only catalog: SELECT only.
-- (Without FOR SELECT, the policy would allow INSERT/UPDATE/DELETE to any
-- authenticated user via the Data API. Writes go through the server role only.)
ALTER TABLE "TariffProfile" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view official tariff profiles"
ON "TariffProfile"
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);

ALTER TABLE "ContactRequest" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = '_prisma_migrations'
  ) THEN
    ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'prisma_migrations'
  ) THEN
    ALTER TABLE "prisma_migrations" ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- ... Repeat for other tables with orgId ...

-- Write policies (INSERT/UPDATE/DELETE) for org-scoped tables

-- Organization (no INSERT policy here; use service role or add created_by)
CREATE POLICY "Org admins can update their organizations"
ON "Organization"
FOR UPDATE
USING (
  id IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Org owners can delete their organizations"
ON "Organization"
FOR DELETE
USING (
  id IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" = 'OWNER'
  )
);

-- Organization Members
CREATE POLICY "Org admins can add members"
ON "OrganizationMember"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Org admins can update members"
ON "OrganizationMember"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Org admins can delete members"
ON "OrganizationMember"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Org admins can insert invitations"
ON "OrganizationInvitation"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Org admins can update invitations"
ON "OrganizationInvitation"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
);

CREATE POLICY "Org admins can delete invitations"
ON "OrganizationInvitation"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
      AND "role" IN ('OWNER', 'ADMIN')
  )
);

-- Product
CREATE POLICY "Users can insert products for their orgs"
ON "Product"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update products of their orgs"
ON "Product"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete products of their orgs"
ON "Product"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- Order
CREATE POLICY "Users can insert orders for their orgs"
ON "Order"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update orders of their orgs"
ON "Order"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete orders of their orgs"
ON "Order"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- Import Session
CREATE POLICY "Users can insert imports for their orgs"
ON "ImportSession"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update imports of their orgs"
ON "ImportSession"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete imports of their orgs"
ON "ImportSession"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- Compliance Declaration
CREATE POLICY "Users can insert declarations for their orgs"
ON "ComplianceDeclaration"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update declarations of their orgs"
ON "ComplianceDeclaration"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete declarations of their orgs"
ON "ComplianceDeclaration"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- Classification Rule
CREATE POLICY "Users can insert classification rules for their orgs"
ON "ClassificationRule"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update classification rules of their orgs"
ON "ClassificationRule"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete classification rules of their orgs"
ON "ClassificationRule"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId" FROM "OrganizationMember" WHERE "userId" = auth.uid()::text
  )
);

-- Integration
CREATE POLICY "Users can insert integrations for their orgs"
ON "Integration"
FOR INSERT
WITH CHECK (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can update integrations of their orgs"
ON "Integration"
FOR UPDATE
USING (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
  )
)
WITH CHECK (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
  )
);

CREATE POLICY "Users can delete integrations of their orgs"
ON "Integration"
FOR DELETE
USING (
  "orgId" IN (
    SELECT "orgId"
    FROM "OrganizationMember"
    WHERE "userId" = auth.uid()::text
  )
);

-- ContactRequest
-- No public policy on purpose: contact requests are only handled server-side.
