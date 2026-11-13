// Database connection: one shared pool that every part of the API reuses.
// A pool keeps several connections open so requests don't wait on each other.
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'restaurant_db',
  waitForConnections: true,
  connectionLimit: 10,
  // Return DECIMAL columns (prices) as numbers instead of strings
  decimalNumbers: true,
});

// Used by the health check to confirm the database is reachable.
async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = { pool, pingDatabase };
