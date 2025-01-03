/*
  Warnings:

  - A unique constraint covering the columns `[entryPointId]` on the table `WorkflowTemplate` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WorkflowTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "WorkflowTemplate" ADD COLUMN     "entryPointId" TEXT,
ADD COLUMN     "status" "WorkflowTemplateStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_entryPointId_key" ON "WorkflowTemplate"("entryPointId");

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_entryPointId_fkey" FOREIGN KEY ("entryPointId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;
