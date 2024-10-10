-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `overtime_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `permit` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `Overtime` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `approved` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_overtime_id_fkey` FOREIGN KEY (`overtime_id`) REFERENCES `Overtime`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
