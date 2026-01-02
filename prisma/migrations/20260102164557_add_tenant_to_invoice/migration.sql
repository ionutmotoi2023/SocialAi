-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "tenantId" TEXT;

-- Populate tenantId from subscription relationship (for existing invoices)
UPDATE "invoices" 
SET "tenantId" = "subscriptions"."tenantId"
FROM "subscriptions"
WHERE "invoices"."subscriptionId" = "subscriptions"."id";

-- Make tenantId required after populating
ALTER TABLE "invoices" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "invoices_tenantId_idx" ON "invoices"("tenantId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
