/*
  Warnings:

  - Added the required column `area` to the `EmployeeCache` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employeecache` ADD COLUMN `area` VARCHAR(50) NOT NULL;
