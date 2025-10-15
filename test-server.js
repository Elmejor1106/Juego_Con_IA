// Servidor temporal para pruebas de WebSocket
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3002",
    methods: ["GET", "POST"]
  }
});

// Estado del lobby en memoria
const gameLobbies = new Map();

console.log('--- Servidor de prueba iniciado ---');

// Configuración de WebSocket
io.on('connection', (socket) => {
  console.log('--- Usuario conectado:', socket.id, '---');

  // Unirse a un lobby
  socket.on('join-lobby', (data) => {
    const { gameId, lobbyCode, playerName, playerId } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`--- Intento de unión al lobby: ${lobbyKey}, Jugador: ${playerName} ---`);
    
    if (!gameLobbies.has(lobbyKey)) {
      gameLobbies.set(lobbyKey, {
        players: [],
        gameStarted: false,
        gameId: gameId,
        lobbyCode: lobbyCode,
        maxPlayers: 6
      });
    }
    
    const lobby = gameLobbies.get(lobbyKey);
    
    const existingPlayer = lobby.players.find(p => p.id === playerId);
    if (!existingPlayer && lobby.players.length < lobby.maxPlayers) {
      const newPlayer = {
        id: playerId || socket.id,
        username: playerName,
        socketId: socket.id,
        ready: true,
        isHost: lobby.players.length === 0
      };
      
      lobby.players.push(newPlayer);
      socket.join(lobbyKey);
      
      console.log(`--- ✅ Jugador ${playerName} se unió al lobby ${lobbyKey} ---`);
      
      io.to(lobbyKey).emit('lobby-updated', {
        players: lobby.players,
        gameStarted: lobby.gameStarted
      });
      
      socket.emit('join-success', { 
        lobbyKey,
        playerId: newPlayer.id,
        isHost: newPlayer.isHost
      });
    } else if (existingPlayer) {
      existingPlayer.socketId = socket.id;
      socket.join(lobbyKey);
      console.log(`--- ✅ Jugador ${playerName} reconectado al lobby ${lobbyKey} ---`);
      socket.emit('join-success', { 
        lobbyKey,
        playerId: existingPlayer.id,
        isHost: existingPlayer.isHost
      });
    } else {
      console.log(`--- ❌ Lobby ${lobbyKey} lleno ---`);
      socket.emit('join-error', { message: 'Lobby lleno' });
    }
  });

  // Iniciar el juego
  socket.on('start-game', (data) => {
    const { lobbyKey } = data;
    const lobby = gameLobbies.get(lobbyKey);
    
    if (lobby && !lobby.gameStarted) {
      lobby.gameStarted = true;
      console.log(`--- 🎮 Juego iniciado en lobby ${lobbyKey} ---`);
      
      io.to(lobbyKey).emit('game-started', {
        gameId: lobby.gameId,
        lobbyCode: lobby.lobbyCode,
        players: lobby.players
      });
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('--- Usuario desconectado:', socket.id, '---');
    
    gameLobbies.forEach((lobby, lobbyKey) => {
      const playerIndex = lobby.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const removedPlayer = lobby.players.splice(playerIndex, 1)[0];
        console.log(`--- Jugador ${removedPlayer.username} removido del lobby ${lobbyKey} ---`);
        
        if (removedPlayer.isHost && lobby.players.length > 0) {
          lobby.players[0].isHost = true;
        }
        
        io.to(lobbyKey).emit('lobby-updated', {
          players: lobby.players,
          gameStarted: lobby.gameStarted
        });
        
        if (lobby.players.length === 0) {
          gameLobbies.delete(lobbyKey);
          console.log(`--- Lobby ${lobbyKey} eliminado ---`);
        }
      }
    });
  });
});

const PORT = 5001;
server.listen(PORT, () => {
  console.log(`--- ✅ Servidor de prueba corriendo en puerto ${PORT} ---`);
  console.log(`--- ✅ WebSocket listo para lobbies multijugador ---`);
});