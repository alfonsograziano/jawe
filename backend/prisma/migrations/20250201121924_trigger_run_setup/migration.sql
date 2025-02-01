/*
  Warnings:

  - A unique constraint covering the columns `[triggerRunId]` on the table `WorkflowRun` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `triggerRunId` to the `WorkflowRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkflowRun" ADD COLUMN     "triggerRunId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TriggerRun" (
    "id" TEXT NOT NULL,
    "workflowRunId" TEXT,
    "output" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "triggerId" TEXT NOT NULL,

    CONSTRAINT "TriggerRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TriggerRun_workflowRunId_key" ON "TriggerRun"("workflowRunId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRun_triggerRunId_key" ON "WorkflowRun"("triggerRunId");

-- AddForeignKey
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_triggerRunId_fkey" FOREIGN KEY ("triggerRunId") REFERENCES "TriggerRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerRun" ADD CONSTRAINT "TriggerRun_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
