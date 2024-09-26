-- CreateTable
CREATE TABLE `Employee` (
    `nik` VARCHAR(20) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `area` VARCHAR(50) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `position` ENUM('OnSite', 'Koordinator') NOT NULL DEFAULT 'OnSite',
    `profile_photo` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`nik`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nik` VARCHAR(20) NOT NULL,
    `check_in_id` INTEGER NULL,
    `check_out_id` INTEGER NULL,
    `permit_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `status` ENUM('presence', 'permit', 'absent') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Check` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('in', 'out') NOT NULL,
    `time` TIME NOT NULL,
    `location` VARCHAR(50) NOT NULL,
    `photo` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attendance_id` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `status` ENUM('done', 'progress') NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nik` VARCHAR(20) NOT NULL,
    `reason` ENUM('sick', 'family_matters', 'urgent_matters', 'other') NOT NULL,
    `start_date` DATE NOT NULL,
    `duration` INTEGER NOT NULL,
    `permission_letter` VARCHAR(255) NOT NULL,
    `approved` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_in_id_fkey` FOREIGN KEY (`check_in_id`) REFERENCES `Check`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_out_id_fkey` FOREIGN KEY (`check_out_id`) REFERENCES `Check`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_permit_id_fkey` FOREIGN KEY (`permit_id`) REFERENCES `Permit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_nik_fkey` FOREIGN KEY (`nik`) REFERENCES `Employee`(`nik`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_attendance_id_fkey` FOREIGN KEY (`attendance_id`) REFERENCES `Attendance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
