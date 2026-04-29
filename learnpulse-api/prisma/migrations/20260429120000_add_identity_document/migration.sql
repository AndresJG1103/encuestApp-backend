-- AlterTable: add identityDocument column to User
ALTER TABLE "User" ADD COLUMN "identityDocument" VARCHAR(30) NOT NULL DEFAULT '';

-- Remove the temporary default
ALTER TABLE "User" ALTER COLUMN "identityDocument" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "User_identityDocument_tenantId_key" ON "User"("identityDocument", "tenantId");
