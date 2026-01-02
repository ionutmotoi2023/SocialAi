-- CreateEnum
CREATE TYPE "LinkedInProfileType" AS ENUM ('PERSONAL', 'COMPANY_PAGE');

-- AlterTable
ALTER TABLE "linkedin_integrations" 
ADD COLUMN "profileType" "LinkedInProfileType" NOT NULL DEFAULT 'PERSONAL',
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "organizationName" TEXT,
ADD COLUMN "organizationUrn" TEXT;

-- DropIndex (remove unique constraint from tenantId)
DROP INDEX IF EXISTS "linkedin_integrations_tenantId_key";

-- CreateIndex (add compound unique constraint)
CREATE UNIQUE INDEX "linkedin_integrations_tenantId_linkedinId_key" 
ON "linkedin_integrations"("tenantId", "linkedinId");
