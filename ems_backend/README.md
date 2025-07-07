# EMS (Elevator Management System) Backend

A comprehensive web-based system for managing elevator devices, users, supervisors, and monitoring system performance.

## Features

- **User Management**: Register and manage users with different roles (admin, supervisor, user)
- **Device Management**: Assign and track elevator devices
- **Supervisor Management**: Manage supervisors and their assigned devices
- **Activity Logging**: Track all system activities and device events
- **Statistics & Reports**: View device performance metrics and error reports
- **Support System**: Contact support and view FAQs

## System Architecture

### Database Schema
- `users_login`: Authentication table with username, password, and role
- `users`: User profile information
- `supervisors`: Supervisor metadata
- `devices`: Device assignments and information
- `logs`: Activity logging

### API Endpoints
- `POST /api/login`: User authentication
- `POST /api/register`: Register new users
- `POST /api/register-supervisor`: Register new supervisors
- `POST /api/assign-device`: Assign devices to users
- `GET /api/users`: Fetch all users
- `GET /api/supervisors`: Fetch all supervisors
- `GET /api/devices`: Fetch all devices
- `GET /api/user-devices/:username`: Get devices for specific user
- `GET /api/device/:deviceId`: Get device details
- `GET /api/super-devices/:supervisorId`: Get devices under supervisor
- `GET /api/logs`: Fetch activity logs
- `GET /api/stats/:deviceId`: Get device statistics
- `GET /api/errors/:deviceId`: Get device error reports
- `POST /api/support`: Submit support requests

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ems_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Create a MySQL database
   - Update database configuration in `server.js`:
     ```javascript
     const db = mysql.createPool({
       host: 'localhost',
       user: 'your_mysql_user',
       password: 'your_password',
       database: 'ems_dbnew'
     }).promise();
     ```
   - Run the database setup script:
     ```bash
     mysql -u your_mysql_user -p < database_setup.sql
     ```

4. **Start the server**
   ```bash
   node server.js
   ```

5. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Login with default admin credentials:
     - Username: `admin`
     - Password: `admin123`

## Page Flow

| #  | Page Filename                | Description                                         | Access Level |
| -- | ---------------------------- | --------------------------------------------------- | ------------ |
| 1  | `login.html`                 | Admin/supervisor login                              | Public       |
| 2  | `users.html`                 | Admin dashboard showing users, devices, supervisors | Admin        |
| 3  | `supervisors.html`           | Admin view of all supervisors with stats            | Admin        |
| 4  | `register.html`              | Form to register new user                           | Admin        |
| 5  | `register_super.html`        | Register a new supervisor                           | Admin        |
| 6  | `assign-device.html`         | Assign device to user + link to supervisor          | Admin        |
| 7  | `specific_userdevice.html`   | List of devices used by a selected user             | Admin        |
| 8  | `user_device_overview.html`  | Detailed view of selected device                    | Admin        |
| 9  | `logs.html`                  | Downloadable log table by user                      | Admin        |
| 10 | `totaldevicestats.html`      | View device performance stats                       | Admin        |
| 11 | `elevatorerror.html`         | Device error reports                                | Admin        |
| 12 | `super_device_overview.html` | Supervisor's view of all devices under them         | Supervisor   |
| 13 | `support.html`               | Contact support form                                | All Users    |

## User Roles

### Admin
- Full access to all features
- Can manage users, supervisors, and devices
- Can view all statistics and reports
- Can assign devices and manage system settings

### Supervisor
- Can view devices assigned to them
- Can view device statistics and error reports
- Limited access to user management

### User
- Basic access to support system
- Can view their assigned devices (if any)

## Sample Data

The database setup script includes sample data:
- **Admin User**: admin/admin123
- **Supervisors**: supervisor1/super123, supervisor2/super123
- **Users**: user1/user123, user2/user123, user3/user123
- **Devices**: DEV001, DEV002, DEV003 with sample assignments

## File Structure

```
ems_backend/
├── server.js                 # Main server file
├── package.json             # Node.js dependencies
├── database_setup.sql       # Database schema and sample data
├── README.md               # This file
└── public/                 # Static files
    ├── css/                # Stylesheets
    │   ├── style.css       # Main styles
    │   ├── login.css       # Login page styles
    │   └── form-style.css  # Form styles
    ├── js/                 # JavaScript files
    │   └── script.js       # Common scripts
    └── *.html             # All HTML pages
```

## API Documentation

### Authentication
```javascript
POST /api/login
{
  "username": "admin",
  "password": "admin123"
}
```

### Register User
```javascript
POST /api/register
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "nationality": "American",
  "gender": "Male"
}
```

### Assign Device
```javascript
POST /api/assign-device
{
  "username": "user1",
  "device_id": "DEV001",
  "elevator_number": "ELV001",
  "serial_number": "SN123456789",
  "mac_address": "AA:BB:CC:DD:EE:01",
  "location": "Building A, Floor 1",
  "device_info": "Passenger elevator, 8 floors",
  "supervisor_id": "supervisor1"
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check database credentials in `server.js`
   - Ensure database `ems_dbnew` exists

2. **Port Already in Use**
   - Change the port in `server.js` (line 8)
   - Kill existing processes using port 3000

3. **Module Not Found**
   - Run `npm install` to install dependencies
   - Check `package.json` for required modules

### Logs
- Server logs are displayed in the console
- Database errors are logged with stack traces
- API requests are logged automatically

## Security Notes

- Passwords are stored in plain text (should be hashed in production)
- No session management implemented (should add JWT tokens)
- CORS is enabled for all origins (should be restricted in production)
- Input validation should be enhanced for production use

## Future Enhancements

- Password hashing and JWT authentication
- Real-time device monitoring
- Email notifications for errors
- Advanced reporting and analytics
- Mobile-responsive design improvements
- API rate limiting
- Database connection pooling optimization 