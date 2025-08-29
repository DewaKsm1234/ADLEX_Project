// config.js  is a bridge layer
require('dotenv').config();
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
