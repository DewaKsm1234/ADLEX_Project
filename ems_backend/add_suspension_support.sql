-- Add suspension support to EMS database
-- This script adds status fields to support admin suspension functionality

-- Add status field to admins table
ALTER TABLE `admins` ADD COLUMN `status` enum('active','suspended') DEFAULT 'active' AFTER `phone`;

-- Add status field to users_login table
ALTER TABLE `users_login` ADD COLUMN `status` enum('active','suspended') DEFAULT 'active' AFTER `role`;

-- Add status field to supervisors table
ALTER TABLE `supervisors` ADD COLUMN `status` enum('active','suspended') DEFAULT 'active' AFTER `phone`;

-- Add admin_id field to supervisors table if it doesn't exist
-- This allows supervisors to be assigned to specific admins
ALTER TABLE `supervisors` ADD COLUMN `admin_id` varchar(50) DEFAULT NULL AFTER `status`;

-- Add index for better performance
CREATE INDEX `idx_supervisors_admin_id` ON `supervisors` (`admin_id`);
CREATE INDEX `idx_supervisors_status` ON `supervisors` (`status`);
CREATE INDEX `idx_admins_status` ON `admins` (`status`);
CREATE INDEX `idx_users_login_status` ON `users_login` (`status`);

-- Update existing records to have active status
UPDATE `admins` SET `status` = 'active' WHERE `status` IS NULL;
UPDATE `users_login` SET `status` = 'active' WHERE `status` IS NULL;
UPDATE `supervisors` SET `status` = 'active' WHERE `status` IS NULL;
