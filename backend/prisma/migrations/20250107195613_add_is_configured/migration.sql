-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "isConfigured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Trigger" ADD COLUMN     "isConfigured" BOOLEAN NOT NULL DEFAULT false;
