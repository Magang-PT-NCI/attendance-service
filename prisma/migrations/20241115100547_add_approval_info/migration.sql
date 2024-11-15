-- AlterTable
ALTER TABLE `attendanceconfirmation` ADD COLUMN `approvalNik` VARCHAR(50) NULL,
    ADD COLUMN `deniedDescription` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `overtime` ADD COLUMN `approvalNik` VARCHAR(50) NULL,
    ADD COLUMN `deniedDescription` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `permit` ADD COLUMN `approvalNik` VARCHAR(50) NULL,
    ADD COLUMN `deniedDescription` VARCHAR(255) NULL;

-- AddForeignKey
ALTER TABLE `Permit` ADD CONSTRAINT `Permit_approvalNik_fkey` FOREIGN KEY (`approvalNik`) REFERENCES `EmployeeCache`(`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Overtime` ADD CONSTRAINT `Overtime_approvalNik_fkey` FOREIGN KEY (`approvalNik`) REFERENCES `EmployeeCache`(`nik`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceConfirmation` ADD CONSTRAINT `AttendanceConfirmation_approvalNik_fkey` FOREIGN KEY (`approvalNik`) REFERENCES `EmployeeCache`(`nik`) ON DELETE SET NULL ON UPDATE CASCADE;
