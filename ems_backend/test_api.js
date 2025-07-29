// Test script for device-user API endpoint
const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'ems_dbnew'
}).promise();

async function testDeviceUserAPI() {
  try {
    console.log('Testing device-user API...');
    
    // First, let's check the structure of the users table
    const [userColumns] = await db.execute('DESCRIBE users');
    console.log('Users table structure:', userColumns);
    
    // First, let's see what devices exist
    const [devices] = await db.execute('SELECT tb_device_id FROM devices LIMIT 5');
    console.log('Available devices:', devices);
    
    if (devices.length > 0) {
      const testDeviceId = devices[0].tb_device_id;
      console.log(`Testing with device ID: ${testDeviceId}`);
      
      // Test the query without username field first
      const [userRows] = await db.execute(
        `SELECT u.first_name, u.last_name, u.email, u.phone
         FROM users u
         JOIN user_devices ud ON u.id = ud.user_id
         WHERE ud.tb_device_id = ?`,
        [testDeviceId]
      );
      
      console.log('User data for device:', userRows);
      
      if (userRows.length === 0) {
        console.log('No user assigned to this device. Checking user_devices table...');
        const [userDevices] = await db.execute('SELECT * FROM user_devices LIMIT 5');
        console.log('user_devices table sample:', userDevices);
        
        const [users] = await db.execute('SELECT id, first_name, last_name, email, phone FROM users LIMIT 5');
        console.log('users table sample:', users);
      }
    }
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  } finally {
    process.exit(0);
  }
}

testDeviceUserAPI(); 