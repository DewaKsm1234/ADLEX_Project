// config.js  is a bridge layer
const fs = require('fs');
const path = require('path');

// Decide which .env file to load
// Priority:
// 1) Railway env when running on Railway
// 2) Docker env (.env) when inside a container
// 3) Local env (.env.local) for local development
// 4) Fallback to default .env if nothing else matches
const isDocker = fs.existsSync('/.dockerenv');
// const isRailway = Boolean(process.env.RAILWAY || process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL);

let selectedEnvPath = null;
if (isDocker && fs.existsSync(path.join(__dirname, '.env'))) {
  selectedEnvPath = path.join(__dirname, '.env');
} else if (!isDocker && fs.existsSync(path.join(__dirname, '.env.local'))) {
  selectedEnvPath = path.join(__dirname, '.env.local');
} else if (fs.existsSync(path.join(__dirname, '.env'))) {
  selectedEnvPath = path.join(__dirname, '.env');
}

require('dotenv').config(selectedEnvPath ? { path: selectedEnvPath } : undefined);
console.log("Loaded env file:", selectedEnvPath ? path.basename(selectedEnvPath) : 'process environment only');
console.log("DB_PASS loaded:", process.env.DB_PASS ? "yes" : "no");

module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'ems_dbnew',
  },
  
  server: {
    port: process.env.SERVER_PORT || 3000,
    host: process.env.SERVER_HOST || '0.0.0.0',
  },

  thingsboard: {
    baseUrl: process.env.TB_BASE_URL || 'https://thingsboard.cloud',
    username: process.env.TB_USERNAME || '',
    password: process.env.TB_PASSWORD || '',
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // convert string → boolean
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },
};
