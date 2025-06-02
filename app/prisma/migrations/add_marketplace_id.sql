-- Add marketplaceId column to Plugin table
ALTER TABLE "Plugin" ADD COLUMN "marketplaceId" VARCHAR(100);

-- Create index for faster marketplace lookups
CREATE INDEX "Plugin_marketplaceId_idx" ON "Plugin"("marketplaceId");
