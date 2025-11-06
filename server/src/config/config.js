require('dotenv').config();
const fs = require('fs');
const path = require('path');

let globalConfig = null;
const configPath = path.join(__dirname, '../../../config.json');
if (fs.existsSync(configPath)) {
  try {
    globalConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.warn('Warning: Could not parse config.json, using environment variables');
  }
}

function getConfig(keyPath, defaultValue) {
  const envKey = keyPath.toUpperCase().replace(/\./g, '_');
  if (process.env[envKey] !== undefined) return process.env[envKey];
  
  if (globalConfig) {
    const keys = keyPath.split('.');
    let value = globalConfig;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    if (value !== undefined) return value;
  }
  
  return defaultValue;
}

module.exports = {
  env: getConfig('server.env', 'development'),
  port: parseInt(getConfig('server.port', 3000)),
  host: getConfig('server.host', 'localhost'),
  
  database: {
    host: getConfig('database.host', 'localhost'),
    user: getConfig('database.user', 'root'),
    password: getConfig('database.password', ''),
    name: getConfig('database.name', 'market_spoton_db'),
    port: parseInt(getConfig('database.port', 3306)),
    charset: getConfig('database.charset', 'utf8mb4'),
    timezone: getConfig('database.timezone', '+00:00')
  },
  
  jwt: {
    secret: getConfig('jwt.secret', 'your-super-secret-key-change-this-in-prod!'), // Stronger default
    expire: getConfig('jwt.expire', '7d'),
    algorithm: getConfig('jwt.algorithm', 'HS256')
  },
  
  bcrypt: {
    rounds: parseInt(getConfig('bcrypt.rounds', 12)) // Increased for security
  },
  
  cors: globalConfig?.server?.cors || {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }
};