const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise'); // async/await support
const config = require('./config');

// Use the same database configuration as your main application
const db = mysql.createPool(config.database);

async function updateAllPasswords() {
  try {
    console.log('🔐 Starting password update process...');
    
    // Get all users from the database
    const [users] = await db.query('SELECT username, role FROM users_login');
    
    console.log(`📋 Found ${users.length} users to update`);
    
    // Default passwords based on role
    const defaultPasswords = {
      'admin': 'admin123',
      'supervisor': 'supervisor123',
      'user': 'user123'
    };
    
    // Update each user's password
    for (const user of users) {
      const defaultPassword = defaultPasswords[user.role] || 'password123';
      
      // Hash the password
      const hash = await bcrypt.hash(defaultPassword, 10);
      
      // Update the password in database
      await db.query(
        'UPDATE users_login SET password = ? WHERE username = ?',
        [hash, user.username]
      );
      
      console.log(`✅ Updated password for ${user.username} (${user.role}) -> ${defaultPassword}`);
    }
    
    console.log('🎉 All passwords have been successfully updated!');
    console.log('\n📝 Default passwords set:');
    console.log('- Admin users: admin123');
    console.log('- Supervisor users: supervisor123');
    console.log('- Regular users: user123');
    console.log('\n⚠️  Please change these passwords after first login!');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Function to update a specific user's password
async function updateSpecificUser(username, newPassword) {
  try {
    console.log(`🔐 Updating password for user: ${username}`);
    
    // Hash the password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update the password in database
    const [result] = await db.query(
      'UPDATE users_login SET password = ? WHERE username = ?',
      [hash, username]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Successfully updated password for ${username}`);
    } else {
      console.log(`❌ User ${username} not found`);
    }
    
  } catch (error) {
    console.error('❌ Error updating password:', error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Check if specific user update is requested
const args = process.argv.slice(2);
if (args.length === 2 && args[0] === '--user') {
  // Update specific user: node update-passwords.js --user username newpassword
  updateSpecificUser(args[1], args[2]);
} else if (args.length === 0) {
  // Update all users with default passwords
  updateAllPasswords();
} else {
  console.log('📖 Usage:');
  console.log('  node update-passwords.js                    # Update all users with default passwords');
  console.log('  node update-passwords.js --user username password  # Update specific user');
  console.log('\n📝 Default passwords:');
  console.log('- Admin: admin123');
  console.log('- Supervisor: supervisor123');
  console.log('- User: user123');
} 