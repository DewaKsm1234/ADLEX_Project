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
    username, password, email, phone, address, device_id, supervisor_id
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
          `SELECT COUNT(*) as cnt FROM devices WHERE user_id IN (${placeholders})`,
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

// ---------------- DEVICES ENDPOINTS -------------------
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

// Get all unassigned devices
app.get('/api/unassigned-devices', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM devices WHERE user_id IS NULL');
    res.json(rows);
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
    const [userRows] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user_id = userRows[0].id;
    await db.execute(
      `INSERT INTO devices 
      (device_id, elevator_number, serial_number, mac_address, location, device_info, user_id, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [device_id, elevator_number, serial_number, mac_address, location, device_info, user_id, 'Online']
    );
    if (supervisor_id) {
      await db.execute(
        'UPDATE users SET supervisor_id = ? WHERE id = ?',
        [supervisor_id, user_id]
      );
    }
    await db.execute(
      'INSERT INTO logs (user_id, device_id, action) VALUES (?, ?, ?)',
      [user_id, device_id, `Device ${device_id} assigned to user ${username}`]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- START SERVER -------------------
app.listen(PORT, () => {
  console.log(`EMS Backend running on http://localhost:${PORT}`);
  console.log("Database: ems_dbnew");
});
