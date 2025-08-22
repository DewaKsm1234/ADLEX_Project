const mysql = require('mysql2/promise'); // async/await support
const config = require('./config');

// Use the same database configuration as your main application
const db = mysql.createPool(config.database);

async function checkPasswordStatus() {
  try {
    console.log('🔍 Checking password status in database...');
    
    // Get all users from the database
    const [users] = await db.query('SELECT username, role, password FROM users_login');
    
    console.log(`📋 Found ${users.length} users in database`);
    console.log('\n📊 Password Status Report:');
    console.log('='.repeat(60));
    
    let plainTextCount = 0;
    let hashedCount = 0;
    let emptyCount = 0;
    
    for (const user of users) {
      const password = user.password;
      let status = '';
      
      if (!password || password === 'N' || password === '') {
        status = '❌ Plain text (needs update)';
        plainTextCount++;
      } else if (password.startsWith('$2b$') || password.startsWith('$2a$')) {
        status = '✅ Hashed (secure)';
        hashedCount++;
      } else {
        status = '⚠️  Unknown format';
        emptyCount++;
      }
      
      console.log(`${user.username.padEnd(20)} | ${user.role.padEnd(12)} | ${status}`);
    }
    
    console.log('='.repeat(60));
    console.log(`📈 Summary:`);
    console.log(`- ✅ Hashed passwords: ${hashedCount}`);
    console.log(`- ❌ Plain text passwords: ${plainTextCount}`);
    console.log(`- ⚠️  Unknown format: ${emptyCount}`);
    
    if (plainTextCount > 0) {
      console.log(`\n🔧 To update plain text passwords, run:`);
      console.log(`   node update-passwords.js`);
    } else {
      console.log(`\n🎉 All passwords are properly hashed!`);
    }
    
  } catch (error) {
    console.error('❌ Error checking passwords:', error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the check
checkPasswordStatus(); 