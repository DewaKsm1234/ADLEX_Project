# EMS Backend - Pendrive Distribution

This package contains the EMS Backend server that can run on both Windows and Linux systems.

## 📁 Package Contents

### For Windows:
- `ems-backend-windows.exe` - Main executable
- `config.js` - Configuration file
- `start-windows.bat` - Start script
- `database_setup.sql` - Database schema

### For Linux (Ubuntu):
- `ems-backend-linux` - Main executable
- `config.js` - Configuration file
- `start-linux.sh` - Start script
- `database_setup.sql` - Database schema

## 🚀 Quick Start

### Windows:
1. Double-click `start-windows.bat`
2. Server will start automatically
3. Access at: http://localhost:3000

### Linux (Ubuntu):
1. Open terminal in this folder
2. Run: `./start-linux.sh`
3. Server will start automatically
4. Access at: http://localhost:3000

## ⚙️ Configuration

Edit `config.js` to change settings:

```javascript
module.exports = {
  database: {
    host: '192.168.1.40',     // Database server IP
    port: 3306,
    user: 'testuser',         // Database username
    password: 'testpass',     // Database password
    database: 'ems_dbnew'     // Database name
  },
  
  server: {
    port: 3000,               // Server port
    host: '0.0.0.0'          // Allow network access
  },
  
  thingsboard: {
    baseUrl: 'https://thingsboard.cloud',
    username: 'rutuja.arekar@samsanlabs.com',
    password: 'Rutuja@Samsan113'
  }
};
```

## 🌐 Network Access

The server accepts connections from:
- **Local**: http://localhost:3000
- **Network**: http://192.168.1.40:3000

## 📊 Database Setup

Before running, ensure your MySQL database is set up:

```sql
-- Run this on your MySQL server
mysql -u testuser -p ems_dbnew < database_setup.sql
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Cannot connect to database"**
   - Check if MySQL server is running on 192.168.1.40
   - Verify username/password in config.js
   - Ensure database 'ems_dbnew' exists

2. **"Port already in use"**
   - Change port in config.js (e.g., 3001)
   - Or kill existing process using port 3000

3. **"Permission denied" (Linux)**
   - Run: `chmod +x ems-backend-linux`
   - Or run: `sudo ./start-linux.sh`

4. **"Access denied" (Windows)**
   - Right-click → "Run as administrator"
   - Check Windows Firewall settings

### Network Issues:
- Ensure both devices are on same network
- Check firewall allows port 3000
- Verify database server is accessible

## 📱 API Endpoints

Main API endpoints:
- **Login**: POST http://localhost:3000/api/login
- **Users**: GET http://localhost:3000/api/users
- **Devices**: GET http://localhost:3000/api/devices
- **Supervisors**: GET http://localhost:3000/api/supervisors
- **Logs**: GET http://localhost:3000/api/logs/latest

## 🔒 Security Notes

- Keep config.js secure (contains database credentials)
- Change default passwords in production
- Use HTTPS in production environments
- Regularly update ThingsBoard credentials

## 📞 Support

If you encounter issues:
1. Check console output for error messages
2. Verify database connectivity
3. Ensure all required tables exist
4. Check network connectivity

## 📋 Requirements

### Windows:
- Windows 10/11 (64-bit)
- No additional software required

### Linux (Ubuntu):
- Ubuntu 18.04 or later
- No additional software required

### Database:
- MySQL server running on 192.168.1.40
- Database 'ems_dbnew' created
- User 'testuser' with appropriate permissions 