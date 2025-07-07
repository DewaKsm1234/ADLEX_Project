// server.js - EMS Backend API
// Provides endpoints for user, device, supervisor management, and authentication

const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const cors = require('cors');

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

// ---------------- API ROUTES -------------------

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

// Register new user (with device and supervisor assignment)
app.post('/api/register', async (req, res) => {
  const {
    username, password, email, phone, address, device_id, supervisor_id
  } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Insert into users_login
    await conn.execute(
      'INSERT INTO users_login (username, password, role) VALUES (?, ?, ?)',
      [username, password, 'user']
    );
    // Insert into users
    const [userResult] = await conn.execute(
      'INSERT INTO users (username, email, phone, address, supervisor_id) VALUES (?, ?, ?, ?, ?)',
      [username, email, phone, address, supervisor_id || null]
    );
    const user_id = userResult.insertId;
    // Assign device to user
    if (device_id) {
      await conn.execute(
        'UPDATE devices SET user_id = ? WHERE device_id = ?',
        [user_id, device_id]
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

// Assign Device to User
app.post('/api/assign-device', async (req, res) => {
  const {
    username, location, elevator_number, device_id,
    serial_number, mac_address, device_info, supervisor_id
  } = req.body;

  try {
    // Get user_id from username
    const [userRows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user_id = userRows[0].id;

    // Insert device
    await db.execute(
      `INSERT INTO devices 
      (device_id, elevator_number, serial_number, mac_address, location, device_info, user_id, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [device_id, elevator_number, serial_number, mac_address, location, device_info, user_id, 'Online']
    );

    // Update user's supervisor_id if provided
    if (supervisor_id) {
      await db.execute(
        'UPDATE users SET supervisor_id = ? WHERE id = ?',
        [supervisor_id, user_id]
      );
    }

    // Log the assignment
    await db.execute(
      'INSERT INTO logs (user_id, device_id, action) VALUES (?, ?, ?)',
      [user_id, device_id, `Device ${device_id} assigned to user ${username}`]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

// Fetch all supervisors
app.get('/api/supervisors', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM supervisors');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all devices
app.get('/api/devices', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, u.username, u.email 
      FROM devices d 
      LEFT JOIN users u ON d.user_id = u.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Devices for a specific user
app.get('/api/user-devices/:username', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.* FROM devices d
      JOIN users u ON d.user_id = u.id
      WHERE u.username = ?
    `, [req.params.username]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device details
app.get('/api/device/:deviceId', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, u.username, u.email, u.phone 
      FROM devices d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE d.device_id = ?
    `, [req.params.deviceId]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Device not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supervisor's devices
app.get('/api/super-devices/:supervisorId', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT d.*, u.username, u.email, u.phone 
      FROM devices d
      JOIN users u ON d.user_id = u.id
      WHERE u.supervisor_id = ?
    `, [req.params.supervisorId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logs (view + add)
app.get('/api/logs', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT l.*, u.username, u.email 
      FROM logs l 
      LEFT JOIN users u ON l.user_id = u.id 
      ORDER BY l.timestamp DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/logs', async (req, res) => {
  const { username, device_id, action } = req.body;
  try {
    const [userRows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await db.execute(
      'INSERT INTO logs (user_id, device_id, action) VALUES (?, ?, ?)',
      [userRows[0].id, device_id, action]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device statistics (placeholder)
app.get('/api/stats/:deviceId', async (req, res) => {
  try {
    // This would connect to elevator_stats table when implemented
    const mockStats = {
      device_id: req.params.deviceId,
      total_trips: 150,
      average_speed: 2.5,
      uptime_percentage: 98.5,
      last_maintenance: '2024-01-15',
      next_maintenance: '2024-04-15'
    };
    res.json(mockStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Device errors (placeholder)
app.get('/api/errors/:deviceId', async (req, res) => {
  try {
    // This would connect to elevator_errors table when implemented
    const mockErrors = [
      {
        id: 1,
        device_id: req.params.deviceId,
        error_code: 'E001',
        error_message: 'Door sensor malfunction',
        severity: 'Medium',
        timestamp: '2024-01-20 10:30:00',
        resolved: false
      },
      {
        id: 2,
        device_id: req.params.deviceId,
        error_code: 'E002',
        error_message: 'Motor temperature high',
        severity: 'High',
        timestamp: '2024-01-19 15:45:00',
        resolved: true
      }
    ];
    res.json(mockErrors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Support form submission
app.post('/api/support', async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    // This would insert into support_logs table when implemented
    // For now, just log to console
    console.log('Support request:', { name, email, subject, message });
    res.json({ success: true, message: 'Support request submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supervisor summary: supervisor_id, name, contact, assigned_users, assigned_devices
app.get('/api/supervisors-summary', async (req, res) => {
  try {
    // Get all supervisors
    const [supervisors] = await db.execute('SELECT * FROM supervisors');
    // For each supervisor, count assigned users and devices
    const summary = await Promise.all(supervisors.map(async (sup) => {
      // Count users assigned to this supervisor
      const [userRows] = await db.execute('SELECT id FROM users WHERE supervisor_id = ?', [sup.supervisor_id]);
      const assigned_users = userRows.length;
      // Get all user ids for this supervisor
      const userIds = userRows.map(u => u.id);
      if (userIds.length > 0) {
        const placeholders = userIds.map(() => '?').join(',');
        const [deviceRows] = await db.execute(
          `SELECT COUNT(*) as cnt FROM devices WHERE user_id IN (${placeholders})`,
          userIds
        );
        assigned_devices = deviceRows[0].cnt;
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
    console.error('Error in /api/supervisors-summary:', err.message);
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
      const [devices] = await db.execute('SELECT * FROM devices WHERE user_id = ?', [user.id]);
      return {
        user,
        devices
      };
    }));
    res.json(userDeviceData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all unassigned devices
app.get('/api/unassigned-devices', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM devices WHERE user_id IS NULL');
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

// Start server
app.listen(PORT, () => {
  console.log(`EMS Backend running on http://localhost:${PORT}`);
  console.log("Database: ems_dbnew");
});
