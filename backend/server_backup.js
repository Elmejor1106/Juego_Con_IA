console.log('--- Loading server.js ---');
require('dotenv').config({ path: __dirname + '/.env' });

// Debug: Verificar variables de entorno
console.log('=== DEBUG ENV VARIABLES ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('===============================');

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const pool = require('./config/db');
const imagesRoutes = require('./routes/images');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3001", "http://localhost:3002", "http://localhost:3005"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// === SISTEMA DE PUNTUACIÓN SIMPLIFICADO ===
// Estado del lobby en memoria
const gameLobbies = new Map(); // gameId-lobbyCode: { players: [], gameStarted: false, ... }
const gameTransitions = new Map(); // Para guardar jugadores durante la transición de lobby a juego

// NUEVO: Sistema simplificado de puntuación
const activeGameSessions = new Map(); // lobbyKey -> { players: Map(playerId -> {name, score, isHost, socketId}) }

// === FUNCIONES DEL SISTEMA SIMPLIFICADO ===
function initializeGameSession(lobbyKey, playersFromLobby) {
  console.log(`🎮 [Simple] Inicializando sesión de juego: ${lobbyKey}`);
  
  const playersMap = new Map();
  
  playersFromLobby.forEach(player => {
    const playerData = {
      id: player.id,
      name: player.name || player.username,
      score: 0,
      isHost: player.isHost || false,
      socketId: player.socketId || null
    };
    
    playersMap.set(player.id, playerData);
    console.log(`🎮 [Simple] Jugador agregado: ${playerData.name} (${playerData.id}) - Score: ${playerData.score}`);
  });
  
  activeGameSessions.set(lobbyKey, { players: playersMap });
  console.log(`🎮 [Simple] Sesión creada con ${playersMap.size} jugadores`);
}

function updatePlayerScore(lobbyKey, playerId, isCorrect) {
  console.log(`📊 [Simple] === ACTUALIZAR SCORE ===`);
  console.log(`📊 [Simple] LobbyKey: ${lobbyKey}`);
  console.log(`📊 [Simple] PlayerId: ${playerId}`);
  console.log(`📊 [Simple] Es correcta: ${isCorrect}`);
  
  const session = activeGameSessions.get(lobbyKey);
  if (!session) {
    console.log(`❌ [Simple] Sesión no encontrada: ${lobbyKey}`);
    return false;
  }
  
  const player = session.players.get(playerId);
  if (!player) {
    console.log(`❌ [Simple] Jugador no encontrado: ${playerId}`);
    console.log(`❌ [Simple] Jugadores disponibles:`, Array.from(session.players.keys()));
    return false;
  }
  
  // Actualizar score
  const oldScore = player.score;
  if (isCorrect) {
    player.score += 1;
  }
  
  console.log(`✅ [Simple] Score actualizado: ${player.name} ${oldScore} → ${player.score}`);
  return true;
}

function getPlayersArray(lobbyKey) {
  const session = activeGameSessions.get(lobbyKey);
  if (!session) {
    console.log(`❌ [Simple] No se puede obtener jugadores - sesión no existe: ${lobbyKey}`);
    return [];
  }
  
  const playersArray = Array.from(session.players.values());
  console.log(`📋 [Simple] Obteniendo ${playersArray.length} jugadores de ${lobbyKey}`);
  
  return playersArray;
}

function addOrUpdatePlayer(lobbyKey, playerData) {
  console.log(`👤 [Simple] Agregando/actualizando jugador en ${lobbyKey}:`, playerData);
  
  let session = activeGameSessions.get(lobbyKey);
  if (!session) {
    session = { players: new Map() };
    activeGameSessions.set(lobbyKey, session);
    console.log(`🆕 [Simple] Nueva sesión creada: ${lobbyKey}`);
  }
  
  const existingPlayer = session.players.get(playerData.id);
  if (existingPlayer) {
    // Actualizar datos existentes pero mantener score
    existingPlayer.name = playerData.name || existingPlayer.name;
    existingPlayer.socketId = playerData.socketId || existingPlayer.socketId;
    existingPlayer.isHost = playerData.isHost !== undefined ? playerData.isHost : existingPlayer.isHost;
    console.log(`🔄 [Simple] Jugador actualizado: ${existingPlayer.name} - Score mantenido: ${existingPlayer.score}`);
  } else {
    // Nuevo jugador
    const newPlayer = {
      id: playerData.id,
      name: playerData.name,
      score: 0,
      isHost: playerData.isHost || false,
      socketId: playerData.socketId || null
    };
    session.players.set(playerData.id, newPlayer);
    console.log(`➕ [Simple] Nuevo jugador agregado: ${newPlayer.name} - Score inicial: ${newPlayer.score}`);
  }
}

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

// Servir imágenes subidas de forma estática
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Definir Rutas de API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/rankings', require('./routes/rankings'));
app.use('/api/images', imagesRoutes);

// Configuración de WebSocket para lobbies multijugador
io.on('connection', (socket) => {
  console.log('🔗 --- Usuario conectado:', socket.id, '---');
  console.log('🌐 Origin:', socket.handshake.headers.origin);

  // Unirse a un lobby
  socket.on('join-lobby', (data) => {
    const { gameId, lobbyCode, playerName, playerId } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🎮 Join lobby attempt:`, {
      lobbyKey,
      playerName,
      playerId,
      socketId: socket.id,
      origin: socket.handshake.headers.origin
    });
    
    if (!gameLobbies.has(lobbyKey)) {
      gameLobbies.set(lobbyKey, {
        players: [],
        gameStarted: false,
        gameId: gameId,
        lobbyCode: lobbyCode,
        maxPlayers: 6,
        gameSettings: {
          maxPlayers: 6,
          timePerQuestion: 30,
          showCorrectAnswers: true
        }
      });
      console.log(`🆕 Nuevo lobby creado: ${lobbyKey}`);
    }
    
    const lobby = gameLobbies.get(lobbyKey);
    
    // Verificar si el jugador ya está en el lobby
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
      
      console.log(`✅ Jugador ${playerName} se unió al lobby ${lobbyKey} (Total: ${lobby.players.length})`);
      console.log(`👥 Jugadores actuales:`, lobby.players.map(p => p.username));
      
      // Notificar a todos los jugadores en el lobby
      const updateData = {
        players: lobby.players,
        gameStarted: lobby.gameStarted
      };
      
      console.log(`📢 Enviando lobby-updated a todos los clientes en ${lobbyKey}:`, updateData);
      io.to(lobbyKey).emit('lobby-updated', updateData);
      
      socket.emit('join-success', { 
        lobbyKey,
        playerId: newPlayer.id,
        isHost: newPlayer.isHost
      });
    } else if (existingPlayer) {
      // Actualizar socket del jugador existente
      existingPlayer.socketId = socket.id;
      socket.join(lobbyKey);
      console.log(`🔄 Jugador ${playerName} reconectado al lobby ${lobbyKey}`);
      
      socket.emit('join-success', { 
        lobbyKey,
        playerId: existingPlayer.id,
        isHost: existingPlayer.isHost
      });
      
      // Enviar estado actual
      io.to(lobbyKey).emit('lobby-updated', {
        players: lobby.players,
        gameStarted: lobby.gameStarted
      });
    } else {
      console.log(`❌ Lobby ${lobbyKey} lleno o error`);
      socket.emit('join-error', { message: 'Lobby lleno' });
    }
  });

  // Iniciar el juego
  socket.on('start-game', (data) => {
    const { lobbyKey, gameSettings } = data;
    console.log(`🚀 [WebSocket] === EVENTO START-GAME RECIBIDO ===`);
    console.log(`🚀 [WebSocket] LobbyKey:`, lobbyKey);
    console.log(`🚀 [WebSocket] GameSettings:`, gameSettings);
    console.log(`🚀 [WebSocket] Socket ID:`, socket.id);
    
    const lobby = gameLobbies.get(lobbyKey);
    console.log(`🚀 [WebSocket] Lobby encontrado:`, !!lobby);
    
    if (lobby) {
      console.log(`🚀 [WebSocket] Estado del lobby:`, {
        gameStarted: lobby.gameStarted,
        players: lobby.players.length,
        gameId: lobby.gameId,
        lobbyCode: lobby.lobbyCode
      });
    }
    
    if (lobby && !lobby.gameStarted) {
      lobby.gameStarted = true;
      lobby.gameSettings = gameSettings || {
        maxPlayers: 6,
        timePerQuestion: 30,
        showCorrectAnswers: true
      };
      console.log(`✅ [WebSocket] Juego iniciado en lobby ${lobbyKey} con configuraciones:`, lobby.gameSettings);
      
      // Guardar jugadores para la transición al juego
      const playersForGame = lobby.players.map(player => ({
        id: player.id,
        name: player.username,
        score: 0,
        isHost: player.isHost,
        socketId: null // Se actualizará cuando se conecten al juego
      }));
      
      gameTransitions.set(lobbyKey, {
        originalPlayers: playersForGame,
        gameId: lobby.gameId,
        lobbyCode: lobby.lobbyCode,
        gameSettings: lobby.gameSettings,
        timestamp: Date.now()
      });
      
      console.log(`💾 [WebSocket] Jugadores guardados para transición:`, playersForGame);
      
      const gameStartData = {
        gameId: lobby.gameId,
        lobbyCode: lobby.lobbyCode,
        players: lobby.players,
        gameSettings: lobby.gameSettings
      };
      
      console.log(`📡 [WebSocket] Enviando game-started a todos:`, gameStartData);
      
      // Notificar a todos los jugadores que el juego comenzó
      io.to(lobbyKey).emit('game-started', gameStartData);
    } else if (!lobby) {
      console.log(`❌ [WebSocket] Lobby ${lobbyKey} no encontrado`);
    } else {
      console.log(`⚠️ [WebSocket] Juego ya iniciado en ${lobbyKey}`);
    }
  });

  // Manejar respuestas de jugadores durante el juego
  // === NUEVO SISTEMA SIMPLIFICADO ===
  socket.on('player-answer', (data) => {
    const { gameId, lobbyCode, playerId, playerName, questionIndex, answer, isCorrect, timeLeft } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    const lobby = gameLobbies.get(lobbyKey);

    if (lobby) {
      console.log(`🎯 [Simple] === RESPUESTA RECIBIDA ===`);
      console.log(`🎯 [Simple] Jugador: ${playerName} (${playerId})`);
      console.log(`🎯 [Simple] Pregunta ${questionIndex} - Es correcta: ${isCorrect}`);
      
      // Actualizar score en el sistema simplificado
      const scoreUpdated = updatePlayerScore(lobbyKey, playerId, isCorrect);
      
      if (!scoreUpdated) {
        console.log(`❌ [Simple] No se pudo actualizar el score`);
        return;
      }
        
        // BÚSQUEDA MEJORADA: Primero por ID exacto, luego por nombre como fallback
        let player = null;
        let playerIndex = -1;
        let foundByName = false;
        
        // 1. BÚSQUEDA PRIMARIA: Por ID exacto
        for (let i = 0; i < lobby.players.length; i++) {
          const p = lobby.players[i];
          console.log(`🔍 [WebSocket] Comparando jugador ${i}: "${p.id}" (${typeof p.id}) === "${playerId}" (${typeof playerId}):`, p.id === playerId);
          
          if (String(p.id) === String(playerId)) {
            player = p;
            playerIndex = i;
            console.log(`✅ [WebSocket] MATCH por ID encontrado en índice ${i}: ${p.name} (ID: ${p.id})`);
            break;
          }
        }
        
        // 2. BÚSQUEDA SECUNDARIA: Por nombre si no se encontró por ID
        if (!player) {
          console.log(`🔍 [WebSocket] ID no encontrado, buscando por nombre: "${playerName}"`);
          for (let i = 0; i < lobby.players.length; i++) {
            const p = lobby.players[i];
            if (p.name === playerName) {
              console.log(`🔄 [WebSocket] JUGADOR ENCONTRADO POR NOMBRE: ${p.name}`);
              console.log(`🔄 [WebSocket] ID antiguo: "${p.id}" → ID nuevo: "${playerId}"`);
              
              // Actualizar ID del jugador con el nuevo ID
              p.id = playerId;
              player = p;
              playerIndex = i;
              foundByName = true;
              
              console.log(`✅ [WebSocket] ID del jugador actualizado correctamente`);
              break;
            }
          }
        }
        
        if (!player) {
          console.log(`❌ [WebSocket] JUGADOR NO ENCONTRADO NI POR ID NI POR NOMBRE`);
          console.log(`❌ [WebSocket] PlayerID buscado: "${playerId}" (${typeof playerId})`);
          console.log(`❌ [WebSocket] PlayerName: "${playerName}"`);
          console.log(`❌ [WebSocket] Jugadores disponibles:`);
          lobby.players.forEach((p, idx) => {
            console.log(`❌ [WebSocket]   ${idx}: ID="${p.id}" (${typeof p.id}), Name="${p.name}"`);
          });
          console.log(`❌ [WebSocket] Respuesta RECHAZADA para prevenir puntuación errónea`);
          
          // Notificar al cliente sobre el ID obsoleto para que se pueda sincronizar
          socket.emit('player-id-mismatch', {
            providedId: playerId,
            providedName: playerName,
            availablePlayers: lobby.players.map(p => ({ id: p.id, name: p.name }))
          });
          
          return; // SALIR SIN PROCESAR
        }
        
        // Log del método de búsqueda utilizado
        if (foundByName) {
          console.log(`🔄 [WebSocket] Jugador encontrado por NOMBRE y ID actualizado`);
        } else {
          console.log(`✅ [WebSocket] Jugador encontrado por ID directo`);
        }
        
        console.log(`🎯 [WebSocket] Jugador encontrado en lobby:`, !!player);
        console.log(`🎯 [WebSocket] Datos del jugador encontrado:`, player ? {
          id: player.id,
          name: player.name,
          score: player.score,
          isHost: player.isHost
        } : 'null');
        
        // ACTUALIZACIÓN SEGURA DEL SCORE
        console.log(`🎯 [WebSocket] === ACTUALIZANDO SCORE PARA JUGADOR VALIDADO ===`);
        console.log(`🎯 [WebSocket] Jugador: ${player.name} (ID: ${player.id})`);
        console.log(`🎯 [WebSocket] Posición en array: ${playerIndex}`);
        
        const oldScore = player.score || 0;
        const newScore = isCorrect ? (oldScore + 1) : oldScore;
        
        // Actualizar directamente en el array del lobby para mayor seguridad
        lobby.players[playerIndex].score = newScore;
        player.score = newScore; // También actualizar la referencia local
        
        console.log(`✅ [WebSocket] SCORE ACTUALIZADO EXITOSAMENTE`);
        console.log(`✅ [WebSocket] Jugador: ${player.name}`);
        console.log(`✅ [WebSocket] Score: ${oldScore} -> ${newScore}`);
        console.log(`✅ [WebSocket] Respuesta correcta: ${isCorrect}`);
        
        // VERIFICACIÓN POST-ACTUALIZACIÓN: Confirmar que el score se guardó correctamente
        const verificationPlayer = lobby.players[playerIndex];
        if (verificationPlayer.score !== newScore) {
          console.log(`❌ [WebSocket] ERROR: Score no se guardó correctamente!`);
          console.log(`❌ [WebSocket] Esperado: ${newScore}, Real: ${verificationPlayer.score}`);
        } else {
          console.log(`✅ [WebSocket] Verificación exitosa: Score guardado correctamente`);
        }
        
        // Log del estado actualizado del jugador
        console.log(`📊 [WebSocket] Estado final del jugador:`, {
          index: playerIndex,
          id: verificationPlayer.id,
          name: verificationPlayer.name,
          score: verificationPlayer.score,
          isHost: verificationPlayer.isHost
        });
        
        // Log del estado completo del lobby después de la actualización
        console.log(`📊 [WebSocket] === ESTADO COMPLETO DEL LOBBY DESPUÉS DE ACTUALIZACIÓN ===`);
        lobby.players.forEach((p, index) => {
          console.log(`📊 [WebSocket] Jugador ${index + 1} después:`, {
            id: p.id,
            name: p.name,
            score: p.score,
            isHost: p.isHost
          });
        });
        
        // Notificar a todos los demás jugadores
        console.log(`📡 [WebSocket] Enviando player-answered a otros jugadores...`);
        socket.to(lobbyKey).emit('player-answered', {
          playerId,
          playerName,
          questionIndex,
          isCorrect,
          newScore: player ? player.score : 0,
          timeLeft
        });
        
        // Actualizar lista de jugadores
        console.log(`📡 [WebSocket] Enviando players-updated...`);
        
        // VALIDACIÓN INTEGRAL ANTES DE ENVIAR ACTUALIZACIÓN
        console.log(`🔍 [WebSocket] === VALIDACIÓN INTEGRAL DEL LOBBY ===`);
        
        // 1. VERIFICAR INTEGRIDAD DE DATOS
        const validPlayers = [];
        for (let i = 0; i < lobby.players.length; i++) {
          const p = lobby.players[i];
          
          // Verificar que el jugador tiene datos válidos
          if (!p.id || !p.name || p.score === undefined || p.score === null) {
            console.log(`❌ [WebSocket] Jugador con datos inválidos detectado en índice ${i}:`, p);
            continue; // Saltar jugador inválido
          }
          
          // Asegurar que el score sea un número
          if (typeof p.score !== 'number' || isNaN(p.score)) {
            console.log(`⚠️ [WebSocket] Score inválido para ${p.name}: ${p.score}, corrigiendo a 0`);
            p.score = 0;
          }
          
          validPlayers.push(p);
        }
        
        // 2. VERIFICAR DUPLICADOS POR ID Y NOMBRE
        const playerIds = validPlayers.map(p => p.id);
        const playerNames = validPlayers.map(p => p.name);
        const uniqueIds = [...new Set(playerIds)];
        const uniqueNames = [...new Set(playerNames)];
        
        console.log(`🔍 [WebSocket] IDs de jugadores válidos:`, playerIds);
        console.log(`🔍 [WebSocket] Nombres de jugadores válidos:`, playerNames);
        
        const hasDuplicateIds = playerIds.length !== uniqueIds.length;
        const hasDuplicateNames = playerNames.length !== uniqueNames.length;
        console.log(`🔍 [WebSocket] ¿Hay duplicados por ID?:`, hasDuplicateIds);
        console.log(`🔍 [WebSocket] ¿Hay duplicados por NOMBRE?:`, hasDuplicateNames);
        
        // 3. LIMPIAR DUPLICADOS SI EXISTEN
        let finalPlayers = validPlayers;
        if (hasDuplicateIds || hasDuplicateNames) {
          console.log(`❌ [WebSocket] ¡DUPLICADOS DETECTADOS! Limpiando...`);
          
          const uniquePlayers = [];
          const seenIds = new Set();
          const seenNames = new Set();
          
          for (const player of validPlayers) {
            // Priorizar ID único, pero también verificar nombre único
            if (!seenIds.has(player.id) && !seenNames.has(player.name)) {
              seenIds.add(player.id);
              seenNames.add(player.name);
              uniquePlayers.push(player);
              console.log(`✅ [WebSocket] Manteniendo jugador único: ${player.name} (${player.id}) - Score: ${player.score}`);
            } else {
              console.log(`🗑️ [WebSocket] Eliminando duplicado: ${player.name} (${player.id}) - Score: ${player.score}`);
            }
          }
          
          finalPlayers = uniquePlayers;
          lobby.players = finalPlayers;
        }
        
        // 4. LOG FINAL DEL ESTADO DEL LOBBY
        console.log(`📋 [WebSocket] === ESTADO FINAL DEL LOBBY ANTES DE ENVÍO ===`);
        finalPlayers.forEach((p, idx) => {
          console.log(`📊 [WebSocket] Jugador ${idx + 1}: ${p.name} (ID: ${p.id}) - Score: ${p.score} - Host: ${p.isHost}`);
        });

        // ENVÍO SEGURO CON DATOS VALIDADOS
        const playersToSend = lobby.players.map(p => ({
          id: p.id,
          name: p.name,
          score: Number(p.score) || 0, // Asegurar que sea número
          isHost: Boolean(p.isHost),
          socketId: p.socketId // Para depuración
        }));

        console.log(`📡 [WebSocket] === ENVIANDO PLAYERS-UPDATED ===`);
        console.log(`📡 [WebSocket] Cantidad de jugadores: ${playersToSend.length}`);
        console.log(`📡 [WebSocket] Datos a enviar:`, playersToSend);

        io.to(lobbyKey).emit('players-updated', {
          players: playersToSend,
          timestamp: Date.now(), // Para depuración
          triggerBy: 'player-answer' // Para identificar la fuente del evento
        });

        console.log(`🎯 [WebSocket] === FIN RESPUESTA DE JUGADOR ===`);
    } else {
      console.log(`❌ [WebSocket] Lobby ${lobbyKey} no encontrado`);
    }
  });

  // Comando del host para mostrar tabla de clasificación
  socket.on('show-leaderboard-command', (data) => {
    const { gameId, lobbyCode, questionIndex, leaderboard } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;

    console.log(`📊 [WebSocket] Host solicitó mostrar leaderboard en ${lobbyKey}`);

    io.to(lobbyKey).emit('show-leaderboard', {
      questionIndex,
      leaderboard
    });
  });

  // Comando del host para siguiente pregunta
  socket.on('next-question-command', (data) => {
    const { gameId, lobbyCode, questionIndex } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;

    console.log(`⏭️ [WebSocket] Host avanza a pregunta ${questionIndex + 1} en ${lobbyKey}`);

    const lobby = gameLobbies.get(lobbyKey);

    // Incluir configuraciones del lobby en el next-question
    const eventData = {
      questionIndex
    };

    if (lobby && lobby.gameSettings) {
      eventData.gameSettings = lobby.gameSettings;
      console.log(`⏭️ [WebSocket] Enviando configuraciones con next-question:`, lobby.gameSettings);
    }

    io.to(lobbyKey).emit('next-question', eventData);
  });

  // Comando del host para finalizar juego
  socket.on('end-game', (data) => {
    const { gameId, lobbyCode, finalLeaderboard } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🏁 [WebSocket] Host finalizó juego en ${lobbyKey}`);
    
    io.to(lobbyKey).emit('game-ended', {
      finalLeaderboard
    });
    
    // Opcional: limpiar el lobby después de un tiempo
    setTimeout(() => {
      gameLobbies.delete(lobbyKey);
      gameTransitions.delete(lobbyKey); // También limpiar transiciones
      console.log(`🧹 [WebSocket] Lobby y transición ${lobbyKey} limpiados después del juego`);
    }, 30000); // 30 segundos
  });

  // Tiempo agotado (enviado por el host)
  socket.on('time-up', (data) => {
    const { gameId, lobbyCode, questionIndex, leaderboard } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`⏰ [WebSocket] Tiempo agotado en pregunta ${questionIndex + 1} - ${lobbyKey}`);
    
    io.to(lobbyKey).emit('show-leaderboard', {
      questionIndex,
      leaderboard
    });
  });

  // Unirse a una sesión de juego existente
  // === NUEVO SISTEMA SIMPLIFICADO ===
  socket.on('join-game-session', (data) => {
    const { gameId, lobbyCode, playerName, playerId, isHost } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🎮 [Simple] === JOIN GAME SESSION ===`);
    console.log(`🎮 [Simple] Jugador: ${playerName} (${playerId})`);
    console.log(`🎮 [Simple] Es Host: ${isHost}`);
    console.log(`🎮 [Simple] LobbyKey: ${lobbyKey}`);
    
    socket.join(lobbyKey);
    
    // Inicializar sesión si no existe
    if (!activeGameSessions.has(lobbyKey)) {
      console.log(`🎮 [Simple] Creando nueva sesión: ${lobbyKey}`);
      
      // Buscar jugadores guardados en la transición
      const transition = gameTransitions.get(lobbyKey);
      if (transition) {
        console.log(`🔄 [Simple] Usando jugadores de transición: ${transition.originalPlayers.length}`);
        initializeGameSession(lobbyKey, transition.originalPlayers);
      } else {
        console.log(`🆕 [Simple] Nueva sesión sin transición`);
        activeGameSessions.set(lobbyKey, { players: new Map() });
      }
    }
    
    // Agregar o actualizar jugador
    addOrUpdatePlayer(lobbyKey, {
      id: playerId,
      name: playerName,
      isHost: isHost || false,
      socketId: socket.id
    });
    
    // Obtener lista actualizada y enviar a todos
    const players = getPlayersArray(lobbyKey);
    
    console.log(`� [Simple] Enviando lista actualizada: ${players.length} jugadores`);
    io.to(lobbyKey).emit('players-updated', {
      players: players
    });
    
    // Enviar configuraciones del juego
    const transition = gameTransitions.get(lobbyKey);
    const gameSettings = transition?.gameSettings || {
      maxPlayers: 6,
      timePerQuestion: 30,
      showCorrectAnswers: true
    };
    
    console.log(`🔥 [Simple] Enviando configuraciones a ${playerName}`);
    socket.emit('game-settings', { settings: gameSettings });
    
    console.log(`🎮 [Simple] === FIN JOIN GAME SESSION ===`);
  });

  // Solicitar lista actualizada de jugadores
  socket.on('request-players-list', (data) => {
    const { gameId, lobbyCode } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`📋 [WebSocket] === SOLICITUD LISTA DE JUGADORES ===`);
    console.log(`📋 [WebSocket] LobbyKey: ${lobbyKey}`);
    console.log(`📋 [WebSocket] Socket ID: ${socket.id}`);
    
    const lobby = gameLobbies.get(lobbyKey);
    if (lobby) {
      console.log(`📋 [WebSocket] Lobby encontrado con ${lobby.players.length} jugadores`);
      console.log(`📋 [WebSocket] Lista de jugadores:`, lobby.players);
      
      // Enviar lista actualizada al cliente que la solicitó
      socket.emit('players-updated', {
        players: lobby.players
      });
      
      console.log(`📋 [WebSocket] Lista enviada al solicitante`);
    } else {
      console.log(`❌ [WebSocket] Lobby ${lobbyKey} no encontrado`);
      
      // Enviar lista vacía
      socket.emit('players-updated', {
        players: []
      });
    }
  });

  // Actualizar configuraciones del juego
  socket.on('update-game-settings', (data) => {
    const { lobbyKey, settings } = data;
    console.log(`🚀 [WebSocket] === ACTUALIZAR CONFIGURACIONES DEL LOBBY ===`);
    console.log(`🚀 [WebSocket] Socket ID que actualiza:`, socket.id);
    console.log(`🚀 [WebSocket] LobbyKey:`, lobbyKey);
    console.log(`🚀 [WebSocket] Configuraciones nuevas:`, settings);
    console.log(`🚀 [WebSocket] - maxPlayers:`, settings.maxPlayers);
    console.log(`🚀 [WebSocket] - timePerQuestion:`, settings.timePerQuestion);
    console.log(`🚀 [WebSocket] - showCorrectAnswers:`, settings.showCorrectAnswers);
    
    const lobby = gameLobbies.get(lobbyKey);
    
    if (lobby) {
      console.log(`🚀 [WebSocket] Lobby encontrado. Jugadores conectados: ${lobby.players.length}`);
      lobby.gameSettings = settings;
      lobby.maxPlayers = settings.maxPlayers; // Actualizar también maxPlayers del lobby
      console.log(`🚀 [WebSocket] ✅ Configuraciones guardadas en lobby`);
      
      // Notificar a todos los jugadores sobre las nuevas configuraciones
      console.log(`🚀 [WebSocket] 📡 Enviando 'settings-updated' a todos en room: ${lobbyKey}`);
      io.to(lobbyKey).emit('settings-updated', {
        settings: settings
      });
      
      console.log(`� [WebSocket] ✅ Evento 'settings-updated' enviado a todos los clientes`);
    } else {
      console.log(`🚀 [WebSocket] ❌ Lobby ${lobbyKey} no encontrado para actualizar configuraciones`);
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('--- Usuario desconectado:', socket.id, '---');
    
    // Remover el jugador de todos los lobbies
    gameLobbies.forEach((lobby, lobbyKey) => {
      const playerIndex = lobby.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const removedPlayer = lobby.players.splice(playerIndex, 1)[0];
        console.log(`--- Jugador ${removedPlayer.username} removido del lobby ${lobbyKey} ---`);
        
        // Si era el host y hay otros jugadores, asignar nuevo host
        if (removedPlayer.isHost && lobby.players.length > 0) {
          lobby.players[0].isHost = true;
        }
        
        // Notificar actualización del lobby
        io.to(lobbyKey).emit('lobby-updated', {
          players: lobby.players,
          gameStarted: lobby.gameStarted
        });
        
        // Si no quedan jugadores, eliminar el lobby
        if (lobby.players.length === 0) {
          gameLobbies.delete(lobbyKey);
          console.log(`--- Lobby ${lobbyKey} eliminado ---`);
        }
      }
    });
  });
});

// Servir archivos estáticos del frontend (si aplica)
app.use(express.static(path.join(__dirname, '../public')));

// Redirección para SPA: cualquier ruta que no sea API devuelve index.html
app.get(/^\/((?!api).)*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

const PORT = process.env.PORT || 5003;

const startServer = async () => {
  try {
    console.log('--- Attempting to connect to database... ---');
    const connection = await pool.getConnection();
    console.log('--- Database connection successful! ---');
    connection.release();

    server.listen(PORT, () => {
      console.log(`--- Server running on port ${PORT} ---`);
      console.log(`--- WebSocket server ready for multiplayer lobbies ---`);
    });
  } catch (error) {
    console.error('--- FATAL: Failed to connect to the database. Server not started. ---');
    console.error(error);
    process.exit(1);
  }
};

startServer();

// Revisión final para asegurar que todos los bloques estén correctamente cerrados y los caracteres especiales sean válidos.
// No se realizaron cambios significativos en la lógica del código, solo ajustes menores para evitar errores de sintaxis.