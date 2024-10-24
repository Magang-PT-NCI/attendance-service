-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nik` VARCHAR(20) NOT NULL,
    `check_in_id` INTEGER NULL,
    `check_out_id` INTEGER NULL,
    `permit_id` INTEGER NULL,
    `overtime_id` INTEGER NULL,
    `date` DATE NOT NULL,
    `status` ENUM('presence', 'permit', 'absent') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeCache` (
    `nik` VARCHAR(20) NOT NULL,
    `name` VARCHAR(50) NOT NULL,

    PRIMARY KEY (`nik`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Check` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('in', 'out') NOT NULL,
    `time` TIME NOT NULL,
    `location` VARCHAR(50) NULL,
    `photo` VARCHAR(255) NULL,

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
    `reason` ENUM('sakit', 'urusan_mendadak', 'cuti', 'duka', 'melahirkan', 'lainnya') NOT NULL,
    `start_date` DATE NOT NULL,
    `duration` INTEGER NOT NULL,
    `permission_letter` VARCHAR(255) NOT NULL,
    `checked` BOOLEAN NOT NULL DEFAULT false,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Overtime` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `checked` BOOLEAN NOT NULL DEFAULT false,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceConfirmation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attendance_id` INTEGER NOT NULL,
    `type` ENUM('check_in', 'check_out', 'permit') NOT NULL,
    `description` TEXT NOT NULL,
    `attachment` VARCHAR(255) NOT NULL,
    `checked` BOOLEAN NOT NULL DEFAULT false,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` ENUM('sakit', 'urusan_mendadak', 'cuti', 'duka', 'melahirkan', 'lainnya') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_in_id_fkey` FOREIGN KEY (`check_in_id`) REFERENCES `Check`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_out_id_fkey` FOREIGN KEY (`check_out_id`) REFERENCES `Check`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_permit_id_fkey` FOREIGN KEY (`permit_id`) REFERENCES `Permit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_overtime_id_fkey` FOREIGN KEY (`overtime_id`) REFERENCES `Overtime`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_nik_fkey` FOREIGN KEY (`nik`) REFERENCES `EmployeeCache`(`nik`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_attendance_id_fkey` FOREIGN KEY (`attendance_id`) REFERENCES `Attendance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permit` ADD CONSTRAINT `Permit_nik_fkey` FOREIGN KEY (`nik`) REFERENCES `EmployeeCache`(`nik`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceConfirmation` ADD CONSTRAINT `AttendanceConfirmation_attendance_id_fkey` FOREIGN KEY (`attendance_id`) REFERENCES `Attendance`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
