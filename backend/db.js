const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Tunumero200105',
  database: 'peluqueria_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a la base de datos establecida con éxito');
    connection.release();
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
}

testConnection();

module.exports = pool;