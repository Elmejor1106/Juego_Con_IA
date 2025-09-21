console.log('--- Loading server.js ---');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Custom Logger Middleware
app.use((req, res, next) => {
  console.log(`--- Incoming Request: ${req.method} ${req.originalUrl} ---`);
  next();
});

// Ruta Raíz
app.get('/', (req, res) => {
  res.send('Servidor del backend funcionando!');
});

// Definir Rutas de API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));

// Servir archivos estáticos del frontend (si aplica)
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

// Redirección para SPA: cualquier ruta que no sea API devuelve index.html
app.get(/^\/((?!api).)*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log('--- Attempting to connect to database... ---');
    const connection = await pool.getConnection();
    console.log('--- Database connection successful! ---');
    connection.release();

    app.listen(PORT, () => {
      console.log(`--- Server running on port ${PORT} ---`);
    });
  } catch (error) {
    console.error('--- FATAL: Failed to connect to the database. Server not started. ---');
    console.error(error);
    process.exit(1);
  }
};

startServer();