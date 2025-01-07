/*
  Warnings:

  - You are about to drop the column `settings` on the `Trigger` table. All the data in the column will be lost.
  - Added the required column `inputs` to the `Trigger` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trigger" DROP COLUMN "settings",
ADD COLUMN     "inputs" JSONB NOT NULL;
