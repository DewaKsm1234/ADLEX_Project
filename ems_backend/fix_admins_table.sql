-- Fix admins table structure
-- This script ensures the id column has AUTO_INCREMENT

-- Drop the existing admins table if it exists
DROP TABLE IF EXISTS `admins`;

-- Recreate the admins table with proper AUTO_INCREMENT
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(50) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_id` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Verify the table structure
DESCRIBE `admins`;
