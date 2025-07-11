-- EMS Database Setup Script
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ems_dbnew;
USE ems_dbnew;

-- Create table for login authentication
CREATE TABLE users_login (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role ENUM('admin', 'supervisor', 'user') DEFAULT 'user'
);

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  nationality VARCHAR(50),
  gender ENUM('Male', 'Female', 'Other'),
  supervisor_id VARCHAR(50) -- maps to supervisors.supervisor_id
);

-- Supervisors metadata (not users)
CREATE TABLE supervisors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supervisor_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Create user_devices table for 1:many mapping between users and ThingsBoard device IDs
CREATE TABLE IF NOT EXISTS user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tb_device_id VARCHAR(64) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);


-- Log activity
CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  device_id VARCHAR(50),
  action TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table to store latest telemetry for each device
CREATE TABLE IF NOT EXISTS Telemetry_Device (
    deviceId VARCHAR(64) PRIMARY KEY,
    DeviceName VARCHAR(255),
    DirCount INT,
    DoorAStatus VARCHAR(32),
    DoorBStatus VARCHAR(32),
    EmergencyAlarm VARCHAR(32),
    LastSignalDate VARCHAR(32),
    LastSignalTime VARCHAR(32),
    Latitude DOUBLE,
    Location VARCHAR(255),
    Longitude DOUBLE,
    MacAddress VARCHAR(64),
    Position VARCHAR(64),
    Rpm INT,
    SerialNum VARCHAR(64),
    Speed DOUBLE,
    Status VARCHAR(32),
    TotalDistanceTravelled DOUBLE,
    TotalStopCount INT,
    TotalTravelTime DOUBLE,
    TotalWorkTime DOUBLE,
    AlarmActive VARCHAR(32)
);

-- Insert sample data

-- Sample admin user
INSERT INTO users_login (username, password, role) VALUES 
('admin', 'admin123', 'admin');

-- Sample supervisors
INSERT INTO users_login (username, password, role) VALUES 
('supervisor1', 'super123', 'supervisor'),
('supervisor2', 'super123', 'supervisor');

INSERT INTO supervisors (supervisor_id, first_name, last_name, email, phone) VALUES 
('supervisor1', 'John', 'Smith', 'john.smith@company.com', '+1234567890'),
('supervisor2', 'Jane', 'Doe', 'jane.doe@company.com', '+1234567891');

-- Sample users
INSERT INTO users_login (username, password, role) VALUES 
('user1', 'user123', 'user'),
('user2', 'user123', 'user'),
('user3', 'user123', 'user');

INSERT INTO users (username, email, phone, address, nationality, gender, supervisor_id) VALUES 
('user1', 'user1@example.com', '+1234567892', '123 Main St, City', 'American', 'Male', 'supervisor1'),
('user2', 'user2@example.com', '+1234567893', '456 Oak Ave, Town', 'Canadian', 'Female', 'supervisor1'),
('user3', 'user3@example.com', '+1234567894', '789 Pine Rd, Village', 'British', 'Male', 'supervisor2');

-- Sample devices
INSERT INTO devices (device_id, elevator_number, serial_number, mac_address, location, device_info, user_id, status) VALUES 
('DEV001', 'ELV001', 'SN123456789', 'AA:BB:CC:DD:EE:01', 'Building A, Floor 1', 'Passenger elevator, 8 floors', 1, 'Online'),
('DEV002', 'ELV002', 'SN123456790', 'AA:BB:CC:DD:EE:02', 'Building A, Floor 2', 'Freight elevator, 8 floors', 2, 'Online'),
('DEV003', 'ELV003', 'SN123456791', 'AA:BB:CC:DD:EE:03', 'Building B, Floor 1', 'Passenger elevator, 12 floors', 3, 'Offline');

-- Sample logs
INSERT INTO logs (user_id, device_id, action) VALUES 
(1, 'DEV001', 'Device assigned to user1'),
(2, 'DEV002', 'Device assigned to user2'),
(3, 'DEV003', 'Device assigned to user3'),
(1, 'DEV001', 'Maintenance check completed'),
(2, 'DEV002', 'Error reported: Door sensor malfunction');

-- Display sample data
SELECT 'Users Login' as table_name, COUNT(*) as count FROM users_login
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Supervisors', COUNT(*) FROM supervisors
UNION ALL
SELECT 'Devices', COUNT(*) FROM devices
UNION ALL
SELECT 'Logs', COUNT(*) FROM logs; 