import mysql from 'mysql2';
import config from './config.js';

const pool = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  port: config.database.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Test connection
promisePool.query('SELECT 1')
  .then(() => {
    console.log(`✓ Database connected: ${config.database.name}`);
  })
  .catch((err) => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });

export default promisePool;