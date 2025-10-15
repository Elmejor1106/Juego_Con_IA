console.log('--- Loading NEW SIMPLIFIED server.js ---');
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
const gameLobbies = new Map(); // Para mantener compatibilidad con lobby
const gameTransitions = new Map(); // Para guardar jugadores durante la transición
const activeGameSessions = new Map(); // Sistema simplificado: lobbyKey -> { players: Map(playerId -> playerData) }
const transitionCleanupTimers = new Map(); // Timers para limpiar transiciones
const processedAnswers = new Map(); // Para evitar respuestas duplicadas y guardar respuestas: `${lobbyKey}-${playerId}-${questionIndex}` -> { playerId, answer, isCorrect }

// === FUNCIONES SIMPLIFICADAS ===
function initializeGameSession(lobbyKey, playersFromLobby) {
  console.log(`👤 [NOMBRES] *** INICIALIZANDO SESIÓN DESDE TRANSICIÓN ***`);
  console.log(`🎮 [Simple] Inicializando sesión: ${lobbyKey} con ${playersFromLobby.length} jugadores`);
  
  const playersMap = new Map();
  
  playersFromLobby.forEach((player, index) => {
    console.log(`👤 [NOMBRES] Procesando jugador ${index} desde transición:`);
    console.log(`👤 [NOMBRES]   ID: ${player.id}`);
    console.log(`👤 [NOMBRES]   name: ${player.name}`);
    console.log(`👤 [NOMBRES]   username: ${player.username}`);
    console.log(`👤 [NOMBRES]   isHost: ${player.isHost}`);
    
    const playerData = {
      id: player.id,
      name: player.name || player.username, // Priorizar 'name' sobre 'username'
      score: 0,
      isHost: player.isHost || false,
      socketId: player.socketId || null
    };
    
    console.log(`👤 [NOMBRES]   → Inicializado como: ${playerData.name}`);
    
    playersMap.set(player.id, playerData);
    console.log(`🎮 [Simple] Jugador: ${playerData.name} (${playerData.id}) - Score inicial: 0`);
  });
  
  activeGameSessions.set(lobbyKey, { players: playersMap });
  console.log(`✅ [Simple] Sesión creada exitosamente`);
}

function updatePlayerScore(lobbyKey, playerId, isCorrect) {
  console.log(`📊 [Simple] Actualizando score: ${playerId} - Correcta: ${isCorrect}`);
  
  const session = activeGameSessions.get(lobbyKey);
  if (!session) {
    console.log(`❌ [Simple] Sesión no existe: ${lobbyKey}`);
    return false;
  }
  
  const player = session.players.get(playerId);
  if (!player) {
    console.log(`❌ [Simple] Jugador no existe: ${playerId}`);
    console.log(`❌ [Simple] IDs disponibles:`, Array.from(session.players.keys()));
    return false;
  }
  
  const oldScore = player.score;
  if (isCorrect) {
    player.score += 1;
  }
  
  console.log(`✅ [Simple] ${player.name}: ${oldScore} → ${player.score}`);
  return true;
}

function getPlayersArray(lobbyKey) {
  console.log(`👤 [NOMBRES] *** OBTENIENDO ARRAY DE JUGADORES ***`);
  console.log(`👤 [NOMBRES] LobbyKey: ${lobbyKey}`);
  
  const session = activeGameSessions.get(lobbyKey);
  if (!session) {
    console.log(`❌ [Simple] Sesión no existe para getPlayersArray: ${lobbyKey}`);
    return [];
  }
  
  const playersArray = Array.from(session.players.values());
  console.log(`👤 [NOMBRES] Jugadores en sesión (${playersArray.length}):`);
  playersArray.forEach((player, index) => {
    console.log(`👤 [NOMBRES]   ${index}: ID=${player.id}, Name="${player.name}", Score=${player.score}, isHost=${player.isHost}`);
  });
  
  return playersArray;
}

function addOrUpdatePlayer(lobbyKey, playerData) {
  console.log(`👤 [NOMBRES] *** ENTRANDO A addOrUpdatePlayer ***`);
  console.log(`👤 [NOMBRES] LobbyKey: ${lobbyKey}`);
  console.log(`👤 [NOMBRES] PlayerData recibido:`, JSON.stringify(playerData, null, 2));
  
  let session = activeGameSessions.get(lobbyKey);
  if (!session) {
    console.log(`👤 [NOMBRES] Creando nueva sesión para ${lobbyKey}`);
    session = { players: new Map() };
    activeGameSessions.set(lobbyKey, session);
  } else {
    console.log(`👤 [NOMBRES] Sesión existente para ${lobbyKey}, jugadores actuales:`);
    Array.from(session.players.values()).forEach((p, i) => {
      console.log(`👤 [NOMBRES]   ${i}: ID=${p.id}, Name=${p.name}, Score=${p.score}`);
    });
  }
  
  const existingPlayer = session.players.get(playerData.id);
  if (existingPlayer) {
    console.log(`👤 [NOMBRES] *** JUGADOR EXISTENTE ENCONTRADO ***`);
    console.log(`👤 [NOMBRES] Jugador existente: ID=${existingPlayer.id}, Name=${existingPlayer.name}`);
    console.log(`👤 [NOMBRES] Datos nuevos: Name=${playerData.name}`);
    
    // MANTENER EL NOMBRE ORIGINAL del lobby - NO permitir cambios de nombre
    console.log(`👤 [NOMBRES] *** MANTENIENDO NOMBRE ORIGINAL DEL LOBBY ***`);
    console.log(`👤 [NOMBRES] Nombre actual: ${existingPlayer.name}`);
    console.log(`👤 [NOMBRES] Nombre solicitado: ${playerData.name}`);
    console.log(`👤 [NOMBRES] → Manteniendo: ${existingPlayer.name}`);
    
    // Solo actualizar socketId e isHost, MANTENER name y score
    existingPlayer.socketId = playerData.socketId || existingPlayer.socketId;
    existingPlayer.isHost = playerData.isHost !== undefined ? playerData.isHost : existingPlayer.isHost;
    // NO cambiar: existingPlayer.name - mantener el nombre original del lobby
    
    console.log(`👤 [NOMBRES] Jugador actualizado: Name=${existingPlayer.name} (MANTENIDO), Score=${existingPlayer.score}`);
    console.log(`🔄 [Simple] Player actualizado: ${existingPlayer.name} (ID: ${existingPlayer.id}) (Score: ${existingPlayer.score})`);
  } else {
    console.log(`👤 [NOMBRES] *** NUEVO JUGADOR - VERIFICANDO NOMBRES DUPLICADOS ***`);
    
    // Verificar nombres duplicados y generar nombre único si es necesario
    let finalName = playerData.name;
    const existingNames = Array.from(session.players.values()).map(p => p.name);
    let counter = 1;
    
    console.log(`👤 [NOMBRES] Nombre solicitado: ${finalName}`);
    console.log(`👤 [NOMBRES] Nombres ya existentes:`, existingNames);
    
    // NOTA: Si este while se ejecuta, significa que hay un problema en el flujo
    // porque cada jugador debería tener un ID único y no debería crear duplicados
    while (existingNames.includes(finalName)) {
      finalName = `${playerData.name}_${counter}`;
      counter++;
      console.log(`👤 [NOMBRES] ⚠️  CONFLICTO DE NOMBRES - probando: ${finalName}`);
      console.log(`👤 [NOMBRES] ⚠️  ESTO NO DEBERÍA PASAR - revisar flujo de IDs`);
    }
    
    if (finalName !== playerData.name) {
      console.log(`👤 [NOMBRES] *** PROBLEMA: NOMBRE DUPLICADO PARA NUEVO JUGADOR ***`);
      console.log(`👤 [NOMBRES] *** ESTO INDICA UN ERROR EN EL SISTEMA DE IDs ***`);
      console.log(`� [Simple] CONFLICTO: ${playerData.name} → ${finalName}`);
    } else {
      console.log(`👤 [NOMBRES] ✅ Nombre único confirmado: ${finalName}`);
    }
    
    // Nuevo jugador
    const newPlayer = {
      id: playerData.id,
      name: finalName,
      score: 0,
      isHost: playerData.isHost || false,
      socketId: playerData.socketId || null
    };
    
    console.log(`👤 [NOMBRES] *** CREANDO NUEVO JUGADOR ***`);
    console.log(`👤 [NOMBRES] Nuevo jugador creado:`, JSON.stringify(newPlayer, null, 2));
    
    session.players.set(playerData.id, newPlayer);
    console.log(`➕ [Simple] Nuevo player: ${newPlayer.name} (ID: ${newPlayer.id}) (Score: 0)`);
  }
}

// === FUNCIÓN PARA LIMPIAR TRANSICIONES CON RETRASO ===
function scheduleTransitionCleanup(lobbyKey) {
  console.log(`⏰ [CONFIGURACIÓN] Programando limpieza de transición para ${lobbyKey} en 2 minutos`);
  
  // Cancelar timer anterior si existe
  if (transitionCleanupTimers.has(lobbyKey)) {
    clearTimeout(transitionCleanupTimers.get(lobbyKey));
    console.log(`⏰ [CONFIGURACIÓN] Timer anterior cancelado para ${lobbyKey}`);
  }
  
  // Programar nueva limpieza
  const timer = setTimeout(() => {
    if (gameTransitions.has(lobbyKey)) {
      console.log(`🧹 [CONFIGURACIÓN] *** LIMPIEZA PROGRAMADA EJECUTÁNDOSE ***`);
      console.log(`🧹 [CONFIGURACIÓN] Eliminando transición para: ${lobbyKey}`);
      console.log(`🧹 [CONFIGURACIÓN] Configuraciones que se eliminan:`, gameTransitions.get(lobbyKey)?.gameSettings);
      
      gameTransitions.delete(lobbyKey);
      transitionCleanupTimers.delete(lobbyKey);
      
      console.log(`🧹 [CONFIGURACIÓN] Keys restantes en gameTransitions:`, Array.from(gameTransitions.keys()));
      console.log(`🧹 [CONFIGURACIÓN] Transición ${lobbyKey} limpiada por timeout`);
    }
  }, 120000); // 2 minutos
  
  transitionCleanupTimers.set(lobbyKey, timer);
}

// === FUNCIONES PARA ESTADÍSTICAS DE RESPUESTAS ===
function calculateAnswerStatistics(lobbyKey, questionIndex) {
  console.log(`📊 [CALC-STATS] Calculando estadísticas para ${lobbyKey} - Q${questionIndex}`);
  
  const session = activeGameSessions.get(lobbyKey);
  if (!session) {
    console.log(`❌ [CALC-STATS] Sesión no encontrada: ${lobbyKey}`);
    return [
      { answerIndex: 0, count: 0, percentage: 0 },
      { answerIndex: 1, count: 0, percentage: 0 },
      { answerIndex: 2, count: 0, percentage: 0 },
      { answerIndex: 3, count: 0, percentage: 0 }
    ];
  }

  const players = Array.from(session.players.values());
  const totalPlayers = players.length;
  
  console.log(`📊 [CALC-STATS] Total jugadores: ${totalPlayers}`);
  
  // Buscar respuestas reales para esta pregunta
  const questionAnswers = [];
  for (const [key, answerData] of processedAnswers.entries()) {
    // Formato de key: `${lobbyKey}-${playerId}-${questionIndex}`
    if (key.startsWith(`${lobbyKey}-`) && key.endsWith(`-${questionIndex}`)) {
      questionAnswers.push(answerData);
    }
  }
  
  console.log(`📊 [CALC-STATS] Respuestas encontradas: ${questionAnswers.length}`);
  console.log(`📊 [CALC-STATS] Respuestas:`, questionAnswers.map(a => `${a.playerName}: ${a.answer} (${a.isCorrect ? 'Correcta' : 'Incorrecta'})`));
  
  // Contar respuestas por índice (asumiendo 4 opciones: 0, 1, 2, 3)
  const answerCounts = [0, 0, 0, 0];
  
  questionAnswers.forEach(answerData => {
    const answerIndex = parseInt(answerData.answer);
    if (answerIndex >= 0 && answerIndex <= 3) {
      answerCounts[answerIndex]++;
    }
  });
  
  // Calcular porcentajes
  const answerStats = answerCounts.map((count, index) => {
    const percentage = totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0;
    return { answerIndex: index, count, percentage };
  });

  console.log(`📊 [CALC-STATS] Estadísticas generadas:`, answerStats);
  return answerStats;
}

async function getCorrectAnswerIndex(gameId, questionIndex) {
  console.log(`🎯 [CORRECT-ANSWER] Obteniendo respuesta correcta para game ${gameId} - Q${questionIndex}`);
  
  try {
    // Obtener la pregunta de la base de datos
    const [questionRows] = await pool.query(`
      SELECT q.id, q.question_text,
             a.answer_text, a.is_correct
      FROM game_questions q
      LEFT JOIN game_answers a ON q.id = a.question_id
      WHERE q.game_id = ?
      ORDER BY q.id, a.id
    `, [gameId]);

    if (questionRows.length === 0) {
      console.log(`❌ [CORRECT-ANSWER] No se encontraron preguntas para el juego ${gameId}`);
      return 0; // Retorna 0 por defecto
    }

    // Agrupar respuestas por pregunta
    const questions = {};
    questionRows.forEach(row => {
      if (!questions[row.id]) {
        questions[row.id] = {
          id: row.id,
          question_text: row.question_text,
          answers: []
        };
      }
      if (row.answer_text) {
        questions[row.id].answers.push({
          text: row.answer_text,
          is_correct: row.is_correct
        });
      }
    });

    // Convertir a array y ordenar por ID
    const questionsArray = Object.values(questions).sort((a, b) => a.id - b.id);
    
    if (questionIndex >= questionsArray.length) {
      console.log(`❌ [CORRECT-ANSWER] Índice de pregunta ${questionIndex} fuera de rango`);
      return 0;
    }

    const currentQuestion = questionsArray[questionIndex];
    const correctAnswerIndex = currentQuestion.answers.findIndex(answer => answer.is_correct === 1);
    
    if (correctAnswerIndex === -1) {
      console.log(`❌ [CORRECT-ANSWER] No se encontró respuesta correcta para Q${questionIndex}`);
      return 0;
    }

    console.log(`🎯 [CORRECT-ANSWER] Respuesta correcta para Q${questionIndex}: índice ${correctAnswerIndex}`);
    console.log(`🎯 [CORRECT-ANSWER] Respuesta: "${currentQuestion.answers[correctAnswerIndex].text}"`);
    return correctAnswerIndex;

  } catch (error) {
    console.error(`❌ [CORRECT-ANSWER] Error al obtener respuesta correcta:`, error);
    return 0; // Retorna 0 por defecto en caso de error
  }
}

// Configuración de middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use(cors({
  origin: ["http://localhost:3001", "http://localhost:3002", "http://localhost:3005"],
  credentials: true
}));

// Logging de todas las requests
app.use((req, res, next) => {
  console.log(`--- Incoming Request: ${req.method} ${req.path} ---`);
  next();
});

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/rankings', require('./routes/rankings'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/images', imagesRoutes);

// === EVENTOS DE SOCKET SIMPLIFICADOS ===
io.on('connection', (socket) => {
  console.log(`🔗 --- Usuario conectado: ${socket.id} ---`);
  console.log(`🌐 Origin: ${socket.handshake.headers.origin}`);

  // LOBBY MANAGEMENT (Mantener compatibilidad)
  socket.on('join-lobby', (data) => {
    const { gameId, lobbyCode, playerName, playerId } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🎮 [Lobby] Join: ${playerName} (${playerId})`);
    
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
      console.log(`🆕 Lobby creado: ${lobbyKey}`);
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
    
    console.log(`👤 [NOMBRES] *** JUGADOR AGREGADO AL LOBBY ***`);
    console.log(`👤 [NOMBRES] Player ID: ${newPlayer.id}`);
    console.log(`👤 [NOMBRES] Username en lobby: ${newPlayer.username}`);
    console.log(`👤 [NOMBRES] Socket ID: ${newPlayer.socketId}`);
    console.log(`👤 [NOMBRES] Es Host: ${newPlayer.isHost}`);
    console.log(`✅ Player agregado: ${playerName} (Total: ${lobby.players.length})`);
    console.log(`🔗 Player ${playerName} unido al room: ${lobbyKey} con socketId: ${socket.id}`);      io.to(lobbyKey).emit('lobby-updated', {
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
      console.log(`🔄 Player reconectado: ${playerName}`);
      console.log(`🔗 Player ${playerName} reconectado al room: ${lobbyKey} con socketId: ${socket.id}`);
      
      socket.emit('join-success', { 
        lobbyKey,
        playerId: existingPlayer.id,
        isHost: existingPlayer.isHost
      });
      
      io.to(lobbyKey).emit('lobby-updated', {
        players: lobby.players,
        gameStarted: lobby.gameStarted
      });
    } else {
      console.log(`❌ Lobby lleno: ${lobbyKey}`);
      socket.emit('join-error', { message: 'Lobby lleno' });
    }
  });

  // START GAME
  socket.on('start-game', (data) => {
    const { gameId, lobbyCode, gameSettings } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🚀 [CONFIGURACIÓN] ================================`);
    console.log(`🚀 [CONFIGURACIÓN] INICIANDO JUEGO: ${lobbyKey}`);
    console.log(`🚀 [CONFIGURACIÓN] GameId:`, gameId);
    console.log(`🚀 [CONFIGURACIÓN] LobbyCode:`, lobbyCode);
    console.log(`🚀 [CONFIGURACIÓN] *** CONFIGURACIONES RECIBIDAS DEL FRONTEND ***`);
    console.log(`🚀 [CONFIGURACIÓN] gameSettings:`, JSON.stringify(gameSettings, null, 2));
    console.log(`🚀 [CONFIGURACIÓN] maxPlayers:`, gameSettings?.maxPlayers);
    console.log(`🚀 [CONFIGURACIÓN] timePerQuestion:`, gameSettings?.timePerQuestion);
    console.log(`🚀 [CONFIGURACIÓN] showCorrectAnswers:`, gameSettings?.showCorrectAnswers);
    
    const lobby = gameLobbies.get(lobbyKey);
    if (lobby) {
      lobby.gameStarted = true;
      lobby.gameSettings = gameSettings || {
        maxPlayers: 6,
        timePerQuestion: 30,
        showCorrectAnswers: true
      };
      
      // Guardar jugadores para la transición
      console.log(`👤 [NOMBRES] *** MAPEANDO JUGADORES PARA TRANSICIÓN ***`);
      const playersForTransition = lobby.players.map((p, index) => {
        console.log(`👤 [NOMBRES] Jugador ${index}:`);
        console.log(`👤 [NOMBRES]   ID original: ${p.id}`);
        console.log(`👤 [NOMBRES]   Username original: ${p.username}`);
        console.log(`👤 [NOMBRES]   Socket ID: ${p.socketId}`);
        console.log(`👤 [NOMBRES]   Es Host: ${p.isHost}`);
        
        const mappedPlayer = {
          id: p.id,
          name: p.username, // Usar username del lobby
          score: 0,
          isHost: p.isHost,
          socketId: p.socketId
        };
        
        console.log(`👤 [NOMBRES]   → Mapeado como name: ${mappedPlayer.name}`);
        return mappedPlayer;
      });
      
      gameTransitions.set(lobbyKey, {
        originalPlayers: playersForTransition,
        gameSettings: lobby.gameSettings
      });
      
      console.log(`💾 [CONFIGURACIÓN] *** GUARDANDO TRANSICIÓN ***`);
      console.log(`💾 [CONFIGURACIÓN] LobbyKey para transición:`, lobbyKey);
      console.log(`💾 [CONFIGURACIÓN] Configuraciones guardadas:`, JSON.stringify(lobby.gameSettings, null, 2));
      console.log(`💾 [CONFIGURACIÓN] Jugadores guardados: ${playersForTransition.length}`);
      console.log(`💾 [CONFIGURACIÓN] *** VERIFICACIÓN DE gameTransitions MAP ***`);
      console.log(`💾 [CONFIGURACIÓN] Keys en gameTransitions:`, Array.from(gameTransitions.keys()));
      console.log(`💾 [CONFIGURACIÓN] gameTransitions completo:`, Object.fromEntries(gameTransitions));
      console.log(`📊 Lista de jugadores para transición:`, playersForTransition);
      
      console.log(`📡 [Game] Enviando game-started a todos los jugadores en lobby: ${lobbyKey}`);
      console.log(`📡 [Game] Jugadores que deberían recibir el evento:`, lobby.players.map(p => `${p.username} (${p.socketId})`));
      
      io.to(lobbyKey).emit('game-started', {
        gameId: gameId,
        lobbyCode: lobbyCode,
        players: lobby.players,
        gameSettings: lobby.gameSettings
      });
      
      console.log(`✅ [Game] Evento game-started enviado exitosamente`);
    } else {
      console.log(`❌ [Game] Lobby no encontrado: ${lobbyKey}`);
    }
  });

  // === SISTEMA SIMPLIFICADO DE JUEGO ===
  socket.on('join-game-session', (data) => {
    const { gameId, lobbyCode, playerName, playerId, isHost } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🎮 [CONFIGURACIÓN] ================================`);
    console.log(`🎮 [CONFIGURACIÓN] JOIN GAME SESSION:`);
    console.log(`👤 [NOMBRES] *** DATOS RECIBIDOS DEL FRONTEND ***`);
    console.log(`👤 [NOMBRES] Data completa:`, JSON.stringify(data, null, 2));
    console.log(`🎮 [CONFIGURACIÓN] GameId:`, gameId);
    console.log(`🎮 [CONFIGURACIÓN] LobbyCode:`, lobbyCode);
    console.log(`🎮 [CONFIGURACIÓN] LobbyKey construido:`, lobbyKey);
    console.log(`🎮 [CONFIGURACIÓN] PlayerName:`, playerName);
    console.log(`🎮 [CONFIGURACIÓN] PlayerId:`, playerId);
    console.log(`🎮 [CONFIGURACIÓN] IsHost:`, isHost);
    console.log(`🎮 [CONFIGURACIÓN] *** VERIFICANDO TRANSICIONES DISPONIBLES ***`);
    console.log(`🎮 [CONFIGURACIÓN] Keys disponibles en gameTransitions:`, Array.from(gameTransitions.keys()));
    console.log(`🎮 [CONFIGURACIÓN] ¿Existe transición para ${lobbyKey}?:`, gameTransitions.has(lobbyKey));
    
    socket.join(lobbyKey);
    
    // Inicializar sesión si no existe
    if (!activeGameSessions.has(lobbyKey)) {
      const transition = gameTransitions.get(lobbyKey);
      if (transition) {
        initializeGameSession(lobbyKey, transition.originalPlayers);
      } else {
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
    
    // ⏰ [CONFIGURACIÓN] Cancelar timer de limpieza si alguien se une exitosamente
    if (transitionCleanupTimers.has(lobbyKey)) {
      clearTimeout(transitionCleanupTimers.get(lobbyKey));
      transitionCleanupTimers.delete(lobbyKey);
      console.log(`⏰ [CONFIGURACIÓN] Timer de limpieza cancelado para ${lobbyKey} - jugador se unió exitosamente`);
    }
    
    // Enviar lista actualizada
    const players = getPlayersArray(lobbyKey);
    io.to(lobbyKey).emit('players-updated', { players });
    
    // Enviar configuraciones CORRECTAS desde la transición
    console.log(`⚙️ [CONFIGURACIÓN] *** BUSCANDO CONFIGURACIONES PARA ENVIAR ***`);
    const transition = gameTransitions.get(lobbyKey);
    console.log(`⚙️ [CONFIGURACIÓN] Transición encontrada:`, !!transition);
    
    if (transition) {
      console.log(`⚙️ [CONFIGURACIÓN] Transición completa:`, JSON.stringify(transition, null, 2));
      console.log(`⚙️ [CONFIGURACIÓN] gameSettings en transición:`, !!transition.gameSettings);
      
      if (transition.gameSettings) {
        console.log(`⚙️ [CONFIGURACIÓN] ✅ *** CONFIGURACIONES ENCONTRADAS EN TRANSICIÓN ***`);
        console.log(`⚙️ [CONFIGURACIÓN] Configuraciones:`, JSON.stringify(transition.gameSettings, null, 2));
        console.log(`⚙️ [CONFIGURACIÓN] timePerQuestion:`, transition.gameSettings.timePerQuestion);
        console.log(`⚙️ [CONFIGURACIÓN] showCorrectAnswers:`, transition.gameSettings.showCorrectAnswers);
        console.log(`⚙️ [CONFIGURACIÓN] maxPlayers:`, transition.gameSettings.maxPlayers);
        console.log(`⚙️ [CONFIGURACIÓN] Enviando a ${playerName}`);
        
        socket.emit('game-settings', { settings: transition.gameSettings });
        io.to(lobbyKey).emit('game-settings', { settings: transition.gameSettings });
        
        console.log(`⚙️ [CONFIGURACIÓN] ✅ EVENTO game-settings ENVIADO CON CONFIGURACIONES CORRECTAS`);
        
        // ⏰ [CONFIGURACIÓN] Programar limpieza después de 2 minutos (tiempo suficiente para que todos se unan)
        if (!transitionCleanupTimers.has(lobbyKey)) {
          scheduleTransitionCleanup(lobbyKey);
        }
      } else {
        console.log(`⚠️ [CONFIGURACIÓN] Transición existe pero NO tiene gameSettings`);
      }
    } else {
      console.log(`❌ [CONFIGURACIÓN] *** NO HAY TRANSICIÓN PARA ${lobbyKey} ***`);
      console.log(`❌ [CONFIGURACIÓN] Keys disponibles:`, Array.from(gameTransitions.keys()));
      
      // Solo usar configuraciones por defecto si no hay transición
      const defaultSettings = {
        maxPlayers: 6,
        timePerQuestion: 30,
        showCorrectAnswers: true
      };
      console.log(`⚠️ [CONFIGURACIÓN] Usando configuraciones DEFAULT:`, JSON.stringify(defaultSettings, null, 2));
      socket.emit('game-settings', { settings: defaultSettings });
      io.to(lobbyKey).emit('game-settings', { settings: defaultSettings });
      console.log(`⚙️ [CONFIGURACIÓN] ✅ EVENTO game-settings ENVIADO CON CONFIGURACIONES DEFAULT`);
    }
  });

  // === SISTEMA SIMPLIFICADO DE RESPUESTAS ===
  socket.on('player-answer', (data) => {
    const { gameId, lobbyCode, playerId, playerName, questionIndex, answer, isCorrect, timeLeft } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    // 🚨 VALIDAR RESPUESTA DUPLICADA
    const answerKey = `${lobbyKey}-${playerId}-${questionIndex}`;
    if (processedAnswers.has(answerKey)) {
      console.log(`🔄 [DUPLICATE] Respuesta duplicada ignorada: ${playerName} - Q${questionIndex}`);
      console.log(`🔄 [DUPLICATE] Key: ${answerKey} ya existe`);
      return;
    }
    
    // Marcar respuesta como procesada y guardar datos
    processedAnswers.set(answerKey, { playerId, playerName, answer, isCorrect });
    console.log(`🎯 [Simple] Respuesta: ${playerName} - Q${questionIndex} - Correcta: ${isCorrect}`);
    console.log(`🔒 [DUPLICATE] Marcada como procesada: ${answerKey}`);
    
    // Actualizar score
    const updated = updatePlayerScore(lobbyKey, playerId, isCorrect);
    if (!updated) {
      console.log(`❌ [Simple] No se pudo actualizar score`);
      return;
    }
    
    // Obtener lista actualizada
    const players = getPlayersArray(lobbyKey);
    
    // Notificar a otros
    socket.to(lobbyKey).emit('player-answered', {
      playerId,
      playerName,
      questionIndex,
      isCorrect,
      timeLeft
    });
    
    // Enviar lista actualizada
    io.to(lobbyKey).emit('players-updated', { players });
    
    console.log(`✅ [Simple] Respuesta procesada - Lista enviada (${players.length} jugadores)`);
  });

  // OTROS EVENTOS (simplificados)
  socket.on('show-leaderboard-command', (data) => {
    const { gameId, lobbyCode, questionIndex, leaderboard } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`📊 Leaderboard solicitado: ${lobbyKey}`);
    
    io.to(lobbyKey).emit('show-leaderboard', {
      questionIndex,
      leaderboard
    });
  });

  socket.on('next-question-command', (data) => {
    const { gameId, lobbyCode, questionIndex } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`⏭️ Siguiente pregunta: ${lobbyKey} - Q${questionIndex}`);
    
    // 🧹 LIMPIAR RESPUESTAS PROCESADAS DE LA PREGUNTA ANTERIOR
    const previousQuestionIndex = questionIndex - 1;
    if (previousQuestionIndex >= 0) {
      const session = activeGameSessions.get(lobbyKey);
      if (session?.players) {
        let cleanedCount = 0;
        session.players.forEach((player, playerId) => {
          const answerKey = `${lobbyKey}-${playerId}-${previousQuestionIndex}`;
          if (processedAnswers.has(answerKey)) {
            processedAnswers.delete(answerKey);
            cleanedCount++;
          }
        });
        console.log(`🧹 [CLEANUP] Limpiadas ${cleanedCount} respuestas de Q${previousQuestionIndex}`);
      }
    }
    
    const transition = gameTransitions.get(lobbyKey);
    const gameSettings = transition?.gameSettings || {
      maxPlayers: 6,
      timePerQuestion: 30,
      showCorrectAnswers: true
    };
    
    io.to(lobbyKey).emit('next-question', {
      questionIndex,
      gameSettings
    });
  });

  // Evento para remover/expulsar jugadores del lobby
  socket.on('kick-player', (data) => {
    const { gameId, lobbyCode, playerIdToKick } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🚫 [KICK] === EXPULSANDO JUGADOR ===`);
    console.log(`🚫 [KICK] GameId: ${gameId}`);
    console.log(`🚫 [KICK] LobbyCode: ${lobbyCode}`);
    console.log(`🚫 [KICK] Player ID a expulsar: ${playerIdToKick}`);
    console.log(`🚫 [KICK] LobbyKey: ${lobbyKey}`);
    
    // Verificar que el lobby existe
    const lobby = gameLobbies.get(lobbyKey);
    if (!lobby) {
      console.log(`❌ [KICK] Lobby ${lobbyKey} no encontrado`);
      return;
    }
    
    // Buscar al jugador en el lobby
    const playerIndex = lobby.players.findIndex(player => player.id == playerIdToKick);
    if (playerIndex === -1) {
      console.log(`❌ [KICK] Jugador ${playerIdToKick} no encontrado en lobby`);
      return;
    }
    
    const playerToKick = lobby.players[playerIndex];
    console.log(`🚫 [KICK] Jugador encontrado: ${playerToKick.username} (${playerToKick.id})`);
    
    // Remover jugador del lobby
    lobby.players.splice(playerIndex, 1);
    console.log(`🚫 [KICK] Jugador removido del lobby. Jugadores restantes: ${lobby.players.length}`);
    
    // Enviar mensaje de expulsión al jugador específico
    if (playerToKick.socketId) {
      console.log(`🚫 [KICK] Enviando mensaje de expulsión a socket: ${playerToKick.socketId}`);
      
      // Desconectar al jugador del room del lobby
      const kickedSocket = io.sockets.sockets.get(playerToKick.socketId);
      if (kickedSocket) {
        kickedSocket.leave(lobbyKey);
        console.log(`🚫 [KICK] Socket ${playerToKick.socketId} desconectado del room ${lobbyKey}`);
      }
      
      io.to(playerToKick.socketId).emit('player-kicked', {
        message: 'Has sido expulsado del lobby por el administrador',
        reason: 'Expulsado por el host'
      });
    }
    
    // Actualizar lista de jugadores para todos los demás
    console.log(`🚫 [KICK] Enviando lista actualizada a todos los jugadores en ${lobbyKey}`);
    io.to(lobbyKey).emit('lobby-updated', {
      players: lobby.players
    });
    
    console.log(`🚫 [KICK] ✅ Jugador expulsado exitosamente`);
  });

  socket.on('game-finished-command', (data) => {
    const { gameId, lobbyCode } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🏁 Juego terminado: ${lobbyKey}`);
    
    // 🧹 LIMPIAR TODAS LAS RESPUESTAS PROCESADAS DEL JUEGO
    const session = activeGameSessions.get(lobbyKey);
    if (session?.players) {
      let cleanedCount = 0;
      session.players.forEach((player, playerId) => {
        // Limpiar todas las preguntas (asumiendo máximo 20 preguntas)
        for (let q = 0; q < 20; q++) {
          const answerKey = `${lobbyKey}-${playerId}-${q}`;
          if (processedAnswers.has(answerKey)) {
            processedAnswers.delete(answerKey);
            cleanedCount++;
          }
        }
      });
      console.log(`🧹 [GAME-END] Limpiadas ${cleanedCount} respuestas del juego completo`);
    }
    
    io.to(lobbyKey).emit('game-finished');
  });

  socket.on('request-players-list', (data) => {
    const { gameId, lobbyCode } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    const players = getPlayersArray(lobbyKey);
    socket.emit('players-updated', { players });
  });

  // Timer events
  socket.on('timer-finished', (data) => {
    const { gameId, lobbyCode, questionIndex } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`⏰ Timer terminado: ${lobbyKey} - Q${questionIndex}`);
    
    socket.to(lobbyKey).emit('timer-finished', {
      questionIndex
    });
  });

  // Eventos para funcionalidad de "ocultar respuesta"
  socket.on('show-answer-stats', async (data) => {
    const { gameId, lobbyCode, questionIndex } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`📊 [STATS] === EVENTO SHOW-ANSWER-STATS RECIBIDO ===`);
    console.log(`📊 [STATS] GameId: ${gameId}`);
    console.log(`📊 [STATS] LobbyCode: ${lobbyCode}`);
    console.log(`📊 [STATS] QuestionIndex: ${questionIndex}`);
    console.log(`📊 [STATS] LobbyKey: ${lobbyKey}`);
    
    // Obtener todas las respuestas para esta pregunta
    const answerStats = calculateAnswerStatistics(lobbyKey, questionIndex);
    const correctAnswerIndex = await getCorrectAnswerIndex(gameId, questionIndex);
    
    console.log(`📊 [STATS] Estadísticas calculadas:`, answerStats);
    console.log(`📊 [STATS] Respuesta correcta:`, correctAnswerIndex);
    
    const responseData = {
      questionIndex,
      answerStats,
      correctAnswerIndex
    };
    
    console.log(`📊 [STATS] Enviando respuesta a todos los clientes en ${lobbyKey}:`, responseData);
    
    // Enviar estadísticas a todos los jugadores
    io.to(lobbyKey).emit('answer-stats-ready', responseData);
    
    console.log(`📊 [STATS] ✅ Evento answer-stats-ready enviado exitosamente`);
  });

  socket.on('show-classification-command', (data) => {
    const { gameId, lobbyCode, questionIndex, leaderboard } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`📊 [CLASSIFICATION] Host solicita mostrar clasificación: ${lobbyKey} - Q${questionIndex}`);
    
    // Enviar comando a todos los jugadores para mostrar clasificación
    io.to(lobbyKey).emit('show-classification', {
      questionIndex,
      leaderboard
    });
  });

  socket.on('game-ended', (data) => {
    const { gameId, lobbyCode } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`🏆 [GAME-ENDED] Juego terminado - mostrando podio final: ${lobbyKey}`);
    
    // Enviar evento a todos los jugadores para que muestren el podio final
    io.to(lobbyKey).emit('game-ended', {
      gameId,
      lobbyCode
    });
  });

  socket.on('time-up', async (data) => {
    const { gameId, lobbyCode, questionIndex, leaderboard } = data;
    const lobbyKey = `${gameId}-${lobbyCode}`;
    
    console.log(`⏰ [TIME-UP] Tiempo agotado: ${lobbyKey} - Q${questionIndex}`);
    
    // Obtener configuración del lobby (principal) o de transición (backup)
    const lobby = gameLobbies.get(lobbyKey);
    const transition = gameTransitions.get(lobbyKey);
    
    // Priorizar configuración del lobby activo, usar transición como backup
    const gameSettings = lobby?.gameSettings || transition?.gameSettings || {
      maxPlayers: 6,
      timePerQuestion: 30,
      showCorrectAnswers: true
    };
    
    const showCorrectAnswers = gameSettings.showCorrectAnswers;
    
    console.log(`⏰ [TIME-UP] Lobby disponible:`, !!lobby);
    console.log(`⏰ [TIME-UP] Transición disponible:`, !!transition);
    console.log(`⏰ [TIME-UP] Configuración final showCorrectAnswers:`, showCorrectAnswers);
    
    if (showCorrectAnswers === false) {
      // Si está configurado para ocultar respuestas, mostrar estadísticas primero
      console.log(`⏰ [TIME-UP] Mostrando estadísticas antes del leaderboard (modo ocultar respuestas)`);
      
      // Obtener estadísticas de respuestas y respuesta correcta
      const answerStats = calculateAnswerStatistics(lobbyKey, questionIndex);
      const correctAnswerIndex = await getCorrectAnswerIndex(gameId, questionIndex);
      
      const responseData = {
        questionIndex,
        answerStats,
        correctAnswerIndex
      };
      
      console.log(`⏰ [TIME-UP] Enviando estadísticas:`, responseData);
      io.to(lobbyKey).emit('answer-stats-ready', responseData);
    } else {
      // Si se muestran respuestas normalmente, ir directo al leaderboard
      console.log(`⏰ [TIME-UP] Mostrando leaderboard directamente (modo mostrar respuestas)`);
      io.to(lobbyKey).emit('show-leaderboard', {
        questionIndex,
        leaderboard
      });
    }
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    console.log(`--- Usuario desconectado: ${socket.id} ---`);
    
    // Limpiar jugador de lobbies
    gameLobbies.forEach((lobby, lobbyKey) => {
      const playerIndex = lobby.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const removedPlayer = lobby.players.splice(playerIndex, 1)[0];
        console.log(`--- Jugador ${removedPlayer.username} removido del lobby ${lobbyKey} ---`);
        
        // Si el lobby está vacío, eliminarlo
        if (lobby.players.length === 0) {
          gameLobbies.delete(lobbyKey);
          console.log(`--- Lobby ${lobbyKey} eliminado ---`);
          
          // 🧹 [CONFIGURACIÓN] NO limpiar transiciones inmediatamente
          // Las transiciones se limpiarán después de que todos se unan al juego
          console.log(`🧹 [CONFIGURACIÓN] *** LOBBY ELIMINADO PERO MANTENIENDO TRANSICIÓN ***`);
          console.log(`🧹 [CONFIGURACIÓN] Transición para ${lobbyKey} se mantiene para unirse al juego`);
          if (gameTransitions.has(lobbyKey)) {
            console.log(`🧹 [CONFIGURACIÓN] Configuraciones preservadas:`, gameTransitions.get(lobbyKey)?.gameSettings);
            // Programar limpieza después de 30 segundos
            scheduleTransitionCleanup(lobbyKey);
          }
          
          // Solo limpiar sesiones activas, no transiciones
          activeGameSessions.delete(lobbyKey);
          
          console.log(`🧹 Lobby eliminado pero transición ${lobbyKey} preservada`);
        } else {
          // Notificar a los demás jugadores
          socket.to(lobbyKey).emit('lobby-updated', {
            players: lobby.players,
            gameStarted: lobby.gameStarted
          });
        }
        return;
      }
    });
  });
});

// Inicializar base de datos
(async () => {
  try {
    console.log('--- Attempting to connect to database... ---');
    const connection = await pool.getConnection();
    console.log('--- Database connection successful! ---');
    connection.release();
  } catch (error) {
    console.error('--- Database connection failed: ---', error.message);
  }
})();

// Iniciar servidor
const PORT = process.env.PORT || 5003;
server.listen(PORT, () => {
  console.log(`--- Server running on port ${PORT} ---`);
  console.log(`--- WebSocket server ready for multiplayer lobbies ---`);
});