// server.js - EMS Backend API
// Provides endpoints for user, device, supervisor management, and authentication

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');

// Import axios for HTTP requests to ThingsBoard
const axios = require('axios');

const TB_BASE_URL = 'https://thingsboard.cloud';
const TB_USERNAME = 'rutuja.arekar@samsanlabs.com';
const TB_PASSWORD = 'Rutuja@Samsan113';

let tbToken = '';
let tbTokenExpiry = 0; // Unix timestamp

// Function to login and get a new token
async function loginToThingsBoard() {
  const response = await axios.post(`${TB_BASE_URL}/api/auth/login`, {
    username: TB_USERNAME,
    password: TB_PASSWORD
  });
  tbToken = response.data.token;
  // Token is valid for 1 hour (3600s); set expiry 5 min before
  tbTokenExpiry = Date.now() + (55 * 60 * 1000);
}

// Function to get a valid token (login if expired)
async function getThingsBoardToken() {
  if (!tbToken || Date.now() > tbTokenExpiry) {
    await loginToThingsBoard();
  }
  return tbToken;
}

const app = express();
const PORT = 3000;

// MySQL connection configuration
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'ems_dbnew'
}).promise();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- LOGIN ENDPOINT -------------------
// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM users_login WHERE username = ? AND password = ?',
      [username, password]
    );
    if (rows.length > 0) {
      res.json({ success: true, role: rows[0].role, username: rows[0].username });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- USERS ENDPOINTS -------------------
// Register new user (with device and supervisor assignment)
app.post('/api/register', async (req, res) => {
  const {
    username, password, email, phone, address, tb_device_id, supervisor_id
  } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'INSERT INTO users_login (username, password, role) VALUES (?, ?, ?)',
      [username, password, 'user']
    );
    const [userResult] = await conn.execute(
      'INSERT INTO users (username, email, phone, address, supervisor_id) VALUES (?, ?, ?, ?, ?)',
      [username, email, phone, address, supervisor_id || null]
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
app.get('/api/users', async (req, res) => {
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
app.post('/api/assign-supervisor', async (req, res) => {
  const { username, supervisor_id } = req.body;
  try {
    await db.execute(
      'UPDATE users SET supervisor_id = ? WHERE username = ?',
      [supervisor_id, username]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign Device to User
app.post('/api/assign-device', async (req, res) => {
  const { username, tb_device_id } = req.body;
  try {
    // Get user_id from username
    const [userRows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user_id = userRows[0].id;
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

// Devices for a specific user
app.get('/api/user-devices/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.* FROM user_devices d
      JOIN users u ON d.user_id = u.id
      WHERE u.username = ?
    `, [req.params.username]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to get all unassigned devices (not mapped to any user)
app.get('/api/unassigned-devices', async (req, res) => {
  try {
    // Get all device IDs from Telemetry_Device
    const [allDevices] = await db.execute('SELECT tb_device_id, DeviceName FROM Telemetry_Device');
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


// ---------------- SUPERVISORS ENDPOINTS -------------------
// Register supervisor
app.post('/api/register-supervisor', async (req, res) => {
  const { supervisor_id, first_name, last_name, email, phone, password } = req.body;
  try {
    await db.execute(
      'INSERT INTO users_login (username, password, role) VALUES (?, ?, ?)',
      [supervisor_id, password, 'supervisor']
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
app.get('/api/supervisors', async (req, res) => {
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

// ---------------- DEVICES ENDPOINTS -------------------
// Remove all endpoints and logic that reference the devices table

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
  const tbToken = await getThingsBoardToken(); // Your existing function to get TB token

  // List of telemetry keys to fetch from ThingsBoard
  const telemetryKeys = [
    'DeviceName','DirCount','DoorAStatus','DoorBStatus','EmergencyAlarm','LastSignalDate','LastSignalTime',
    'latitude','Location','Longitude','MacAddress','position','rpm','SerialNum','speed','Status',
    'TotalDistanceTravelled','TotalStopCount','TotalTravelTime','TotalWorkTime','AlarmActive','Current','dcbus','DeviceId'
  ];

  try {
    // Step 1: Fetch telemetry from ThingsBoard
    const response = await axios.get(
      `${TB_BASE_URL}/api/plugins/telemetry/DEVICE/${tb_device_id}/values/timeseries?keys=${telemetryKeys.join(',')}`,
      { headers: { Authorization: `Bearer ${tbToken}` } }
    );
    const tbData = response.data;
    console.log('ThingsBoard response:', JSON.stringify(tbData, null, 2));

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
    SELECT u.username
    FROM user_devices ud
    JOIN users u ON ud.user_id = u.id
    WHERE ud.tb_device_id = ?
    LIMIT 1
    `, [tb_device_id]);


    telemetry.username = userRows.length > 0 ? userRows[0].username : 'NA';

    // Step 5: Respond to frontend
    res.json({
      tb_device_id,
      ...telemetry
    });

  } catch (err) {
    console.error('Telemetry sync error:', err.message);
    res.status(500).json({
      error: 'Failed to sync telemetry',
      details: err.message
    });
  }
});


/**
 * Sync all devices from ThingsBoard and store in a minimal devices table.
 * POST /api/sync-thingsboard-devices
 * This should be run by an admin to sync all available devices for navigation/assignment.
 */
app.post('/api/sync-thingsboard-devices', async (req, res) => {
  try {
    const tbToken = await getThingsBoardToken();
    // Fetch all devices (limit 1000 for now)
    const response = await axios.get(
      `${TB_BASE_URL}/api/tenant/devices?limit=1000`,
      { headers: { Authorization: `Bearer ${tbToken}` } }
    );
    const devices = response.data.data || [];
    // For each device, upsert into devices table (tb_device_id, device_name)
    for (const dev of devices) {
      const tb_device_id = dev.id.id;
      const device_name = dev.name;
      // Upsert: if tb_device_id exists, update name; else insert
      await db.execute(
        `INSERT INTO devices (tb_device_id, device_name) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE device_name = VALUES(device_name)`,
        [tb_device_id, device_name]
      );
    }
    res.json({ success: true, count: devices.length });
  } catch (err) {
    console.error('Error syncing ThingsBoard devices:', err.message);
    res.status(500).json({ error: 'Failed to sync devices', details: err.message });
  }
});

// ---------------- ROOT ROUTE -------------------
// Redirect root to login page
app.get('/', (req, res) => {
  res.redirect('/login.html');
});

// ---------------- START SERVER -------------------
app.listen(PORT, () => {
  console.log(`EMS Backend running on http://localhost:${PORT}`);
  console.log("✅❌Database: ems_dbnew");
});

app.get('/api/user-devices-details/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT td.*, ud.tb_device_id
      FROM user_devices ud
      JOIN users u ON ud.user_id = u.id
      JOIN Telemetry_Device td ON ud.tb_device_id = td.tb_device_id
      WHERE u.username = ?
    `, [req.params.username]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// // Get user info for a device
// app.get('/api/device-user/:tb_device_id', async (req, res) => {
//   const { tb_device_id } = req.params;

//   try {
//     // SQL JOIN to get user details from tb_device_id
//     const [rows] = await db.execute(`
//       SELECT u.username, u.first_name, u.last_name
//       FROM users u
//       JOIN user_devices ud ON u.id = ud.user_id
//       WHERE ud.tb_device_id = ?
//       LIMIT 1
//     `, [tb_device_id]);

//     if (rows.length === 0) {
//       return res.status(404).json({ error: 'No user assigned to this device' });
//     }

//     res.json(rows[0]); // returns { username, first_name, last_name }
//   } catch (err) {
//     console.error('Error fetching device user:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

