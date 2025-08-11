-- Supervisor Suspension Database Changes
-- This script adds suspension support to the supervisors table and related functionality

-- Add status field to supervisors table
ALTER TABLE `supervisors` ADD COLUMN `status` enum('active','suspended') DEFAULT 'active' AFTER `phone`;

-- Add admin_id field to supervisors table if it doesn't exist
-- This allows supervisors to be assigned to specific admins
ALTER TABLE `supervisors` ADD COLUMN `admin_id` varchar(50) DEFAULT NULL AFTER `phone`;

-- Add status field to users_login table if it doesn't exist
ALTER TABLE `users_login` ADD COLUMN `status` enum('active','suspended') DEFAULT 'active' AFTER `role`;

-- Add indexes for better performance
CREATE INDEX `idx_supervisors_status` ON `supervisors` (`status`);
CREATE INDEX `idx_supervisors_admin_id` ON `supervisors` (`admin_id`);
CREATE INDEX `idx_users_login_status` ON `users_login` (`status`);

-- Update existing records to have active status
UPDATE `supervisors` SET `status` = 'active' WHERE `status` IS NULL;
UPDATE `users_login` SET `status` = 'active' WHERE `status` IS NULL;

-- Verify the changes
SELECT 'Supervisors table structure:' as info;
DESCRIBE supervisors;

SELECT 'Users_login table structure:' as info;
DESCRIBE users_login;

SELECT 'Sample supervisors with status:' as info;
SELECT supervisor_id, first_name, last_name, status, admin_id FROM supervisors LIMIT 5;

SELECT 'Sample users_login with status:' as info;
SELECT username, role, status FROM users_login WHERE role = 'supervisor' LIMIT 5;
