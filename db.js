const mysql = require('mysql2/promise');

// Konfigurasi koneksi pooling
const pool = mysql.createPool({
  host: '142.132.150.169',
  user: 'ucxfiycw_sipremium',
  password: 'igzUR9GrENcvqr@',
  database: 'ucxfiycw_sipremium',
  waitForConnections: true,s
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
