console.log('--- Loading server.js ---');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta Raíz
app.get('/', (req, res) => {
  res.send('Servidor del backend funcionando!');
});

// Definir Rutas de API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/ai', require('./routes/ai'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});