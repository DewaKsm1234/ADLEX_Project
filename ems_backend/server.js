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
console.log('Fetching ThingsBoard token...');

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
    console.log('Login attempt:', username);

    const [rows] = await db.execute(
      'SELECT * FROM users_login WHERE username = ? AND password = ?',
      [username, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('Login successful. Starting background device sync...');

    // 🔄 Start background device sync (no await)
    axios.post(
      'http://localhost:3000/api/sync-thingsboard-devices',
      {},
      { headers: { 'Content-Type': 'application/json' } }
    )
    .then(() => console.log('Device sync started in background'))
    .catch(err => console.error('Device sync failed:', err.message));

    // ✅ Respond immediately (don't include sync result)
    res.json({
      success: true,
      username: rows[0].username,
      role: rows[0].role,
      message: 'Login successful. Device sync running in background.'
    });

  } catch (err) {
    console.error('Login or sync failed:', err);
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

    // Fetch telemetry from ThingsBoard for this device
    const tbToken = await getThingsBoardToken();
    const telemetryKeys = [
      'DeviceName','DirCount','DoorAStatus','DoorBStatus','EmergencyAlarm','LastSignalDate','LastSignalTime',
      'latitude','Location','Longitude','MacAddress','position','rpm','SerialNum','speed','Status',
      'TotalDistanceTravelled','TotalStopCount','TotalTravelTime','TotalWorkTime','AlarmActive','Current','dcbus','DeviceId'
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


// Devices for a specific user
app.get('/api/user-devices/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.* FROM devices d
      JOIN user_devices ud ON d.tb_device_id = ud.tb_device_id
      JOIN users u ON ud.user_id = u.id
      WHERE u.username = ?
    `, [req.params.username]);
 
    // console.log("Loaded devices for user:", rows);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/unassigned-devices', async (req, res) => {
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
app.get('/api/device-details/:tb_device_id', async (req, res) => {
  const { tb_device_id } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT DeviceId, SerialNum, MacAddress, Location 
       FROM devices 
       WHERE tb_device_id = ?`,
      [tb_device_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Device not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

    // ---------------- SYNC DEVICES ENDPOINT -------------------
    app.post('/api/sync-thingsboard-devices', async (req, res) => {
      try {
        console.log('🔄 Starting device sync from ThingsBoard...');
    
        const token = await getThingsBoardToken();
        console.log('✅ Auth token acquired');
    
        const tbResponse = await axios.get(`${TB_BASE_URL}/api/tenant/devices?pageSize=100&page=0`, {
          headers: { 'X-Authorization': `Bearer ${token}` }
        });
    
        const devices = tbResponse.data?.data || [];
        console.log(`📦 Fetched ${devices.length} devices from ThingsBoard.`);
    
        const telemetryKeys = ['DeviceId', 'MacAddress', 'SerialNum', 'Location', 'Status'];//State(Active or Inactive) of device also can be fetched from thingsboard not telemetry
        //Here States is telemetry
          const formattedDevices = await Promise.all(devices.map(async (device) => {
          const tb_device_id = device?.id?.id;
          const device_name = device?.name || 'Unnamed Device';
          if (!tb_device_id) return null;
    
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
app.listen(PORT, () => {
  console.log(`EMS Backend running on http://localhost:${PORT}`);
  console.log("✅❌Database: ems_dbnew");
});

// Get detailed telemetry devices assigned to a user
app.get('/api/user-devices-details/:username', async (req, res) => {
  const username = req.params.username;
  try {
    const [rows] = await db.execute(`
      SELECT td.*, ud.tb_device_id
      FROM user_devices ud
      JOIN users u ON ud.user_id = u.id
      JOIN Telemetry_Device td ON ud.tb_device_id = td.tb_device_id
      WHERE u.username = ?
    `, [username]);

    if (rows.length === 0) {
      console.log(`[INFO] No telemetry devices found for user '${username}'`);
    }

    res.json(rows);
  } catch (err) {
    console.error('[ERROR] Failed to fetch user device details:', err);
    res.status(500).json({ error: 'Failed to load user device details' });
  }
});
//only for devices
app.get('/api/devices', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT device_name, DeviceId, SerialNum, Location, Status FROM devices');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


