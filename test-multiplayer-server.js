// Servidor temporal para probar múltiples usuarios en el sistema multijugador
const express = require('express');
const path = require('path');
const app = express();

// Servir archivos estáticos del build de React
app.use(express.static(path.join(__dirname, 'build')));

// Manejar la ruta raíz y otras rutas de React Router
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/join/:lobbyId', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/game/:gameId', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Puerto diferente para simular otro usuario
const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
  console.log('🧪 =============================================');
  console.log('    SERVIDOR DE PRUEBAS MULTIJUGADOR');
  console.log('🧪 =============================================');
  console.log(`✅ Usuario Simulado #1: http://localhost:3001`);
  console.log(`✅ Usuario Simulado #2: http://localhost:${PORT}`);
  console.log('');
  console.log('📋 INSTRUCCIONES PARA PROBAR:');
  console.log('');
  console.log('1. 🎮 HOST (localhost:3001):');
  console.log('   - Haz login normal');
  console.log('   - Crear/seleccionar juego');
  console.log('   - Presionar "Invitar Jugadores"');
  console.log('   - Copiar el link que aparece');
  console.log('');
  console.log('2. 👥 INVITADO (localhost:' + PORT + '):');
  console.log('   - Abrir el link copiado');
  console.log('   - Ingresar nombre del jugador');
  console.log('   - Ver la sincronización en tiempo real');
  console.log('');
  console.log('🔄 Ambos usuarios se conectarán al mismo backend');
  console.log('   (localhost:5003) para sincronización WebSocket');
  console.log('=============================================');
});