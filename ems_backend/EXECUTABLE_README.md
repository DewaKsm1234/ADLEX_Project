# EMS Backend Executable

This document explains how to use the EMS Backend executable on different laptops/environments.

## Files Created

- `ems-backend.exe` - Windows executable (65MB)
- `config.js` - Configuration file for database and server settings

## Quick Start

1. **Copy the executable and config file** to your target laptop
2. **Edit the `config.js` file** to match your database settings
3. **Run the executable**: `./ems-backend.exe`

## Configuration

Edit `config.js` to change database connection settings:

```javascript
module.exports = {
  database: {
    host: '192.168.1.40',     // Change to your database server IP
    port: 3306,
    user: 'testuser',         // Change to your database username
    password: 'testpass',     // Change to your database password
    database: 'ems_dbnew'     // Change to your database name
  },
  
  server: {
    port: 3000                // Change port if needed
  },
  
  thingsboard: {
    baseUrl: 'https://thingsboard.cloud',
    username: 'rutuja.arekar@samsanlabs.com',
    password: 'Rutuja@Samsan113'
  }
};
```

## Database Setup

Make sure your MySQL database has the required tables. You can use the `database_setup.sql` file to create them:

```sql
-- Run this on your MySQL server
mysql -u testuser -p ems_dbnew < database_setup.sql
```

## Testing Different Configurations

### For Local Development
```javascript
database: {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '1234',
  database: 'ems_dbnew'
}
```

### For Remote Database (Main Laptop)
```javascript
database: {
  host: '192.168.1.40',
  port: 3306,
  user: 'testuser',
  password: 'testpass',
  database: 'ems_dbnew'
}
```

### For Production Server
```javascript
database: {
  host: 'your-production-server.com',
  port: 3306,
  user: 'prod_user',
  password: 'secure_password',
  database: 'ems_dbnew'
}
```

## Running the Application

1. **Start the server**:
   ```bash
   ./ems-backend.exe
   ```

2. **Access the application**:
   - Local access: `http://localhost:3000`
   - Network access: `http://192.168.1.40:3000`
   - The application will redirect to the login page

3. **API Endpoints**:
   - Login: `POST http://localhost:3000/api/login`
   - Users: `GET http://localhost:3000/api/users`
   - Devices: `GET http://localhost:3000/api/devices`
   - And many more...

## Troubleshooting

### Connection Issues
- Check if the database server is running
- Verify the IP address, username, and password in `config.js`
- Ensure the database exists and has the required tables

### Port Issues
- If port 3000 is already in use, change it in `config.js`
- Make sure the firewall allows connections on the specified port

### ThingsBoard Issues
- Verify the ThingsBoard credentials in `config.js`
- Check if the ThingsBoard service is accessible

## Building New Executables

If you need to rebuild the executable with different configurations:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build for Windows**:
   ```bash
   npm run build-win
   ```

3. **Build for Linux**:
   ```bash
   npm run build-linux
   ```

4. **Build for macOS**:
   ```bash
   npm run build-mac
   ```

## File Structure

```
ems_backend/
├── ems-backend.exe          # Windows executable
├── config.js               # Configuration file
├── database_setup.sql      # Database schema
├── EXECUTABLE_README.md    # This file
├── server.js              # Source code
└── package.json           # Project configuration
```

## Security Notes

- Keep the `config.js` file secure and don't commit it to version control
- Use strong passwords for database connections
- Consider using environment variables for sensitive data in production
- Regularly update the ThingsBoard credentials

## Support

For issues or questions:
1. Check the console output for error messages
2. Verify database connectivity
3. Ensure all required tables exist
4. Check network connectivity to ThingsBoard 