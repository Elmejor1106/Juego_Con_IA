
require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
// No mostramos la contraseña por seguridad

let pool;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log('Pool de conexiones a MySQL creado exitosamente.');
} catch (error) {
  console.error('Error al crear el pool de conexiones:', error);
}

module.exports = pool;
