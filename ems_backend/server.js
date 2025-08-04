// server.js - EMS Backend API with JWT Authentication
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // JWT for secure token-based authentication
const cookieParser = require('cookie-parser'); // Parse HTTP-only cookies

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '24h'; // Token expires in 24 hours

// Cookie settings for security
const COOKIE_OPTIONS = {
  httpOnly: true,        // Prevents JavaScript access (XSS protection)
  secure: false,         // Set to true in production with HTTPS
  sameSite: 'strict',    // Prevents CSRF attacks
  maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  path: '/'              // Cookie available across entire site
};

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Enable cookie parsing
app.use(cors({
  origin: true, // Allow all origins (configure for production)
  credentials: true // Allow cookies to be sent with requests
}));
app.use(express.static(path.join(__dirname, 'public')));

// Import axios for HTTP requests to ThingsBoard
const axios = require('axios');
const archiver = require('archiver');
const ExcelJS = require('exceljs');

// ThingsBoard configuration
const TB_BASE_URL = config.thingsboard.baseUrl;
const TB_USERNAME = config.thingsboard.username;
const TB_PASSWORD = config.thingsboard.password;

let tbToken = '';
let tbTokenExpiry = 0;

// Function to login and get a new token
async function loginToThingsBoard() {
  const response = await axios.post(`${TB_BASE_URL}/api/auth/login`, {
    username: TB_USERNAME,
    password: TB_PASSWORD
  });
  tbToken = response.data.token;
  tbTokenExpiry = Date.now() + (55 * 60 * 1000);
}

async function getThingsBoardToken() {
  if (!tbToken || Date.now() > tbTokenExpiry) {
    await loginToThingsBoard();
  }
  return tbToken;
}

const PORT = config.server.port;
const db = mysql.createPool(config.database).promise();

// Password hashing utility functions
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ==================== JWT AUTHENTICATION FUNCTIONS ====================

/**
 * Generate JWT token for a user
 * @param {Object} user - User object containing id, username, role
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  // Create payload with user information (avoid sensitive data)
  const payload = {
    userId: user.id,           // User ID from database
    username: user.username,   // Username for display
    role: user.role,          // User role for authorization
    iat: Math.floor(Date.now() / 1000) // Issued at timestamp
    // Remove the manual 'exp' property - let jwt.sign() handle it
  };

  // Sign the token with our secret key
  // jwt.sign() will automatically add the 'exp' property based on expiresIn option
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify JWT token and extract user data
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
  try {
    // Verify token using our secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    // Token is invalid, expired, or malformed
    console.log('Token verification failed:', error.message);
    return null;
  }
};

/**
 * Middleware to authenticate requests using JWT token
 * Extracts token from cookies or Authorization header
 */
const authenticateToken = (req, res, next) => {
  // Try to get token from different sources (in order of preference)
  let token = null;

  // 1. First, try to get token from HTTP-only cookie (most secure)
  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
    console.log('Token found in cookie');
  }
  // 2. Fallback to Authorization header (for API calls)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    // Extract token from "Bearer <token>" format
    token = req.headers.authorization.substring(7);
    console.log('Token found in Authorization header');
  }

  // If no token found, return unauthorized
  if (!token) {
    console.log('No authentication token found');
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No token provided.',
      redirectTo: '/login' // Frontend can use this to redirect
    });
  }

  // Verify the token
  const decoded = verifyToken(token);
  if (!decoded) {
    console.log('Invalid or expired token');
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token.',
      redirectTo: '/login'
    });
  }

  // Token is valid - attach user data to request object
  req.user = {
    userId: decoded.userId,
    username: decoded.username,
    role: decoded.role
  };

  console.log(`Authenticated user: ${decoded.username} (${decoded.role})`);
  next(); // Continue to next middleware/route handler
};

/**
 * Middleware to require specific user roles
 * @param {...string} roles - Allowed roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.',
        redirectTo: '/login'
      });
    }

    // Check if user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      console.log(`Access denied: User ${req.user.username} (${req.user.role}) tried to access ${req.path}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions.',
        redirectTo: '/dashboard'
      });
    }

    console.log(`Role check passed: ${req.user.username} (${req.user.role}) accessing ${req.path}`);
    next();
  };
};

// Role-specific middleware
const requireAdmin = requireRole('admin');
const requireSupervisorOrAdmin = requireRole('supervisor', 'admin');

/**
 * Clear authentication cookie and token
 * @param {Object} res - Express response object
 */
const clearAuthCookie = (res) => {
  // Clear the authentication cookie by setting it to expire in the past
  res.clearCookie('authToken', {
    httpOnly: true,
    secure: false, // Should match COOKIE_OPTIONS
    sameSite: 'strict',
    path: '/'
  });
  console.log('Authentication cookie cleared');
};

// ==================== AUTHENTICATION ENDPOINTS ====================

/**
 * Login endpoint with JWT token generation
 * POST /api/login
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Login attempt:', username);

    // Get user by username only (password will be compared with bcrypt)
    const [rows] = await db.execute(
      'SELECT * FROM users_login WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Compare password with bcrypt hash
    const isValidPassword = await comparePassword(password, rows[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Login successful. Generating JWT token...');

    // Generate JWT token
    const token = generateToken(rows[0]);

    // Set HTTP-only cookie with the token
    res.cookie('authToken', token, COOKIE_OPTIONS);

    // Start background device sync (no await)
    axios.post(
      'http://localhost:3000/api/sync-thingsboard-devices',
      {},
      { headers: { 'Content-Type': 'application/json' } }
    )
    .then(() => console.log('Device sync started in background'))
    .catch(err => console.error('Device sync failed:', err.message));

    // Respond with success and user data
    res.json({
      success: true,
      token: token, // Also send token in response for frontend storage
      username: rows[0].username,
      role: rows[0].role,
      name: (rows[0].first_name || '') + ' ' + (rows[0].last_name || ''),
      message: 'Login successful. Device sync running in background.'
    });

  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * Logout endpoint
 * POST /api/logout
 */
app.post('/api/logout', (req, res) => {
  try {
    // Clear the authentication cookie
    clearAuthCookie(res);
    
    console.log('User logged out successfully');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

/**
 * Verify authentication status
 * GET /api/auth/verify
 */
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  // If we reach here, the token is valid
  res.json({
    success: true,
    user: {
      userId: req.user.userId,
      username: req.user.username,
      role: req.user.role
    },
    message: 'Token is valid'
  });
});

// ==================== PROTECTED ROUTES ====================

// Example of protected route using authentication middleware
app.get('/api/protected-data', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: 'This is protected data',
    user: req.user
  });
});

// Example of admin-only route
app.get('/api/admin-only', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: 'Admin-only data',
    user: req.user
  });
});

// Example of supervisor or admin route
app.get('/api/supervisor-data', authenticateToken, requireSupervisorOrAdmin, (req, res) => {
  res.json({
    success: true,
    data: 'Supervisor/Admin data',
    user: req.user
  });
});

// ==================== EXISTING ROUTES (UPDATED WITH AUTH) ====================

// Update existing routes to use new authentication
app.post('/api/register', authenticateToken, requireAdmin, async (req, res) => {
  const {
    address, password, email, phone, first_name, last_name, tb_device_id, supervisor_id
  } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Hash password with bcrypt (salt rounds = 10)
    // const hashedPassword = await bcrypt.hash(password, 10);
    // await conn.execute(
    //   'INSERT INTO users_login (address, password, role) VALUES (?, ?, ?)',
    //   [address, hashedPassword, 'user']
    // );
    const [userResult] = await conn.execute(
      'INSERT INTO users (address, email, phone, first_name, last_name, supervisor_id) VALUES (?, ?, ?, ?, ?, ?)',
      [address, email, phone, first_name, last_name, supervisor_id || null]
    );
    const user_id = userResult.insertId;
    // Map user to device if tb_device_id provided
    if (tb_device_id) {
      await conn.execute(
        'INSERT INTO user_devices (user_id, tb_device_id) VALUES (?, ?)',
        [user_id, tb_device_id]
      );
    }
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Fetch all users (with supervisor name join)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT u.*, s.first_name as supervisor_first_name, s.last_name as supervisor_last_name 
      FROM users u 
      LEFT JOIN supervisors s ON u.supervisor_id = s.supervisor_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign supervisor to user
app.post('/api/assign-supervisor', authenticateToken, requireAdmin, async (req, res) => {
  const { address, supervisor_id } = req.body;

  // 🔍 Validate input
  if (!address || !supervisor_id) {
    return res.status(400).json({ error: 'Missing address or supervisor_id' });
  }

  try {
    // ✅ Check if user exists
    const [userRows] = await db.execute('SELECT id FROM users WHERE address = ?', [address]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ✅ Check if supervisor exists (optional but recommended)
    const [supRows] = await db.execute('SELECT * FROM supervisors WHERE supervisor_id = ?', [supervisor_id]);
    if (supRows.length === 0) {
      return res.status(404).json({ error: 'Supervisor not found' });
    }

    // 🔁 Update supervisor assignment
    await db.execute(
      'UPDATE users SET supervisor_id = ? WHERE address = ?',
      [supervisor_id, address]
    );

    res.json({ success: true, message: 'Supervisor assigned successfully' });

  } catch (err) {
    console.error('[assign-supervisor ERROR]', err); // log full error
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});


// Assign Device to User
app.post('/api/assign-device',  authenticateToken, requireAdmin, async (req, res) => {
  const { address, tb_device_id } = req.body;
  try {
    // Get user_id from address
    const [userRows] = await db.execute('SELECT id FROM users WHERE address = ?', [address]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user_id = userRows[0].id;

    // Fetch telemetry from ThingsBoard for this device
    const tbToken = await getThingsBoardToken();
    const telemetryKeys = [
      'ERR', 'CFL', 'POS', 'SPD', 'RPM', 'VBUS', 'CUR', 'ID', 'CSQ', 'LAT', 'LNG',
      'TWTIME', 'TWCOUNT', 'DIRCHG', 'DIRCNT', 'TRVTIME', 'DOORA', 'DOORB', 'RDTIME', 'STPCNT','DeviceId','MacAddress'
    ];
    const response = await axios.get(
      `${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${tb_device_id}/values/timeseries?keys=${telemetryKeys.join(',')}`,
      { headers: { Authorization: `Bearer ${tbToken}` } }
    );
    const tbData = response.data;
    const telemetry = {};
    telemetryKeys.forEach(key => {
      telemetry[key] = (tbData[key] && tbData[key][0] && tbData[key][0].value != null)
        ? tbData[key][0].value
        : null;
    });
    // Upsert telemetry into database
    const columns = ['tb_device_id', ...telemetryKeys];
    const values = [tb_device_id, ...telemetryKeys.map(k => telemetry[k])];
    const updateClause = telemetryKeys.map(k => `${k} = VALUES(${k})`).join(', ');
    await db.execute(
      `INSERT INTO telemetry_device (${columns.join(', ')}) VALUES (${columns.map(_ => '?').join(', ')})
       ON DUPLICATE KEY UPDATE ${updateClause}`,
      values
    );

    // Insert mapping into user_devices
    await db.execute(
      'INSERT INTO user_devices (user_id, tb_device_id) VALUES (?, ?)',
      [user_id, tb_device_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Devices mapped for a specific user
app.get('/api/user-devices/:address', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.* FROM devices d
      JOIN user_devices ud ON d.tb_device_id = ud.tb_device_id
      JOIN users u ON ud.user_id = u.id
      WHERE u.address = ?
    `, [req.params.address]);
 
    // console.log("Loaded devices for user:", rows);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/unassigned-devices', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get all device IDs from devices
    const [allDevices] = await db.execute('SELECT tb_device_id, DeviceId FROM devices');
    // Get all assigned device IDs from user_devices
    const [assigned] = await db.execute('SELECT DISTINCT tb_device_id FROM user_devices');
    const assignedIds = new Set(assigned.map(d => d.tb_device_id));
    // Filter out assigned devices
    const unassigned = allDevices.filter(d => !assignedIds.has(d.tb_device_id));
    res.json(unassigned);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unassigned devices', details: err.message });
  }
});
// Get full details of a single device
// app.get('/api/device-details/:tb_device_id', requireAdmin, async (req, res) => {
//   const { tb_device_id } = req.params;
//   try {
//     const [rows] = await db.execute(
//       `SELECT DeviceId, SerialNum, MacAddress, Location 
//        FROM devices 
//        WHERE tb_device_id = ?`,
//       [tb_device_id]
//     );
//     if (rows.length === 0) return res.status(404).json({ error: 'Device not found' });
//     res.json(rows[0]);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Get user information for a specific device
app.get('/api/device-user/:tb_device_id', async (req, res) => {
  const { tb_device_id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT u.first_name, u.last_name, u.email, u.phone, u.address
       FROM users u
       JOIN user_devices ud ON u.id = ud.user_id
       WHERE ud.tb_device_id = ?`,
      [tb_device_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'No user assigned to this device' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ---------------- SUPERVISORS ENDPOINTS -------------------
// Register supervisor
app.post('/api/register-supervisor', authenticateToken, requireAdmin, async (req, res) => {
  const { supervisor_id, first_name, last_name, email, phone, password } = req.body;
  try {
    // Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await hashPassword(password);
    await db.execute(
      'INSERT INTO users_login (username, password, role) VALUES (?, ?, ?)',
      [supervisor_id, hashedPassword, 'supervisor']
    );
    await db.execute(
      'INSERT INTO supervisors (supervisor_id, first_name, last_name, email, phone) VALUES (?, ?, ?, ?, ?)',
      [supervisor_id, first_name, last_name, email, phone]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all supervisors
app.get('/api/supervisors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM supervisors');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supervisor summary: supervisor_id, name, contact, assigned_users, assigned_devices
app.get('/api/supervisors-summary', async (req, res) => {
  try {
    const [supervisors] = await db.execute('SELECT * FROM supervisors');
    const summary = await Promise.all(supervisors.map(async (sup) => {
      const [userRows] = await db.execute('SELECT id FROM users WHERE supervisor_id = ?', [sup.supervisor_id]);
      const assigned_users = userRows.length;
      const userIds = userRows.map(u => u.id);
      let assigned_devices = 0;
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        const [deviceRows] = await db.execute(
          `SELECT COUNT(*) as cnt FROM user_devices WHERE user_id IN (${placeholders})`,
          userIds
        );
        assigned_devices = deviceRows[0].cnt;
      } else {
        assigned_devices = 0;
      }
      return {
        supervisor_id: sup.supervisor_id,
        name: `${sup.first_name || ''} ${sup.last_name || ''}`.trim(),
        contact: `${sup.email || ''}${sup.phone ? ' / ' + sup.phone : ''}`.trim(),
        assigned_users,
        assigned_devices
      };
    }));
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users and devices for a supervisor
app.get('/api/supervisor-users-devices/:supervisor_id', async (req, res) => {
  try {
    const supervisor_id = req.params.supervisor_id;
    // Get all users assigned to this supervisor
    const [users] = await db.execute('SELECT * FROM users WHERE supervisor_id = ?', [supervisor_id]);
    // For each user, get their devices
    const userDeviceData = await Promise.all(users.map(async (user) => {
      const [devices] = await db.execute('SELECT * FROM user_devices WHERE user_id = ?', [user.id]);
      return {
        user,
        devices
      };
    }))
    res.json(userDeviceData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ---------------- TELEMETRY SYNC ENDPOINT -------------------
/**
 * Sync telemetry for a device from ThingsBoard and store in Telemetry_Device table.
 * Expects ThingsBoard token to be set in TB_TOKEN (env or config).
 *
 * POST /api/device/:deviceId/sync-telemetry
 * Returns: latest telemetry for the device
 */
app.post('/api/device/:tb_device_id/sync-telemetry', async (req, res) => {

  const tb_device_id = req.params.tb_device_id;
  const tbToken = await getThingsBoardToken();//To get token  

  // Fetch device info to get the name and active status
  let deviceName = '';
  let isActive = null;
  
  try {
    // Always use deviceInfos endpoint to get accurate active status
    const deviceInfosRes = await axios.get(
      `${TB_BASE_URL}/api/deviceInfos/all?pageSize=1000&page=0`,
      { headers: { 'X-Authorization': `Bearer ${tbToken}` } }
    );
    
    const deviceInfos = deviceInfosRes.data.data || [];
    const deviceInfo = deviceInfos.find(device => device.id && device.id.id === tb_device_id);
    
    if (deviceInfo) {
      console.log(`✅ Found device in deviceInfos:`, deviceInfo);
      deviceName = deviceInfo.name || '';
      isActive = deviceInfo.active;
      console.log(`  Device name:`, deviceName);
      console.log(`  Active status:`, isActive);
      console.log(`  Active status type:`, typeof isActive);
    } else {
      console.log(`❌ Device not found in deviceInfos list`);
      // Fallback to individual device endpoint for name only
      try {
        const deviceInfoRes = await axios.get(
          `${TB_BASE_URL}/api/device/${tb_device_id}`,
          { headers: { 'Authorization': `Bearer ${tbToken}` } }
        );
        deviceName = deviceInfoRes.data.name || '';
        console.log(`  Fallback - Device name from individual endpoint:`, deviceName);
      } catch (fallbackErr) {
        console.error(`❌ ERROR: Fallback individual device call failed:`, fallbackErr.message);
      }
    }
    
    // Do not return early if inactive, just include status
  } catch (err) {
    console.error(`❌ ERROR: Failed to fetch device info for ${tb_device_id}:`, err.message);
    console.error(`  Error response:`, err.response?.data);
    console.error(`  Error status:`, err.response?.status);
    return res.status(500).json({ error: 'Failed to fetch device info' });
  }

  // Filter: Only proceed if device name contains "Lift"
  if (!deviceName.toLowerCase().includes('lift')) {
    return res.status(400).json({ error: 'Not a Lift device. Telemetry not synced.' });
  }

  // List of telemetry keys to fetch from ThingsBoard
  const telemetryKeys = [
    'MacAddress', 'SerialNum', 'Location', 'Status', 'DeviceId',
    'ERR', 'CFL', 'POS', 'SPD', 'RPM', 'VBUS', 'CUR', 'ID', 'CSQ', 'LAT', 'LNG',
    'TWTIME', 'TWCOUNT', 'DIRCHG', 'DIRCNT', 'TRVTIME', 'DOORA', 'DOORB', 'RDTIME', 'STPCNT'
  ];

  try {
    // Step 1: Fetch telemetry from ThingsBoard
    const response = await axios.get(
      `${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${tb_device_id}/values/timeseries?keys=${telemetryKeys.join(',')}`,
      { headers: { Authorization: `Bearer ${tbToken}` } }
    );
    const tbData = response.data;
    //console.log('ThingsBoard response:', JSON.stringify(tbData, null, 2));

    // Step 2: Prepare telemetry object
    const telemetry = {};
    telemetryKeys.forEach(key => {
      if (!tbData[key]) {
        console.warn(`Key ${key} not found in ThingsBoard response for device ${tb_device_id}`);
      }
      telemetry[key] = (tbData[key] && tbData[key][0] && tbData[key][0].value != null)
        ? tbData[key][0].value
        : null;
    });

    // Step 3: Upsert telemetry into database
    const columns = ['tb_device_id', ...telemetryKeys];
    const values = [tb_device_id, ...telemetryKeys.map(k => telemetry[k])];
    const updateClause = telemetryKeys.map(k => `${k} = VALUES(${k})`).join(', ');
    await db.execute(
      `INSERT INTO Telemetry_Device (${columns.join(', ')}) VALUES (${columns.map(_ => '?').join(', ')})
       ON DUPLICATE KEY UPDATE ${updateClause}`,
      values
    );

    // Step 4: Fetch username mapped to this device
    const [userRows] = await db.execute(`
    SELECT u.address
    FROM user_devices ud
    JOIN users u ON ud.user_id = u.id
    WHERE ud.tb_device_id = ?
    LIMIT 1
    `, [tb_device_id]);

    telemetry.address = userRows.length > 0 ? userRows[0].address : 'NA';

    // Step 5: Respond to frontend
    const [rows] = await db.execute(
      'SELECT log_time FROM device_logs WHERE tb_device_id = ? ORDER BY log_time DESC LIMIT 1',
      [tb_device_id]
    );
    const log_time = rows.length ? rows[0].log_time : null;

    res.json({
      tb_device_id,
      ...telemetry,
      log_time, // <-- include this in the response
      active: isActive // <-- always include real-time active status
    });
    
    // Debug logging for response
    console.log(`📤 DEBUG: Sending response to frontend for device ${tb_device_id}:`);
    console.log(`  active status in response:`, isActive);
    console.log(`  active status type:`, typeof isActive);
    console.log(`  active === true:`, isActive === true);
    console.log(`  active === false:`, isActive === false);
    console.log(`  active == true:`, isActive == true);
    console.log(`  active == false:`, isActive == false);

  } catch (err) {
    console.error('Telemetry sync error:', err.message);
    res.status(500).json({
      error: 'Failed to sync telemetry',
      details: err.message
    });
  }
});


    // ---------------- SYNC DEVICES ENDPOINT -------------------
    app.post('/api/sync-thingsboard-devices', authenticateToken, requireAdmin, async (req, res) => {
      try {
        console.log('🔄 Starting device sync from ThingsBoard...');
    
        const token = await getThingsBoardToken();
        console.log('✅ Auth token acquired');
    
        // 1. Fetch all device infos (once per job run)
        const tbResponse = await axios.get(
          `${TB_BASE_URL}/api/deviceInfos/all?pageSize=1000&page=0`,
          { headers: { 'X-Authorization': `Bearer ${token}` } }
        );
        const deviceInfos = tbResponse.data.data || [];
        const activeMap = {};
        deviceInfos.forEach(device => {
          if (device.id && device.id.id) {
            activeMap[device.id.id] = device.active;
          }
        });
    
        const devices = tbResponse.data?.data || [];
        console.log(`📦 Fetched ${devices.length} devices from ThingsBoard.`);
    
        const telemetryKeys = ['DeviceId', 'MacAddress', 'SerialNum', 'Location', 'Status'];
    
        const formattedDevices = await Promise.all(devices.map(async (device) => {
          const tb_device_id = device?.id?.id;
          const device_name = device?.name || 'Unnamed Device';
    
          // ✅ Filter only devices with 'lift' in the name (case-insensitive)
          if (!tb_device_id || !device_name.toLowerCase().includes("lift")) {
            return null;
          }
    
          let telemetry = {};
    
          try {
            const telemetryRes = await axios.get(
              `${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${tb_device_id}/values/timeseries?keys=${telemetryKeys.join(',')}`,
              { headers: { 'X-Authorization': `Bearer ${token}` } }
            );
    
            telemetryKeys.forEach(key => {
              telemetry[key] = telemetryRes.data?.[key]?.[0]?.value ?? null;
            });
          } catch (err) {
            console.warn(`⚠️ Telemetry fetch failed for ${device_name}:`, err.message);
          }
    
          try {
            await db.execute(
              `INSERT INTO devices (tb_device_id, device_name, DeviceId, MacAddress, SerialNum, Location, Status)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
                 device_name = VALUES(device_name),
                 DeviceId = VALUES(DeviceId),
                 MacAddress = VALUES(MacAddress),
                 SerialNum = VALUES(SerialNum),
                 Location = VALUES(Location),
                 Status = VALUES(Status)`,
              [
                tb_device_id,
                device_name ?? null,
                telemetry.DeviceId ?? null,
                telemetry.MacAddress ?? null,
                telemetry.SerialNum ?? null,
                telemetry.Location ?? null,
                telemetry.Status ?? null
              ]
            );
          } catch (dbErr) {
            console.warn(`⚠️ DB error inserting ${device_name}:`, dbErr.message);
            return null;
          }
    
          return {
            tb_device_id,
            device_name,
            DeviceId: telemetry.DeviceId,
            MacAddress: telemetry.MacAddress,
            SerialNum: telemetry.SerialNum,
            Location: telemetry.Location,
            Status: telemetry.Status
          };
        }));
    
        const inserted = formattedDevices.filter(Boolean);
    
        res.json({
          success: true,
          count: inserted.length,
          devices: inserted
        });
    
      } catch (err) {
        console.error('❌ Sync error:', err?.response?.data || err.message);
        res.status(500).json({
          error: 'Failed to sync devices',
          details: err?.response?.data?.message || err.message
        });
      }
    });
    

// ---------------- ROOT ROUTE -------------------
// Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ---------------- START SERVER -------------------
app.listen(PORT, config.server.host, () => {
  console.log(`🚀 EMS Backend Server Started!`);
  console.log(`📍 Local Access: http://localhost:${PORT}`);
  console.log(`🌐 Network Access: http://192.168.1.40:${PORT}`);
  console.log(`📊 Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
  console.log(`🔧 Server listening on: ${config.server.host}:${PORT}`);
  console.log(`✅ Ready to accept connections from localhost and network devices`);
});

// Get detailed telemetry devices assigned to a user
app.get('/api/user-devices-details/:address', async (req, res) => {
  const address = req.params.address;
  try {
    const [rows] = await db.execute(`
      SELECT td.*, ud.tb_device_id
      FROM user_devices ud
      JOIN users u ON ud.user_id = u.id
      JOIN Telemetry_Device td ON ud.tb_device_id = td.tb_device_id
      WHERE u.address = ?
    `, [address]);

    if (rows.length === 0) {
      console.log(`[INFO] No telemetry devices found for user '${address}'`);
      return res.json([]);
    }

    // Fetch all device infos from ThingsBoard to get active status
    let activeMap = {};
    try {
      const token = await getThingsBoardToken();
      const tbResponse = await axios.get(
        `${TB_BASE_URL}/api/deviceInfos/all?pageSize=1000&page=0`,
        { headers: { 'X-Authorization': `Bearer ${token}` } }
      );
      const deviceInfos = tbResponse.data.data || [];
      deviceInfos.forEach(device => {
        if (device.id && device.id.id) {
          activeMap[device.id.id] = device.active;
        }
      });
    } catch (err) {
      console.error('[WARN] Could not fetch deviceInfos for active status:', err.message);
    }

    // Add active status to each device
    const result = rows.map(dev => ({
      ...dev,
      active: activeMap[dev.tb_device_id] === true
    }));

    res.json(result);
  } catch (err) {
    console.error('[ERROR] Failed to fetch user device details:', err);
    res.status(500).json({ error: 'Failed to load user device details' });
  }
});
// --------------DEVICES APIS---------------
//all devices mapped or unmapped
app.get('/api/user-devices', async (req, res) => {
  const [rows] = await db.execute('SELECT tb_device_id FROM user_devices');
  res.json(rows);
});
//only for devices page (loading all devices)
app.get('/api/devices', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, u.address
      FROM devices d
      LEFT JOIN user_devices ud ON d.tb_device_id = ud.tb_device_id
      LEFT JOIN users u ON ud.user_id = u.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//---------------------LOGS----------------------------

// 2. Auto-fetch and save telemetry every minute
const fetchAndSaveTelemetry = async () => {
  try {
    const [devices] = await db.execute('SELECT tb_device_id,DeviceId FROM devices');
    const token = await getThingsBoardToken();
    const telemetryKeys = ['CUR', 'VBUS', 'SPD', 'RPM', 'POS'];

    // Fetch all device infos from ThingsBoard
    const tbResponse = await axios.get(
      `${TB_BASE_URL}/api/deviceInfos/all?pageSize=1000&page=0`,
      { headers: { 'X-Authorization': `Bearer ${token}` } }
    );
    const deviceInfos = tbResponse.data.data || [];
    const activeMap = {};
    deviceInfos.forEach(device => {
      if (device.id && device.id.id) {
        activeMap[device.id.id] = device.active;
      }
    });

    // Now, loop through your DB devices (not deviceInfos)
    let anyActive = false;
    let savedAt = null;
    let savedId = null;
    for (const device of devices) {
      const tb_device_id = device.tb_device_id;
      const DeviceId = device.DeviceId || null;
      const isActive = activeMap[tb_device_id];
      console.log(`Device ${tb_device_id} active status:`, isActive);
      if (!isActive) {
        console.log('Device Inactive');
        continue; // Skip saving telemetry for inactive devices
      }
      const telemetryRes = await axios.get(
        `${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${tb_device_id}/values/timeseries?keys=${telemetryKeys.join(',')}`,
        { headers: { 'X-Authorization': `Bearer ${token}` } }
      );

      const data = telemetryKeys.map(k => telemetryRes.data?.[k]?.[0]?.value ?? null);
      await db.execute(
        `INSERT INTO device_logs (tb_device_id,DeviceId, CUR, VBUS, SPD, RPM, POS) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [tb_device_id, DeviceId, ...data]
      );
      anyActive = true;
      savedAt = new Date().toLocaleTimeString();
      savedId = tb_device_id;
    }
    if (anyActive) {
      console.log(`✅ Telemetry saved at ${savedAt} for ID = '${savedId}'`);
    } else {
      console.log('All devices inactive');
    }
  } catch (err) {
    console.error('❌ Error saving telemetry:', err.message);
  }
};

// setInterval(fetchAndSaveTelemetry, 60 * 1000); // Every minute
let autoSaveEnabled = true; // Set to false to pause auto-saving

setInterval(() => {
  if (autoSaveEnabled) {
    fetchAndSaveTelemetry();
  } else {
    console.log('⏸️ Auto-saving paused');
  }
}, 60 * 1000);

// 3. API: Get latest data for all devices
app.get('/api/logs/latest', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, dev.device_name, dev.Location as city, u.address
      FROM device_logs d
      INNER JOIN (
        SELECT tb_device_id, MAX(log_time) AS latest
        FROM device_logs
        GROUP BY tb_device_id) AS latest_logs
        ON d.tb_device_id = latest_logs.tb_device_id AND d.log_time = latest_logs.latest
      LEFT JOIN devices dev ON d.tb_device_id = dev.tb_device_id
      LEFT JOIN user_devices ud ON d.tb_device_id = ud.tb_device_id
      LEFT JOIN users u ON ud.user_id = u.id;
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

// 3b. API: Get latest data for all devices mapped to a supervisor
app.get('/api/logs/supervisor-latest', async (req, res) => {
  const { supervisor_id } = req.query;
  if (!supervisor_id) {
    return res.status(400).json({ error: 'Missing supervisor_id' });
  }
  try {
    // Get all tb_device_ids mapped to users under this supervisor
    const [devices] = await db.execute(`
      SELECT ud.tb_device_id
      FROM user_devices ud
      JOIN users u ON ud.user_id = u.id
      WHERE u.supervisor_id = ?
    `, [supervisor_id]);
    if (!devices.length) return res.json([]);
    const deviceIds = devices.map(d => d.tb_device_id);
    // Get latest log for each device
    const [rows] = await db.query(`
      SELECT d.*, dev.device_name, dev.Location as city
      FROM device_logs d
      INNER JOIN (
        SELECT tb_device_id, MAX(log_time) AS latest
        FROM device_logs
        WHERE tb_device_id IN (${deviceIds.map(() => '?').join(',')})
        GROUP BY tb_device_id) AS latest_logs
        ON d.tb_device_id = latest_logs.tb_device_id AND d.log_time = latest_logs.latest
      LEFT JOIN devices dev ON d.tb_device_id = dev.tb_device_id;
    `, deviceIds);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

// 4. API: Download logs in date range
// API: Download selected logs as zip of CSVs
app.get('/api/logs/download-selected', async (req, res) => {
  const { ids, from, to, format = 'csv' } = req.query;
  if (!ids || !from || !to) {
    return res.status(400).json({ error: 'Missing ids, from, or to parameter' });
  }
  const deviceIds = ids.split(',');
  if (deviceIds.length > 10) {
    return res.status(400).json({ error: 'You can download logs for a maximum of 10 devices at a time.' });
  }
  const isZip = deviceIds.length > 1;
  if (isZip) {
    res.setHeader('Content-disposition', 'attachment; filename=selected_logs.zip');
    res.set('Content-Type', 'application/zip');
  }
  let archive;
  if (isZip) {
    archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
  }
  for (const tb_device_id of deviceIds) {
    // Fetch logs for this device
    const [rows] = await db.execute(`
      SELECT d.*, u.address
      FROM device_logs d
      LEFT JOIN user_devices ud ON d.tb_device_id = ud.tb_device_id
      LEFT JOIN users u ON ud.user_id = u.id
      WHERE d.tb_device_id = ? AND d.log_time BETWEEN ? AND ?
      ORDER BY d.log_time
    `, [tb_device_id, from, to]);
    if (!rows.length) continue;
    const address = rows[0].address || '-';
    const header = ['Date and Time', 'Current', 'DC Bus', 'Speed', 'RPM', 'Position'];
    const dataRows = rows.map(r => [
      formatDateTime(r.log_time),
      r.CUR == null ? 0 : r.CUR,
      r.VBUS == null ? 0 : r.VBUS,
      r.SPD == null ? 0 : r.SPD,
      r.RPM == null ? 0 : r.RPM,
      r.POS == null ? 0 : r.POS
    ]);
    let fileName = `${tb_device_id}_logs`;
    if (format === 'csv') {
      const csvRows = [
        [address, tb_device_id],
        [],
        header,
        ...dataRows
      ];
      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      if (isZip) {
        archive.append(csvContent, { name: `${fileName}.csv` });
      } else {
        res.setHeader('Content-disposition', `attachment; filename=${fileName}.csv`);
        res.set('Content-Type', 'text/csv');
        return res.send(csvContent);
      }
    } else if (format === 'xls') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Logs');
      ws.addRow([address, tb_device_id]);
      ws.mergeCells('A1:F1');
      ws.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
      ws.addRow([]);
      ws.addRow(header);
      dataRows.forEach(row => ws.addRow(row));
      ws.columns.forEach(col => {
        col.alignment = { horizontal: 'center', vertical: 'middle' };
        let maxLength = 10;
        col.eachCell({ includeEmpty: true }, cell => {
          const len = (cell.value ? cell.value.toString().length : 0);
          if (len > maxLength) maxLength = len;
        });
        col.width = maxLength + 2;
      });
      const buffer = await workbook.xlsx.writeBuffer();
      if (isZip) {
        archive.append(buffer, { name: `${fileName}.xlsx` });
      } else {
        res.setHeader('Content-disposition', `attachment; filename=${fileName}.xlsx`);
        res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        return res.send(Buffer.from(buffer));
      }
    // } else if (format === 'pdf') {
    //   const PDFDocument = require('pdfkit');
    //   const doc = new PDFDocument({ margin: 30, size: 'A4' });
    //   let buffers = [];
    //   doc.on('data', buffers.push.bind(buffers));
    //   doc.on('end', () => {
    //     const pdfBuffer = Buffer.concat(buffers);
    //     if (isZip) {
    //       archive.append(pdfBuffer, { name: `${fileName}.pdf` });
    //     } else {
    //       res.setHeader('Content-disposition', `attachment; filename=${fileName}.pdf`);
    //       res.set('Content-Type', 'application/pdf');
    //       res.send(pdfBuffer);
    //     }
    //   });
      doc.fontSize(16).text(`${address} | ${tb_device_id}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      header.forEach(h => {
        doc.text(h, { continued: true, align: 'center', width: 80 });
      });
      doc.text('');
      dataRows.forEach(row => {
        row.forEach(cell => {
          doc.text(cell == null ? '' : cell.toString(), { continued: true, align: 'center', width: 80 });
        });
        doc.text('');
      });
      doc.end();
      if (!isZip) {
        await new Promise(resolve => doc.on('finish', resolve));
        return;
      } else {
        await new Promise(resolve => doc.on('finish', resolve));
      }
    }
  }
  if (isZip) archive.finalize();
});

// 5. API: Download all logs in date range
app.get('/api/logs/download-all', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'Missing from or to date' });
  }
  try {
    const [rows] = await db.execute(
      `SELECT * FROM device_logs WHERE log_time BETWEEN ? AND ? ORDER BY tb_device_id, log_time`,
      [from, to]
    );
    // --- PDF Generation ---
    // const doc = new PDFDocument({ margin: 30, size: 'A4' });
    // res.setHeader('Content-disposition', `attachment; filename=all_devices_logs.pdf`);
    // res.setHeader('Content-Type', 'application/pdf');
    // doc.pipe(res);

    // doc.fontSize(16).text('All Devices Logs', { align: 'center' });
    // doc.moveDown();
    // doc.fontSize(12);
    // // Table header
    // doc.text('Sr No', 30, doc.y, { continued: true });
    // doc.text('Device ID', 70, doc.y, { continued: true });
    // doc.text('Time', 150, doc.y, { continued: true });
    // doc.text('Current', 250, doc.y, { continued: true });
    // doc.text('DC Bus', 320, doc.y, { continued: true });
    // doc.text('Speed', 390, doc.y, { continued: true });
    // doc.text('RPM', 450, doc.y, { continued: true });
    // doc.text('Position', 500, doc.y);
    // doc.moveDown(0.5);
    // // Table rows
    // rows.forEach((r, idx) => {
    //   doc.text(idx + 1, 30, doc.y, { continued: true });
    //   doc.text(r.tb_device_id, 70, doc.y, { continued: true });
    //   doc.text(r.log_time, 150, doc.y, { continued: true });
    //   doc.text(r.Current == null ? 0 : r.Current, 250, doc.y, { continued: true });
    //   doc.text(r.dcbus == null ? 0 : r.dcbus, 320, doc.y, { continued: true });
    //   doc.text(r.speed == null ? 0 : r.speed, 390, doc.y, { continued: true });
    //   doc.text(r.rpm == null ? 0 : r.rpm, 450, doc.y, { continued: true });
    //   doc.text(r.position == null ? 0 : r.position, 500, doc.y);
    // });
    // doc.end();

    // --- CSV Generation (commented out) ---
    
    const csv = [
      ['Device ID', 'Time', 'Current', 'DC Bus', 'Speed', 'RPM', 'Position'],
      ...rows.map(r => [
        r.tb_device_id,
        r.log_time,
        r.Current == null ? 0 : r.Current,
        r.dcbus == null ? 0 : r.dcbus,
        r.speed == null ? 0 : r.speed,
        r.rpm == null ? 0 : r.rpm,
        r.position == null ? 0 : r.position
      ])
    ];
    res.setHeader('Content-disposition', `attachment; filename=all_devices_logs.csv`);
    res.set('Content-Type', 'text/csv');
    res.send(csv.map(row => row.join(',')).join('\n'));
    
  } catch (err) {
    console.error('❌ Export all logs error:', err.message);
    res.status(500).json({ error: 'Export error', details: err.message });
  }
});

const formatDateTime = (dt) => {
  if (!dt) return '';
  const d = new Date(dt);
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};



// Add these endpoints to your server.js for duplicate checking and CSRF protection

// CSRF token generation
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  res.json({ token });
});

// Duplicate checking endpoint
app.post('/api/check-duplicate/:field', async (req, res) => {
  try {
    const { field } = req.params;
    const { value } = req.body;
    
    // Rate limiting for duplicate checks
    const clientIP = req.ip;
    const key = `duplicate_check:${clientIP}:${field}`;
    
    // Check if too many requests
    const attempts = await redis.get(key) || 0;
    if (attempts > 10) {
      return res.status(429).json({ error: 'Too many duplicate checks' });
    }
    
    // Increment counter
    await redis.incr(key);
    await redis.expire(key, 60); // 1 minute
    
    let query;
    let params;
    
    switch (field) {
      case 'email':
        query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
        params = [value];
        break;
      case 'phone':
        query = 'SELECT COUNT(*) as count FROM users WHERE phone = ?';
        params = [value];
        break;
      case 'supervisor_id':
        query = 'SELECT COUNT(*) as count FROM supervisors WHERE supervisor_id = ?';
        params = [value];
        break;
      default:
        return res.status(400).json({ error: 'Invalid field' });
    }
    
    const [result] = await db.execute(query, params);
    const exists = result.count > 0;
    
    res.json({ exists });
    
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




