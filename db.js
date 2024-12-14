const mysql = require('mysql2/promise');

// Konfigurasi koneksi pooling
const pool = mysql.createPool({
  host: '139.59.109.210',
  port: 3306,
  user: 'ccgnimex',
  password: 'aaaaaaac',
  database: 'ccgnimex',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Fungsi untuk mendapatkan koneksi dari pool
async function getConnection() {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error getting connection from pool:', error);
    throw error;
  }
}

module.exports = { getConnection };
