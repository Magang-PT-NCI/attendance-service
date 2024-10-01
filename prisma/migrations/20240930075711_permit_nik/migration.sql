/*
  Warnings:

  - Added the required column `nik` to the `Permit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `permit` ADD COLUMN `nik` VARCHAR(20) NOT NULL;

-- AddForeignKey
ALTER TABLE `Permit` ADD CONSTRAINT `Permit_nik_fkey` FOREIGN KEY (`nik`) REFERENCES `EmployeeCache`(`nik`) ON DELETE RESTRICT ON UPDATE CASCADE;
