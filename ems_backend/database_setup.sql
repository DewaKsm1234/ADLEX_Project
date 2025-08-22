CREATE DATABASE  IF NOT EXISTS `ems_dbnew` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ems_dbnew`;
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: ems_dbnew
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` varchar(50) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','suspended') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `admin_id` (`admin_id`),
  KEY `idx_admins_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (2,'admin','Admin','Name','admin@example.com','7559023849','suspended','2025-08-01 06:31:01'),(5,'admin1','Ram','K','rk@gmail.com','8922189384','active','2025-08-11 06:12:29');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_logs`
--

DROP TABLE IF EXISTS `device_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_logs` (
  `tb_device_id` varchar(64) NOT NULL,
  `log_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CUR` float DEFAULT NULL,
  `VBUS` float DEFAULT NULL,
  `SPD` float DEFAULT NULL,
  `RPM` float DEFAULT NULL,
  `POS` float DEFAULT NULL,
  `DeviceId` varchar(5) DEFAULT NULL,
  `Id` varchar(20) DEFAULT NULL,
  `CSQ` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`tb_device_id`,`log_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
/*!50100 PARTITION BY RANGE (to_days(`log_time`))
(PARTITION p20250715 VALUES LESS THAN (739813) ENGINE = InnoDB,
 PARTITION pMAX VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_logs`
--

LOCK TABLES `device_logs` WRITE;
/*!40000 ALTER TABLE `device_logs` DISABLE KEYS */;
INSERT INTO `device_logs` VALUES ('961a8e50-0f92-11f0-86ac-951bbb28eae1','2025-07-21 14:14:57',135,0,4,3000,0,'10002',NULL,NULL),('961a8e50-0f92-11f0-86ac-951bbb28eae1','2025-07-21 14:16:04',135,0,4,3000,0,'10002',NULL,NULL);
/*!40000 ALTER TABLE `device_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tb_device_id` varchar(64) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `DeviceId` varchar(5) DEFAULT NULL,
  `MacAddress` varchar(255) DEFAULT NULL,
  `SerialNum` varchar(255) DEFAULT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `Status` varchar(32) DEFAULT NULL,
  `address` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tb_device_id` (`tb_device_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8242 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
INSERT INTO `devices` VALUES (4825,'961a8e50-0f92-11f0-86ac-951bbb28eae1','Lift1','10002','00:1b:63:84:83:d4','ABC1234567890','Delhi','Active',NULL),(4826,'c910ab00-0f92-11f0-9092-2f72379381be','Lift3','10003','00:1b:67:35:45:f8','ABC123385905','116','Active',NULL),(4827,'b8f76bf0-0f92-11f0-8f83-43727cd6bc90','Lift2','10002','00:1b:63:84:83:d4','ABC1234567890','Delhi','Active',NULL),(4828,'f5f48510-0f92-11f0-b4bd-8b00c50fcae5','Lift7','10007','00:1b:67:35:45:f8','ABC123385905','Delhi','Active',NULL),(4829,'d5647da0-0f92-11f0-86ac-951bbb28eae1','Lift4','10004','00:1b:65:65:45:e6','ABC123454567','Delhi','Active',NULL),(4830,'ff95bad0-0f92-11f0-b4bd-8b00c50fcae5','Lift8','10008','00:1b:65:65:45:e6','ABC123454567','Delhi','Active',NULL),(4833,'eac0c870-0f92-11f0-8f83-43727cd6bc90','Lift6','10006','00:1b:63:84:83:d4','ABC1234567890','Delhi','Active',NULL),(4834,'e02924c0-0f92-11f0-8f83-43727cd6bc90','Lift5','10005','00:1b:65:85:45:e6','ABC1234567890','Delhi','Active',NULL);
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supervisors`
--

DROP TABLE IF EXISTS `supervisors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supervisors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supervisor_id` varchar(50) NOT NULL,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','suspended') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `admin_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supervisor_id` (`supervisor_id`),
  KEY `fk_admin` (`admin_id`),
  KEY `idx_supervisors_admin_id` (`admin_id`),
  CONSTRAINT `fk_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supervisors`
--

LOCK TABLES `supervisors` WRITE;
/*!40000 ALTER TABLE `supervisors` DISABLE KEYS */;
INSERT INTO `supervisors` VALUES (12,'SP1','Naman','Ojha','no@gmail.com','9890328955','active','2025-07-15 06:21:49','admin1'),(13,'SP2','Ashok','Kumar','ak@gmail.com','8888884444','active','2025-07-15 06:24:38','admin1'),(15,'demo','Demo','sr','dewanshumanke@gmail.com','7558348105','active','2025-08-06 08:43:49',NULL);
/*!40000 ALTER TABLE `supervisors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `telemetry_device`
--

DROP TABLE IF EXISTS `telemetry_device`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `telemetry_device` (
  `tb_device_id` varchar(64) NOT NULL,
  `Location` varchar(255) DEFAULT NULL,
  `MacAddress` varchar(64) DEFAULT NULL,
  `SerialNum` varchar(64) DEFAULT NULL,
  `Status` varchar(32) DEFAULT NULL,
  `TotalDistanceTravelled` double DEFAULT NULL,
  `AlarmActive` varchar(32) DEFAULT NULL,
  `DeviceId` varchar(5) DEFAULT NULL,
  `ERR` int DEFAULT NULL,
  `CFL` tinyint DEFAULT NULL,
  `POS` int DEFAULT NULL,
  `SPD` int DEFAULT NULL,
  `VBUS` int DEFAULT NULL,
  `CUR` int DEFAULT NULL,
  `ID` varchar(32) DEFAULT NULL,
  `CSQ` varchar(8) DEFAULT NULL,
  `LAT` varchar(16) DEFAULT NULL,
  `LNG` varchar(16) DEFAULT NULL,
  `TWTIME` int DEFAULT NULL,
  `TWCOUNT` int DEFAULT NULL,
  `DIRCHG` int DEFAULT NULL,
  `DIRCNT` int DEFAULT NULL,
  `TRVTIME` int DEFAULT NULL,
  `DOORA` tinyint DEFAULT NULL,
  `DOORB` tinyint DEFAULT NULL,
  `RDTIME` int DEFAULT NULL,
  `STPCNT` int DEFAULT NULL,
  `RPM` int DEFAULT NULL,
  PRIMARY KEY (`tb_device_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `telemetry_device`
--

LOCK TABLES `telemetry_device` WRITE;
/*!40000 ALTER TABLE `telemetry_device` DISABLE KEYS */;
INSERT INTO `telemetry_device` VALUES ('961a8e50-0f92-11f0-86ac-951bbb28eae1','Delhi','00:1b:63:84:83:d4','ABC1234567890','Active',NULL,NULL,'10002',0,0,0,0,0,0,'LIFT_860269064249352','20','0.0','0.0',0,0,0,0,0,0,0,0,0,0),('b8f76bf0-0f92-11f0-8f83-43727cd6bc90','Delhi','00:1b:63:84:83:d4','ABC1234567890','Active',NULL,NULL,'10002',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('c910ab00-0f92-11f0-9092-2f72379381be','116','00:1b:67:35:45:f8','ABC123385905','Active',NULL,NULL,'10003',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('d5647da0-0f92-11f0-86ac-951bbb28eae1','Delhi','00:1b:65:65:45:e6','ABC123454567','Active',NULL,NULL,'10004',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('eac0c870-0f92-11f0-8f83-43727cd6bc90','Delhi','00:1b:63:84:83:d4','ABC1234567890','Active',NULL,NULL,'10006',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),('f5f48510-0f92-11f0-b4bd-8b00c50fcae5','Delhi','00:1b:67:35:45:f8','ABC123385905','Active',NULL,NULL,'10007',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `telemetry_device` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_devices`
--

DROP TABLE IF EXISTS `user_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_devices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tb_device_id` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_devices_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_devices`
--

LOCK TABLES `user_devices` WRITE;
/*!40000 ALTER TABLE `user_devices` DISABLE KEYS */;
INSERT INTO `user_devices` VALUES (39,31,'961a8e50-0f92-11f0-86ac-951bbb28eae1'),(40,32,'c910ab00-0f92-11f0-9092-2f72379381be'),(42,32,'d5647da0-0f92-11f0-86ac-951bbb28eae1'),(43,38,'f5f48510-0f92-11f0-b4bd-8b00c50fcae5'),(44,39,'b8f76bf0-0f92-11f0-8f83-43727cd6bc90');
/*!40000 ALTER TABLE `user_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `nationality` varchar(50) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `supervisor_id` varchar(50) DEFAULT NULL,
  `last_name` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`first_name`),
  UNIQUE KEY `address` (`address`(255))
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (31,'InfosysH','ih@gmail.com','7755775577','InfosysH',NULL,NULL,'SP1',NULL),(32,'Vanita','vk@gmail.com','7832783212','Magarpatta',NULL,NULL,'SP2','Kharat'),(38,'oooooooooooooo','oooooooooo@gmail.com','0000000000','oooooooooooooooooooooooooooooooooooooooooooooooooo',NULL,NULL,'SP1','ooooooooooooooo'),(39,'Ashwin','ar@gmail.com','8912988211','Soba',NULL,NULL,'demo','R');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_login`
--

DROP TABLE IF EXISTS `users_login`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_login` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` enum('superadmin','admin','supervisor','user') DEFAULT 'user',
  `status` enum('active','suspended') DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_login_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_login`
--

LOCK TABLES `users_login` WRITE;
/*!40000 ALTER TABLE `users_login` DISABLE KEYS */;
INSERT INTO `users_login` VALUES (1,'admin','$2b$10$ZOMuQ3SA/QdvPb8m5niBiOR/pwvv/EsNzav4LQRuIjbWyst.ua1jS','admin','suspended'),(62,'SP1','$2b$10$Q87c3JSA6kPu1aVkQttpy.KurBczjET62niqvvMM8lx1U4msYHKdq','supervisor','active'),(63,'SP2','$2b$10$uCvUs8mO8NpOJ.3Zz1AkwOgbTChTttgVkawS/dj5W6szdRBUP.iMa','supervisor','active'),(64,'DewaManke','$2b$10$aLFmoRMjZkA2RLmbQ.OXluxtVvEsFibHZV.d8qZ3YtAewcrildJ6S','user','active'),(66,'absM','$2b$10$DryhTUODOwWanM78UrcnQugLHkHnxTat9/HsG3jVxqsRGZOGGoAH.','user','active'),(67,'InfosysH','$2b$10$JvJ6ss9v6pMDL0RNJfCfwewQztFD8aAMByDR91UKuS6gcbPyk86bi','user','active'),(69,'dddddddddd','$2b$10$Ft5sDYu8Ic79cuPMaGaeB.Sq3427ZiyAqOZNrM7fdbxV2szsI3bQa','supervisor','active'),(70,'superadmin','$2b$10$YZkpDPwsJ3BxJSDkVNW9HeVmw/fVcONDxRRRlDHjOuLgoW2dQPI0C','superadmin','active'),(74,'demo','$2b$10$DDLsjaZuXaMHHXbu4nD3Eu5VvOCjQNaC6fJS5Luieb8TWN7HvaBp2','supervisor','active'),(77,'admin1','$2b$10$mu7wue6bzvhuwxvMviVM7u439xDaQZ8cVW5DOj0ov5w5d6OQWLxgS','admin','active');
/*!40000 ALTER TABLE `users_login` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-11 12:47:44
