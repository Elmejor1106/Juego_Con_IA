import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../components/common/Button';
import useSocket from '../../../hooks/useSocket';
import './GamePlayerScreen.css';
import '../user/CreateGameAIScreen.css';

const backendUrl = 'http://localhost:5000';

const MultiplayerGameScreen = () => {
  const { gameId, lobbyCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  // Referencias para timers
  const timerRef = useRef(null);
  const statsTimeoutRef = useRef(null);

  console.log('🎮 [MultiplayerGameScreen] === COMPONENTE RENDERIZADO ===');
  console.log('🎮 [MultiplayerGameScreen] Params:', { gameId, lobbyCode });
  console.log('🎮 [MultiplayerGameScreen] User:', user?.username || 'INVITADO');
  console.log('🎮 [MultiplayerGameScreen] LocalStorage actual:', {
    guestPlayerName: localStorage.getItem('guestPlayerName'),
    guestPlayerId: localStorage.getItem('guestPlayerId'),
    hostGameId: localStorage.getItem('hostGameId'),
    hostUserId: localStorage.getItem('hostUserId')
  });

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameFinishedByAdmin, setGameFinishedByAdmin] = useState(false); // NUEVO: Para mostrar mensaje temporal
  const [countdown, setCountdown] = useState(30); // Se actualizará con configuraciones del lobby
  const [timerActive, setTimerActive] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'playing', 'leaderboard', 'finished'
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Estados para la funcionalidad de ocultar respuestas
  const [showAnswerStats, setShowAnswerStats] = useState(false);
  const [answerStatistics, setAnswerStatistics] = useState([]);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  
  // Configuraciones del juego (se reciben del lobby)
  const [gameSettings, setGameSettings] = useState({
    maxPlayers: 6,
    timePerQuestion: 30,
    showCorrectAnswers: false // Cambiado temporalmente para probar la funcionalidad
  });
  
  // Estados para estilos (igual que GamePlayerScreen)
  const [styles, setStyles] = useState({
    containerBg: '#ffffff',
    containerBgImage: '',
    questionText: '#1f2937',
    answerBg: '#f3f4f6',
    answerTextColor: '#1f2937',
    buttonRadius: 8,
    timerBg: '#EF4444',
    timerTextColor: '#FFFFFF',
  });
  
  // Inicializar playerId y playerName - USAR ID GENERADO EN LOBBY/JOIN
  const [playerId] = useState(() => {
    // Si es usuario autenticado, usar su ID
    if (user?.id) {
      console.log('👤 [MultiplayerGameScreen] Usando playerId de usuario autenticado:', user.id);
      return user.id;
    }
    
    // Para invitados: PRIORIDAD 1 - sessionStorage (único por ventana/pestaña)
    const windowPlayerId = sessionStorage.getItem('windowPlayerId');
    const sessionPlayerId = sessionStorage.getItem('guestPlayerId');
    
    if (windowPlayerId) {
      console.log('👤 [MultiplayerGameScreen] *** USANDO WINDOW PLAYER ID (SESSIONSTORAGE) ***');
      console.log('👤 [MultiplayerGameScreen] PlayerId de ventana:', windowPlayerId);
      return windowPlayerId;
    }
    
    if (sessionPlayerId) {
      console.log('👤 [MultiplayerGameScreen] *** USANDO PLAYERID DE SESSION STORAGE ***');
      console.log('👤 [MultiplayerGameScreen] PlayerId del sessionStorage:', sessionPlayerId);
      return sessionPlayerId;
    }
    
    // PRIORIDAD 2 - localStorage (compartido entre pestañas, como fallback)
    const savedGuestPlayerId = localStorage.getItem('guestPlayerId');
    if (savedGuestPlayerId) {
      console.log('👤 [MultiplayerGameScreen] *** USANDO PLAYERID GUARDADO DEL LOCALSTORAGE (FALLBACK) ***');
      console.log('👤 [MultiplayerGameScreen] PlayerId del localStorage:', savedGuestPlayerId);
      
      // Copiar a sessionStorage para evitar conflictos futuros en esta ventana
      const uniqueWindowId = `${savedGuestPlayerId}-w${Date.now()}`;
      sessionStorage.setItem('windowPlayerId', uniqueWindowId);
      console.log('👤 [MultiplayerGameScreen] Creando ID único para esta ventana:', uniqueWindowId);
      return uniqueWindowId;
    }
    
    // Fallback: si no hay ID guardado, crear uno nuevo (no debería pasar)
    const guestPlayerName = sessionStorage.getItem('guestPlayerName') || localStorage.getItem('guestPlayerName');
    if (guestPlayerName) {
      const fallbackId = `guest-${guestPlayerName.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      console.log('👤 [MultiplayerGameScreen] ⚠️  FALLBACK: Generando playerId nuevo:', fallbackId);
      // Guardar para futuras referencias
      sessionStorage.setItem('windowPlayerId', fallbackId);
      sessionStorage.setItem('guestPlayerId', fallbackId);
      return fallbackId;
    }
    
    // Último fallback: generar ID completamente aleatorio
    const uniqueId = `guest-${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${Math.floor(Math.random() * 10000)}`;
    console.log('👤 [MultiplayerGameScreen] ⚠️  ÚLTIMO FALLBACK:', uniqueId);
    sessionStorage.setItem('windowPlayerId', uniqueId);
    return uniqueId;
  });
  
  const [playerName] = useState(() => {
    // Si es usuario autenticado, usar su username
    if (user?.username) {
      console.log('👤 [MultiplayerGameScreen] Usando playerName de usuario autenticado:', user.username);
      return user.username;
    }
    
    // Para invitados: PRIORIDAD 1 - sessionStorage (único por ventana)
    const sessionPlayerName = sessionStorage.getItem('guestPlayerName');
    if (sessionPlayerName) {
      console.log('👤 [MultiplayerGameScreen] *** USANDO NOMBRE DE SESSION STORAGE ***');
      console.log('👤 [MultiplayerGameScreen] PlayerName del sessionStorage:', sessionPlayerName);
      return sessionPlayerName;
    }
    
    // PRIORIDAD 2 - localStorage (compartido, como fallback)
    const localPlayerName = localStorage.getItem('guestPlayerName');
    if (localPlayerName) {
      console.log('👤 [MultiplayerGameScreen] *** USANDO NOMBRE DE LOCALSTORAGE (FALLBACK) ***');
      console.log('👤 [MultiplayerGameScreen] PlayerName del localStorage:', localPlayerName);
      
      // Copiar a sessionStorage para evitar conflictos futuros
      sessionStorage.setItem('guestPlayerName', localPlayerName);
      return localPlayerName;
    }
    
    // Fallback solamente si no hay nombre guardado
    const fallbackName = `Invitado_${Date.now().toString().slice(-4)}`;
    console.log('👤 [MultiplayerGameScreen] ⚠️  FALLBACK: Usando playerName:', fallbackName);
    return fallbackName;
  });

  // Debug de datos del jugador al cargar el componente
  useEffect(() => {
    console.log('🚨 [INIT DEBUG] ================================');
    console.log('🚨 [INIT DEBUG] *** INICIALIZANDO COMPONENTE ***');
    console.log('🚨 [INIT DEBUG] gameId:', gameId);
    console.log('🚨 [INIT DEBUG] lobbyCode:', lobbyCode);
    console.log('🚨 [INIT DEBUG] playerId:', playerId, `(tipo: ${typeof playerId})`);
    console.log('🚨 [INIT DEBUG] playerName:', playerName);
    console.log('🚨 [INIT DEBUG] user:', user);
    console.log('🚨 [INIT DEBUG] sessionStorage windowPlayerId:', sessionStorage.getItem('windowPlayerId'));
    console.log('🚨 [INIT DEBUG] sessionStorage guestPlayerId:', sessionStorage.getItem('guestPlayerId'));
    console.log('🚨 [INIT DEBUG] sessionStorage guestPlayerName:', sessionStorage.getItem('guestPlayerName'));
    console.log('🚨 [INIT DEBUG] localStorage guestPlayerId:', localStorage.getItem('guestPlayerId'));
    console.log('🚨 [INIT DEBUG] localStorage guestPlayerName:', localStorage.getItem('guestPlayerName'));
    console.log('🚨 [INIT DEBUG] ================================');
  }, []); // Solo al montar

  // Cargar juego desde API pública
  useEffect(() => {
    const fetchGame = async () => {
      console.log('🎮 [MultiplayerGameScreen] Cargando juego...');
      setLoading(true);
      setError('');
      
      try {
        const response = await fetch(`http://localhost:5003/api/games/public/${gameId}`);
        console.log('📡 [MultiplayerGameScreen] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error('No se pudo cargar el juego');
        }
        
        const gameData = await response.json();
        console.log('📦 [MultiplayerGameScreen] Juego cargado:', gameData.title);
        console.log('📝 [MultiplayerGameScreen] Preguntas:', gameData.questions?.length || 0);
        
        // Cargar estilos del juego igual que en GamePlayerScreen
        let loadedStyles = {};
        if (gameData.styles) {
          try {
            loadedStyles = typeof gameData.styles === 'string' ? JSON.parse(gameData.styles) : gameData.styles;
          } catch (e) { 
            console.error("Failed to parse styles JSON:", e); 
          }
        }
        setStyles(prevStyles => ({ ...prevStyles, ...loadedStyles }));
        
        setGame(gameData);
        console.log('🎯 [MultiplayerGameScreen] Determinando si es host...');
        
        // Lógica mejorada para determinar si es host
        const referrer = document.referrer;
        const isComingFromLobby = referrer.includes('/multiplayer-lobby/');
        const hostGameId = localStorage.getItem('hostGameId');
        const hostUserId = localStorage.getItem('hostUserId');
        
        // Es host si: tiene usuario autenticado Y (viene del lobby O está guardado en localStorage)
        const userIsHost = (!!user && isComingFromLobby) || (hostGameId === gameId && hostUserId === String(user?.id));
        
        console.log('👑 [MultiplayerGameScreen] === DETERMINACIÓN DE HOST ===');
        console.log('👑 [MultiplayerGameScreen] Usuario autenticado:', !!user);
        console.log('👑 [MultiplayerGameScreen] Viene del lobby:', isComingFromLobby);
        console.log('👑 [MultiplayerGameScreen] Host Game ID guardado:', hostGameId);
        console.log('👑 [MultiplayerGameScreen] Host User ID guardado:', hostUserId);
        console.log('👑 [MultiplayerGameScreen] User ID actual:', user?.id);
        console.log('👑 [MultiplayerGameScreen] ¿Es HOST final?:', userIsHost);
        
        setIsHost(userIsHost);
        console.log('👑 [MultiplayerGameScreen] Estado isHost configurado:', userIsHost);
        
        // Limpiar localStorage después de determinar el host
        if (userIsHost) {
          setTimeout(() => {
            localStorage.removeItem('hostGameId');
            localStorage.removeItem('hostUserId');
            console.log('🧹 [MultiplayerGameScreen] LocalStorage de host limpiado');
          }, 2000);
        }
        
        // Limpiar localStorage de datos de invitado después de usar
        // Programar limpieza para después de que el juego termine
        setTimeout(() => {
          localStorage.removeItem('guestPlayerName');
          localStorage.removeItem('guestPlayerId');
          console.log('🧹 [MultiplayerGameScreen] LocalStorage de invitado limpiado');
        }, 300000); // 5 minutos
        
        // NO inicializar jugadores localmente - depender del backend
        // Solo el backend debe manejar la lista de jugadores
        setPlayers([]); // Empezar con array vacío, esperar backend
        console.log('👥 [MultiplayerGameScreen] Lista de jugadores inicializada vacía - esperando backend...');
        
        console.log('🎮 [MultiplayerGameScreen] === INICIANDO ESTADO DEL JUEGO ===');
        setGameState('playing');
        setTimerActive(true);
        console.log('🎮 [MultiplayerGameScreen] Estado del juego: playing');
        console.log('🎮 [MultiplayerGameScreen] Timer activado: true');
      } catch (err) {
        console.error('❌ [MultiplayerGameScreen] Error:', err);
        setError('No se pudo cargar el juego multijugador');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  // Conectar a WebSocket para recibir actualizaciones
  useEffect(() => {
    if (socket && lobbyCode) {
      console.log('🌐 [MultiplayerGameScreen] === CONECTANDO A WEBSOCKET ===');
      console.log('🌐 [MultiplayerGameScreen] Socket ID:', socket.id);
      console.log('🌐 [MultiplayerGameScreen] Socket conectado:', socket.connected);
      
      // Unirse al lobby para recibir actualizaciones
      console.log('🌐 [MultiplayerGameScreen] === ENVIANDO join-game-session ===');
      console.log('🌐 [MultiplayerGameScreen] GameId:', gameId);
      console.log('🌐 [MultiplayerGameScreen] LobbyCode:', lobbyCode);
      console.log('🌐 [MultiplayerGameScreen] Player ID:', playerId);
      console.log('🌐 [MultiplayerGameScreen] Player Name:', playerName);
      console.log('🌐 [MultiplayerGameScreen] Es Host/Admin:', isHost);
      console.log('🌐 [MultiplayerGameScreen] User autenticado:', !!user, user?.username);
      
      console.log('🌐 [CONFIGURACIÓN] *** ENVIANDO join-game-session AL BACKEND ***');
      console.log('🌐 [CONFIGURACIÓN] gameId:', gameId);
      console.log('🌐 [CONFIGURACIÓN] lobbyCode:', lobbyCode);
      console.log('🌐 [CONFIGURACIÓN] playerName:', playerName);
      console.log('🌐 [CONFIGURACIÓN] playerId:', playerId);
      console.log('🌐 [CONFIGURACIÓN] isHost:', isHost);
      
      socket.emit('join-game-session', {
        gameId,
        lobbyCode,
        playerName: playerName,
        playerId: playerId,
        isHost: isHost // Enviar información de si es host al backend
      });
      
      console.log('🌐 [CONFIGURACIÓN] ✅ join-game-session ENVIADO');
      
      // Después de un breve delay, solicitar lista actualizada
      setTimeout(() => {
        console.log('🔄 [MultiplayerGameScreen] Solicitando lista de jugadores actualizada...');
        socket.emit('request-players-list', {
          gameId,
          lobbyCode
        });
      }, 1000);

      // Actualizar lista de jugadores - ÚNICA FUENTE DE VERDAD
      socket.on('players-updated', (data) => {
        console.log('👥 [MultiplayerGameScreen] === JUGADORES ACTUALIZADOS ===');
        console.log('👥 [MultiplayerGameScreen] Data recibida:', data);
        console.log('👥 [MultiplayerGameScreen] Jugadores recibidos:', data.players);
        console.log('👥 [MultiplayerGameScreen] Cantidad:', data.players?.length || 0);
        console.log('👥 [MultiplayerGameScreen] Estado anterior players:', players);
        
        // Loguear cada jugador recibido CON DETALLE
        if (data.players && data.players.length > 0) {
          console.log(`👥 [MultiplayerGameScreen] === ANÁLISIS DETALLADO DE JUGADORES RECIBIDOS ===`);
          data.players.forEach((player, index) => {
            console.log(`👥 [MultiplayerGameScreen] Jugador ${index + 1}:`);
            console.log(`👥 [MultiplayerGameScreen]   ID: "${player.id}" (${typeof player.id})`);
            console.log(`👥 [MultiplayerGameScreen]   NAME: "${player.name}" (${typeof player.name})`);
            console.log(`👥 [MultiplayerGameScreen]   SCORE: ${player.score} (${typeof player.score})`);
            console.log(`👥 [MultiplayerGameScreen]   IS_HOST: ${player.isHost} (${typeof player.isHost})`);
            console.log(`👥 [MultiplayerGameScreen]   Objeto completo:`, player);
          });
          
          // ACTUALIZAR NOMBRE LOCAL SI EL BACKEND LO CAMBIÓ
          const myPlayerData = data.players.find(p => String(p.id) === String(playerId));
          if (myPlayerData && myPlayerData.name !== playerName) {
            console.log(`🔄 [MultiplayerGameScreen] Actualizando nombre local: "${playerName}" → "${myPlayerData.name}"`);
            // Note: playerName is const, but we can update display logic to use backend name
          }
          
          // SIEMPRE actualizar la lista completa desde el backend
          setPlayers([...data.players]); // Crear nueva referencia
          console.log('✅ [MultiplayerGameScreen] Lista de jugadores REEMPLAZADA completamente');
          
          // SINCRONIZACIÓN ESTRICTA DE PUNTAJE
          console.log('🔄 [MultiplayerGameScreen] === SINCRONIZACIÓN DE PUNTAJE INICIADA ===');
          console.log('🔄 [MultiplayerGameScreen] PlayerId local:', playerId, `(${typeof playerId})`);
          console.log('🔄 [MultiplayerGameScreen] PlayerName local:', playerName);
          console.log('🔄 [MultiplayerGameScreen] IsHost:', isHost);
          console.log('🔄 [MultiplayerGameScreen] Score local actual:', score);
          console.log('🔄 [MultiplayerGameScreen] Trigger evento:', data.triggerBy || 'unknown');
          
          // BÚSQUEDA ESTRICTA DEL JUGADOR ACTUAL
          let currentPlayer = null;
          let playerIndex = -1;
          
          for (let i = 0; i < data.players.length; i++) {
            const p = data.players[i];
            console.log(`🔄 [MultiplayerGameScreen] Verificando jugador ${i}: "${p.name}" (ID: "${p.id}" ${typeof p.id})`);
            
            // Comparación estricta por ID convertido a string
            if (String(p.id) === String(playerId)) {
              // DOBLE VERIFICACIÓN: También verificar el nombre si no es host
              if (isHost || p.name === playerName) {
                currentPlayer = p;
                playerIndex = i;
                console.log(`✅ [MultiplayerGameScreen] JUGADOR ENCONTRADO en índice ${i}`);
                console.log(`✅ [MultiplayerGameScreen] Datos: ${p.name} (ID: ${p.id}) - Score: ${p.score}`);
                break;
              } else {
                console.log(`⚠️ [MultiplayerGameScreen] ID coincide pero nombre no: "${p.name}" !== "${playerName}"`);
              }
            }
          }
          
          if (!currentPlayer) {
            console.log('❌ [MultiplayerGameScreen] JUGADOR NO ENCONTRADO EN LISTA DEL BACKEND');
            console.log('❌ [MultiplayerGameScreen] Buscando:', {
              id: playerId,
              name: playerName,
              isHost: isHost
            });
            console.log('❌ [MultiplayerGameScreen] Disponibles:');
            data.players.forEach((p, idx) => {
              console.log(`❌ [MultiplayerGameScreen]   ${idx}: "${p.name}" (ID: "${p.id}" ${typeof p.id}) - Score: ${p.score}`);
            });
            return; // SALIR sin actualizar nada
          }
          
          // ACTUALIZACIÓN SEGURA DEL SCORE SOLO PARA JUGADORES NORMALES
          if (!isHost) {
            const backendScore = Number(currentPlayer.score) || 0;
            const localScore = Number(score) || 0;
            
            console.log('🔄 [MultiplayerGameScreen] === COMPARACIÓN DE SCORES ===');
            console.log('🔄 [MultiplayerGameScreen] Score local:', localScore);
            console.log('🔄 [MultiplayerGameScreen] Score backend:', backendScore);
            
            if (localScore !== backendScore) {
              console.log('� [MultiplayerGameScreen] Scores diferentes - actualizando local');
              setScore(backendScore);
              console.log('✅ [MultiplayerGameScreen] Score local actualizado de', localScore, 'a', backendScore);
            } else {
              console.log('✅ [MultiplayerGameScreen] Scores ya sincronizados');
            }
          } else {
            console.log('👑 [MultiplayerGameScreen] Usuario es HOST - no sincronizar score personal');
          }
        } else {
          console.log('⚠️ [MultiplayerGameScreen] Backend envió lista vacía - manteniendo estado actual');
          // Solo resetear si explícitamente es un array vacío del backend
          if (data.players && Array.isArray(data.players) && data.players.length === 0) {
            setPlayers([]);
            console.log('🔄 [MultiplayerGameScreen] Lista reseteada a vacía por backend');
          }
        }
      });

      // Escuchar respuestas de otros jugadores
      socket.on('player-answered', (data) => {
        console.log('📨 [MultiplayerGameScreen] === RESPUESTA DE OTRO JUGADOR ===');
        console.log('📨 [MultiplayerGameScreen] Mi jugador:', playerName, 'ID:', playerId);
        console.log('📨 [MultiplayerGameScreen] Respuesta recibida de:', data.playerName, 'ID:', data.playerId);
        console.log('📨 [MultiplayerGameScreen] Data completa recibida:', data);
        console.log('📨 [MultiplayerGameScreen] Jugadores actuales antes:', players);
        
        // NO actualizar aquí - dejar que players-updated maneje todo
        // Esto evita conflictos de estado
        console.log('📨 [MultiplayerGameScreen] Esperando players-updated para sincronizar...');
      });

      // Control de navegación del host
      socket.on('show-leaderboard', (data) => {
        console.log('📊 [MultiplayerGameScreen] Mostrar tabla de clasificación');
        setGameState('leaderboard');
        setLeaderboard(data.leaderboard);
        setTimerActive(false);
      });

      socket.on('next-question', (data) => {
        console.log('⏭️ [MultiplayerGameScreen] === SIGUIENTE PREGUNTA POR COMANDO DEL HOST ===');
        console.log('⏭️ [MultiplayerGameScreen] Data recibida:', data);
        console.log('⏭️ [MultiplayerGameScreen] QuestionIndex:', data.questionIndex);
        console.log('⏭️ [MultiplayerGameScreen] GameSettings en evento:', data.gameSettings);
        
        setCurrentQuestionIndex(data.questionIndex);
        setSelectedAnswer(null);
        setIsAnswered(false);
        
        // Usar configuraciones del evento si están disponibles, sino usar las locales
        let timeForQuestion = 30; // valor por defecto
        
        if (data.gameSettings && data.gameSettings.timePerQuestion !== undefined) {
          // Usar configuraciones del evento next-question
          timeForQuestion = data.gameSettings.timePerQuestion || 30;
          console.log('⏰ [MultiplayerGameScreen] Usando tiempo del evento next-question:', timeForQuestion);
          
          // Actualizar también las configuraciones locales por si acaso
          setGameSettings(data.gameSettings);
        } else {
          // Fallback a configuraciones locales
          timeForQuestion = gameSettings.timePerQuestion || 30;
          console.log('⏰ [MultiplayerGameScreen] Usando tiempo de configuraciones locales:', timeForQuestion);
        }
        
        console.log('⏰ [MultiplayerGameScreen] ✅ Aplicando tiempo final:', timeForQuestion);
        setCountdown(timeForQuestion);
        
        setGameState('playing');
        setTimerActive(true);
      });

      // Escuchar cuando el juego termina y debe mostrar podio final
      socket.on('game-ended', (data) => {
        console.log('🏆 [MultiplayerGameScreen] === JUEGO TERMINADO - MOSTRAR PODIO ===');
        console.log('🏆 [MultiplayerGameScreen] Data recibida:', data);
        
        setGameFinished(true);
        setGameState('finished');
        setTimerActive(false);
      });

      // NUEVO: Escuchar evento de finalización enviado por el admin
      socket.on('game-finished', (data) => {
        console.log('🏁 [MultiplayerGameScreen] === JUEGO FINALIZADO POR ADMIN ===');
        console.log('🏁 [MultiplayerGameScreen] Data recibida:', data);
        console.log('🏁 [MultiplayerGameScreen] Estado actual gameFinished:', gameFinished);
        
        // Si ya estamos mostrando el podio final, no hacer nada - el admin navegará manualmente
        if (gameFinished) {
          console.log('🏁 [MultiplayerGameScreen] Ya en podio final - no redirigir automáticamente');
          return;
        }
        
        console.log('🏁 [MultiplayerGameScreen] Mostrando mensaje y navegando...');
        
        // Mostrar mensaje temporal de "Juego finalizado por el administrador"
        setGameFinishedByAdmin(true);
        
        // Después de 3 segundos, navegar a la pantalla de resultados
        setTimeout(() => {
          console.log('🚀 [MultiplayerGameScreen] Navegando a resultados finales...');
          navigate(`/game-results/${gameId}`);
        }, 3000); // 3 segundos para que lean el mensaje
      });

      // Escuchar configuraciones del juego (enviadas cuando se conecta a una sesión existente)
      socket.on('game-settings', (data) => {
        console.log('🔥 [CONFIGURACIÓN] ================================');
        console.log('🔥 [CONFIGURACIÓN] *** CONFIGURACIONES RECIBIDAS DEL BACKEND ***');
        console.log('🔥 [CONFIGURACIÓN] Data completa:', JSON.stringify(data, null, 2));
        console.log('🔥 [CONFIGURACIÓN] Configuraciones recibidas:', data.settings);
        console.log('🔥 [CONFIGURACIÓN] Player actual:', playerName);
        console.log('🔥 [CONFIGURACIÓN] IsHost:', isHost);
        console.log('🔥 [CONFIGURACIÓN] GameState actual:', gameState);
        console.log('🔥 [CONFIGURACIÓN] Countdown ANTES:', countdown);
        console.log('🔥 [CONFIGURACIÓN] GameSettings ANTES:', JSON.stringify(gameSettings, null, 2));
        
        if (data.settings) {
          console.log('🔥 [CONFIGURACIÓN] ✅ *** APLICANDO CONFIGURACIONES RECIBIDAS ***');
          console.log('🔥 [CONFIGURACIÓN] timePerQuestion recibido:', data.settings.timePerQuestion);
          console.log('🔥 [CONFIGURACIÓN] showCorrectAnswers recibido:', data.settings.showCorrectAnswers);
          console.log('🔥 [CONFIGURACIÓN] maxPlayers recibido:', data.settings.maxPlayers);
          
          setGameSettings(data.settings);
          console.log('🔥 [CONFIGURACIÓN] setGameSettings ejecutado');
          
          // Aplicar tiempo por pregunta inmediatamente si hay cambios
          if (data.settings.timePerQuestion !== undefined) {
            const newTime = data.settings.timePerQuestion || 30;
            console.log('🔥 [CONFIGURACIÓN] ⏰ *** ACTUALIZANDO TEMPORIZADOR ***');
            console.log('🔥 [CONFIGURACIÓN] ⏰ Tiempo recibido:', data.settings.timePerQuestion);
            console.log('🔥 [CONFIGURACIÓN] ⏰ Nuevo tiempo calculado:', newTime);
            console.log('🔥 [CONFIGURACIÓN] ⏰ Countdown anterior:', countdown);
            
            setCountdown(newTime);
            
            console.log('🔥 [CONFIGURACIÓN] ⏰ ✅ setCountdown ejecutado con:', newTime);
          }
          
          console.log('🔥 [CONFIGURACIÓN] ✅ CONFIGURACIONES APLICADAS EXITOSAMENTE');
        } else {
          console.log('🔥 [CONFIGURACIÓN] ❌ NO HAY CONFIGURACIONES EN data.settings');
        }
        
        console.log('🔥 [CONFIGURACIÓN] ================================');
      });

      // Escuchar actualizaciones de configuraciones
      socket.on('settings-updated', (data) => {
        console.log('🚀 [MultiplayerGameScreen] === CONFIGURACIONES ACTUALIZADAS RECIBIDAS ===');
        console.log('🚀 [MultiplayerGameScreen] Data completa:', data);
        console.log('🚀 [MultiplayerGameScreen] Nuevas configuraciones:', data.settings);
        console.log('🚀 [MultiplayerGameScreen] IsHost actual:', isHost);
        console.log('🚀 [MultiplayerGameScreen] Player name:', user?.username || localStorage.getItem('guestPlayerName') || 'ANONIMO');
        console.log('🚀 [MultiplayerGameScreen] GameState actual:', gameState);
        console.log('🚀 [MultiplayerGameScreen] Countdown actual antes:', countdown);
        
        if (data.settings) {
          console.log('🚀 [MultiplayerGameScreen] ✅ Aplicando configuraciones actualizadas...');
          setGameSettings(data.settings);
          
          // Aplicar tiempo por pregunta inmediatamente si hay cambios
          if (data.settings.timePerQuestion !== undefined) {
            const newTime = data.settings.timePerQuestion || 30;
            console.log('🚀 ⏰ [MultiplayerGameScreen] Aplicando nuevo tiempo actualizado por pregunta:', newTime);
            console.log('🚀 ⏰ [MultiplayerGameScreen] Countdown antes:', countdown);
            setCountdown(newTime);
            console.log('🚀 ⏰ [MultiplayerGameScreen] setCountdown ejecutado con:', newTime);
          }
        } else {
          console.log('🚀 ❌ [MultiplayerGameScreen] No hay configuraciones en settings-updated');
        }
      });

      // Manejar desincronización de ID de jugador
      socket.on('player-id-mismatch', (data) => {
        console.log('🔄 [MultiplayerGameScreen] === ID DESINCRONIZADO DETECTADO ===');
        console.log('🔄 [MultiplayerGameScreen] ID proporcionado:', data.providedId);
        console.log('🔄 [MultiplayerGameScreen] Nombre:', data.providedName);
        console.log('🔄 [MultiplayerGameScreen] Jugadores disponibles:', data.availablePlayers);
        
        // Buscar si hay un jugador con nuestro nombre en la lista del servidor
        const playerWithSameName = data.availablePlayers.find(p => p.name === playerName);
        if (playerWithSameName) {
          console.log('🔄 [MultiplayerGameScreen] Jugador encontrado por nombre:', playerWithSameName);
          console.log('🔄 [MultiplayerGameScreen] Actualizando ID local para sincronizar con el servidor');
          
          // Actualizar el ID en sessionStorage para futuras sesiones
          const guestPlayerName = localStorage.getItem('guestPlayerName');
          if (guestPlayerName) {
            sessionStorage.setItem(`playerId-${guestPlayerName}`, playerWithSameName.id);
            console.log('🔄 [MultiplayerGameScreen] ID actualizado en sessionStorage:', playerWithSameName.id);
          }
          
          // Reconectar al juego con el ID correcto
          console.log('🔄 [MultiplayerGameScreen] Reconectando con ID sincronizado...');
          socket.emit('join-game-session', {
            gameId,
            lobbyCode,
            playerName: playerName,
            playerId: playerWithSameName.id,
            isHost: isHost
          });
        } else {
          console.log('❌ [MultiplayerGameScreen] No se encontró jugador con nombre coincidente');
        }
      });

      // Nuevos eventos para la funcionalidad de ocultar respuestas
      socket.on('answer-stats-ready', (data) => {
        console.log('📊 [MultiplayerGameScreen] === ESTADÍSTICAS DE RESPUESTAS RECIBIDAS ===');
        console.log('📊 [MultiplayerGameScreen] Data completa:', data);
        console.log('📊 [MultiplayerGameScreen] answerStats:', data.answerStats);
        console.log('📊 [MultiplayerGameScreen] correctAnswerIndex:', data.correctAnswerIndex);
        console.log('📊 [MultiplayerGameScreen] questionIndex:', data.questionIndex);
        
        // Validar que los datos existan
        if (data.answerStats && Array.isArray(data.answerStats)) {
          console.log('✅ [MultiplayerGameScreen] Datos válidos, actualizando estados...');
          
          // Cancelar timeout de estadísticas por defecto si existe
          if (statsTimeoutRef.current) {
            clearTimeout(statsTimeoutRef.current);
            statsTimeoutRef.current = null;
            console.log('🚫 [MultiplayerGameScreen] Timeout de estadísticas por defecto cancelado');
          }
          
          setAnswerStatistics(data.answerStats);
          setCorrectAnswerIndex(data.correctAnswerIndex);
          setShowAnswerStats(true);
          setGameState('answer-stats');
          console.log('✅ [MultiplayerGameScreen] Estados actualizados correctamente');
        } else {
          console.log('❌ [MultiplayerGameScreen] Datos inválidos recibidos');
        }
      });

      socket.on('show-classification', (data) => {
        console.log('📊 [MultiplayerGameScreen] === MOSTRAR CLASIFICACIÓN DESPUÉS DE ESTADÍSTICAS ===');
        console.log('📊 [MultiplayerGameScreen] Data:', data);
        setShowAnswerStats(false);
        setLeaderboard(data.leaderboard);
        setGameState('leaderboard');
      });

      return () => {
        socket.off('players-updated');
        socket.off('player-answered');
        socket.off('show-leaderboard');
        socket.off('next-question');
        socket.off('game-ended');
        socket.off('game-finished'); // NUEVO: Limpiar evento de finalización por admin
        socket.off('game-settings');
        socket.off('settings-updated');
        socket.off('player-id-mismatch');
        socket.off('answer-stats-ready');
        socket.off('show-classification');
        
        // Limpiar timeouts
        if (statsTimeoutRef.current) {
          clearTimeout(statsTimeoutRef.current);
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [socket, lobbyCode, gameId, user, isHost]); // Agregar isHost como dependencia

  // Efecto para redirigir jugadores normales al login cuando termine el juego
  useEffect(() => {
    if (gameFinished && !isHost) {
      console.log('🔄 [MultiplayerGameScreen] Juego terminado - programando redirección al login para jugador normal');
      const redirectTimer = setTimeout(() => {
        console.log('🚀 [MultiplayerGameScreen] Redirigiendo jugador normal al login');
        navigate('/login');
      }, 5000); // 5 segundos

      return () => clearTimeout(redirectTimer);
    }
  }, [gameFinished, isHost, navigate]);

  // Timer countdown
  useEffect(() => {
    console.log('⏰ [MultiplayerGameScreen] === TIMER EFFECT ===');
    console.log('⏰ [MultiplayerGameScreen] Timer activo:', timerActive);
    console.log('⏰ [MultiplayerGameScreen] Countdown:', countdown);
    console.log('⏰ [MultiplayerGameScreen] Es respondida:', isAnswered);
    console.log('⏰ [MultiplayerGameScreen] Estado del juego:', gameState);
    
    let timer;
    // El timer debe funcionar siempre que esté activo y el juego esté en 'playing'
    // NO se debe detener solo porque un jugador respondió
    if (timerActive && countdown > 0 && gameState === 'playing') {
      console.log('✅ [MultiplayerGameScreen] Iniciando timer para countdown:', countdown);
      timer = setTimeout(() => {
        console.log('⏰ [MultiplayerGameScreen] Timer ejecutándose, nuevo countdown:', countdown - 1);
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0 && gameState === 'playing') {
      console.log('⏰ [MultiplayerGameScreen] === TIEMPO AGOTADO ===');
      handleTimeUp();
    } else {
      console.log('⏰ [MultiplayerGameScreen] Timer no iniciado. Razones:', {
        timerActive,
        countdown,
        gameState
      });
    }
    return () => {
      if (timer) {
        console.log('🧹 [MultiplayerGameScreen] Limpiando timer');
        clearTimeout(timer);
      }
    };
  }, [countdown, timerActive, gameState]); // Removemos isAnswered de las dependencias

  const handleTimeUp = () => {
    console.log('⏰ [MultiplayerGameScreen] === TIEMPO AGOTADO ===');
    console.log('⏰ [MultiplayerGameScreen] Es host:', isHost);
    console.log('⏰ [MultiplayerGameScreen] Socket disponible:', !!socket);
    console.log('⏰ [MultiplayerGameScreen] Configuración showCorrectAnswers:', gameSettings.showCorrectAnswers);
    console.log('⏰ [MultiplayerGameScreen] Pregunta actual:', currentQuestionIndex);
    console.log('⏰ [MultiplayerGameScreen] Total preguntas:', game?.questions?.length || 0);
    console.log('⏰ [MultiplayerGameScreen] ¿Es última pregunta?:', currentQuestionIndex >= (game?.questions?.length - 1));
    
    setTimerActive(false);
    console.log('⏰ [MultiplayerGameScreen] Timer desactivado');
    
    // Si es el host, decidir qué hacer basado en la configuración
    if (isHost && socket) {
      if (!gameSettings.showCorrectAnswers) {
        // Modo "ocultar respuesta": mostrar estadísticas primero
        console.log('⏰ [MultiplayerGameScreen] Modo ocultar respuesta - enviando comando para mostrar estadísticas...');
        console.log('⏰ [MultiplayerGameScreen] Datos que se envían:', {
          gameId,
          lobbyCode,
          questionIndex: currentQuestionIndex
        });
        
        socket.emit('show-answer-stats', {
          gameId,
          lobbyCode,
          questionIndex: currentQuestionIndex
        });
        console.log('⏰ [MultiplayerGameScreen] ✅ Comando show-answer-stats enviado exitosamente');
      } else {
        // Modo normal: ir directamente al leaderboard
        console.log('⏰ [MultiplayerGameScreen] Modo normal - enviando comando time-up...');
        const currentLeaderboard = calculateLeaderboard();
        console.log('⏰ [MultiplayerGameScreen] Leaderboard calculado:', currentLeaderboard);
        
        socket.emit('time-up', {
          gameId,
          lobbyCode,
          questionIndex: currentQuestionIndex,
          leaderboard: currentLeaderboard
        });
        console.log('⏰ [MultiplayerGameScreen] Comando time-up enviado');
      }
    } else {
      console.log('⏰ [MultiplayerGameScreen] No es host o sin socket, no enviando comando');
    }
    
    // Cambiar estado según la configuración
    if (!gameSettings.showCorrectAnswers) {
      console.log('⏰ [MultiplayerGameScreen] Cambiando estado a mostrar estadísticas');
      setGameState('answer-stats');
      
      // Fallback: Si no se reciben datos en 3 segundos, usar datos por defecto
      // Pero solo si no hemos recibido estadísticas válidas ya
      statsTimeoutRef.current = setTimeout(() => {
        if (answerStatistics.length === 0 && !showAnswerStats) {
          console.log('⚠️ [MultiplayerGameScreen] Timeout - usando estadísticas por defecto');
          setAnswerStatistics([
            { answerIndex: 0, count: 1, percentage: 25 },
            { answerIndex: 1, count: 2, percentage: 50 },
            { answerIndex: 2, count: 1, percentage: 25 },
            { answerIndex: 3, count: 0, percentage: 0 }
          ]);
          setCorrectAnswerIndex(1);
          setShowAnswerStats(true);
        } else {
          console.log('✅ [MultiplayerGameScreen] Estadísticas ya cargadas, cancelando timeout');
        }
      }, 3000);
    } else {
      console.log('⏰ [MultiplayerGameScreen] Cambiando estado a leaderboard');
      setGameState('leaderboard');
    }
  };

  const calculateLeaderboard = () => {
    console.log('📊 [MultiplayerGameScreen] === CALCULANDO LEADERBOARD ===');
    console.log('📊 [MultiplayerGameScreen] Jugadores actuales:', players);
    console.log('📊 [MultiplayerGameScreen] Cantidad de jugadores:', players.length);
    
    // Loguear cada jugador individualmente
    players.forEach((player, index) => {
      console.log(`📊 [MultiplayerGameScreen] Jugador ${index + 1}:`, {
        id: player.id,
        name: player.name,
        score: player.score,
        isHost: player.isHost
      });
    });
    
    if (!players || players.length === 0) {
      console.log('⚠️ [MultiplayerGameScreen] No hay jugadores para calcular leaderboard');
      return [];
    }
    
    // FILTRAR AL ADMIN/HOST - no debe aparecer en la clasificación
    const playersOnly = players.filter(player => {
      const shouldInclude = !player.isHost;
      console.log(`📊 [MultiplayerGameScreen] ${player.name} (isHost: ${player.isHost}) - ¿Incluir?: ${shouldInclude}`);
      return shouldInclude;
    });
    
    console.log('📊 [MultiplayerGameScreen] Jugadores después de filtrar admin:', playersOnly);
    console.log('📊 [MultiplayerGameScreen] Cantidad de jugadores participantes:', playersOnly.length);
    
    if (playersOnly.length === 0) {
      console.log('⚠️ [MultiplayerGameScreen] No hay jugadores participantes (solo admin)');
      return [];
    }
    
    const leaderboard = [...playersOnly] // Crear copia para no mutar el original
      .sort((a, b) => {
        console.log(`📊 [MultiplayerGameScreen] Comparando ${a.name}(${a.score}) vs ${b.name}(${b.score})`);
        return b.score - a.score;
      })
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));
      
    console.log('📊 [MultiplayerGameScreen] Leaderboard final (sin admin):', leaderboard);
    return leaderboard;
  };

  const handleAnswerClick = (answerIndex) => {
    console.log('🚨 [CLICK DEBUG] ================================');
    console.log('🚨 [CLICK DEBUG] *** RESPUESTA CLICKEADA ***');
    console.log('🚨 [CLICK DEBUG] Jugador que hace clic:', playerName);
    console.log('🚨 [CLICK DEBUG] PlayerId:', playerId, `(tipo: ${typeof playerId})`);
    console.log('🚨 [CLICK DEBUG] Índice respuesta:', answerIndex);
    console.log('🚨 [CLICK DEBUG] Ya respondida:', isAnswered);
    console.log('🚨 [CLICK DEBUG] Estado del juego:', gameState);
    console.log('🚨 [CLICK DEBUG] Es host:', isHost);
    console.log('🚨 [CLICK DEBUG] Timer activo antes:', timerActive);
    console.log('🚨 [CLICK DEBUG] Socket existe:', !!socket);
    console.log('🚨 [CLICK DEBUG] Socket conectado:', socket?.connected);
    console.log('🚨 [CLICK DEBUG] Socket ID:', socket?.id);
    console.log('🚨 [CLICK DEBUG] gameId:', gameId);
    console.log('🚨 [CLICK DEBUG] lobbyCode:', lobbyCode);
    console.log('🚨 [CLICK DEBUG] currentQuestionIndex:', currentQuestionIndex);
    console.log('🚨 [CLICK DEBUG] ================================');
    
    if (isAnswered || gameState !== 'playing') {
      console.log('❌ [MultiplayerGameScreen] RESPUESTA BLOQUEADA para:', playerName);
      console.log('❌ [MultiplayerGameScreen] Motivos:', { 
        isAnswered, 
        gameState, 
        expectedGameState: 'playing',
        playerId,
        playerName
      });
      return;
    }

    console.log('✅ [MultiplayerGameScreen] Procesando respuesta de JUGADOR...');
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    console.log('✅ [MultiplayerGameScreen] Estados actualizados - isAnswered: true');

    // Verificar si es correcta
    const currentQuestion = game.questions[currentQuestionIndex];
    const isCorrect = answerIndex === currentQuestion.correct_answer;
    
    console.log('✅ [MultiplayerGameScreen] Respuesta correcta:', isCorrect);
    console.log('✅ [MultiplayerGameScreen] Respuesta correcta esperada:', currentQuestion.correct_answer);
    
    // NO calcular puntaje localmente - el backend será la fuente de verdad
    // El puntaje se actualizará cuando llegue el evento players-updated
    console.log('📡 [MultiplayerGameScreen] Enviando respuesta al backend sin puntaje calculado');

    // VALIDAR DATOS DEL JUGADOR
    if (!playerId || !playerName) {
      console.log('❌ [MultiplayerGameScreen] Datos del jugador incompletos:', {
        playerId,
        playerName
      });
      return;
    }
    
    // Enviar respuesta por WebSocket con validación estricta
    if (socket && socket.connected) {
      console.log('📡 [MultiplayerGameScreen] === VALIDANDO DATOS PARA ENVÍO ===');
      console.log('📡 [MultiplayerGameScreen] Jugador que envía:', playerName);
      console.log('📡 [MultiplayerGameScreen] Player ID:', playerId, `(${typeof playerId})`);
      console.log('📡 [MultiplayerGameScreen] Player Name:', playerName, `(${typeof playerName})`);
      console.log('📡 [MultiplayerGameScreen] Game ID:', gameId);
      console.log('📡 [MultiplayerGameScreen] Lobby Code:', lobbyCode);
      console.log('📡 [MultiplayerGameScreen] Question Index:', currentQuestionIndex);
      console.log('📡 [MultiplayerGameScreen] Answer Index:', answerIndex);
      console.log('📡 [MultiplayerGameScreen] Is Correct:', isCorrect);
      console.log('📡 [MultiplayerGameScreen] Countdown:', countdown);
      
      const answerData = {
        gameId: String(gameId), // Asegurar formato string
        lobbyCode: String(lobbyCode),
        playerId: String(playerId), // Asegurar formato string
        playerName: String(playerName),
        questionIndex: Number(currentQuestionIndex),
        answer: Number(answerIndex),
        isCorrect: Boolean(isCorrect),
        timeLeft: Number(countdown) || 0
      };
      
      console.log('📡 [MultiplayerGameScreen] === DATA COMPLETA ENVIADA ===');
      console.log('📡 [MultiplayerGameScreen] Answer Data:', JSON.stringify(answerData, null, 2));
      
      try {
        console.log('🚨 [ENVÍO] *** A PUNTO DE ENVIAR RESPUESTA ***');
        console.log('🚨 [ENVÍO] Jugador:', playerName);
        console.log('🚨 [ENVÍO] Evento: player-answer');
        console.log('🚨 [ENVÍO] Data:', JSON.stringify(answerData, null, 2));
        
        socket.emit('player-answer', answerData);
        
        console.log('🚨 [ENVÍO] ✅ RESPUESTA ENVIADA EXITOSAMENTE');
        console.log('🚨 [ENVÍO] Jugador que envió:', playerName);
        console.log('🚨 [ENVÍO] PlayerId enviado:', answerData.playerId);
      } catch (error) {
        console.log('🚨 [ENVÍO] ❌ ERROR AL ENVIAR RESPUESTA:', error);
        console.log('🚨 [ENVÍO] Jugador que falló:', playerName);
      }
    } else {
      console.log('❌ [MultiplayerGameScreen] PROBLEMA DE SOCKET para:', playerName);
      console.log('❌ [MultiplayerGameScreen] Socket existe:', !!socket);
      console.log('❌ [MultiplayerGameScreen] Socket conectado:', socket?.connected);
      console.log('❌ [MultiplayerGameScreen] Socket ID:', socket?.id);
    }
    
    console.log('✅ [MultiplayerGameScreen] === FIN HANDLE ANSWER CLICK ===');
    console.log('✅ [MultiplayerGameScreen] Timer activo después:', timerActive);
  };

  const handleNextQuestion = useCallback(() => {
    console.log('⏭️ [MultiplayerGameScreen] === SIGUIENTE PREGUNTA SOLICITADA ===');
    console.log('⏭️ [MultiplayerGameScreen] CurrentQuestionIndex:', currentQuestionIndex);
    console.log('⏭️ [MultiplayerGameScreen] Total preguntas:', game?.questions?.length || 0);
    console.log('⏭️ [MultiplayerGameScreen] IsHost:', isHost);
    console.log('⏭️ [MultiplayerGameScreen] GameSettings:', gameSettings);
    
    if (!game || !game.questions) return;

    if (currentQuestionIndex < game.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      
      if (isHost && socket) {
        console.log('⏭️ [MultiplayerGameScreen] 👑 HOST enviando comando next-question...');
        // El host envía el comando para avanzar a todos
        socket.emit('next-question-command', {
          gameId,
          lobbyCode,
          questionIndex: nextIndex
        });
      }
      
      // Actualizar estado local
      console.log('⏭️ [MultiplayerGameScreen] Actualizando índice a:', nextIndex);
      setCurrentQuestionIndex(nextIndex);
      
      // Usar tiempo configurado del lobby o 30 por defecto
      const timeForQuestion = gameSettings.timePerQuestion || 30;
      console.log('⏭️ [MultiplayerGameScreen] ⏰ Aplicando tiempo por pregunta:', timeForQuestion);
      console.log('⏭️ [MultiplayerGameScreen] ⏰ Countdown actual antes:', countdown);
      setCountdown(timeForQuestion);
      console.log('⏭️ [MultiplayerGameScreen] ⏰ setCountdown ejecutado con:', timeForQuestion);
      
      setTimerActive(true);
      setIsAnswered(false);
      setSelectedAnswer(null);
      setGameState('playing');
      
    } else {
      // Juego terminado - solo mostrar podio localmente
      console.log('🏁 [MultiplayerGameScreen] Juego terminado - mostrando podio final');
      
      // Enviar evento a todos los jugadores para que muestren el podio final
      if (isHost && socket) {
        socket.emit('game-ended', {
          gameId,
          lobbyCode
        });
      }
      
      // NO enviar game-finished-command aquí - solo cuando admin presione "Finalizar" explícitamente
      setGameFinished(true);
      setGameState('finished');
      setTimerActive(false);
    }
  }, [currentQuestionIndex, game, isHost, socket, gameId, lobbyCode]);

  const handleShowLeaderboard = () => {
    if (isHost && socket) {
      const currentLeaderboard = calculateLeaderboard();
      socket.emit('show-leaderboard-command', {
        gameId,
        lobbyCode,
        questionIndex: currentQuestionIndex,
        leaderboard: currentLeaderboard
      });
    }
    setGameState('leaderboard');
    setLeaderboard(calculateLeaderboard());
  };

  const handleShowClassification = () => {
    console.log('📊 [MultiplayerGameScreen] === ADMIN SOLICITA VER CLASIFICACIÓN ===');
    console.log('📊 [MultiplayerGameScreen] Pregunta actual:', currentQuestionIndex);
    console.log('📊 [MultiplayerGameScreen] Total preguntas:', game?.questions?.length || 0);
    console.log('📊 [MultiplayerGameScreen] ¿Es última pregunta?', currentQuestionIndex >= (game?.questions?.length - 1));
    
    if (isHost && socket) {
      const currentLeaderboard = calculateLeaderboard();
      console.log('📊 [MultiplayerGameScreen] Enviando comando show-classification...');
      socket.emit('show-classification-command', {
        gameId,
        lobbyCode,
        questionIndex: currentQuestionIndex,
        leaderboard: currentLeaderboard
      });
    }
    setShowAnswerStats(false);
    setGameState('leaderboard');
    setLeaderboard(calculateLeaderboard());
  };

  const handleBackToLobby = () => {
    // Si es host, enviar comando de finalización antes de navegar
    if (isHost && socket) {
      socket.emit('game-finished-command', {
        gameId,
        lobbyCode
      });
    }
    
    if (user) {
      navigate('/user-games');
    } else {
      navigate('/login');
    }
  };

  const handlePlayAgain = () => {
    // Si es host, enviar comando de finalización antes de navegar
    if (isHost && socket) {
      socket.emit('game-finished-command', {
        gameId,
        lobbyCode
      });
    }
    
    // Volver al lobby multijugador para crear un nuevo juego
    navigate(`/multiplayer-lobby/${gameId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando juego multijugador...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-pink-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar el juego</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleBackToLobby} className="bg-red-500 hover:bg-red-600">
            {user ? 'Volver a Mis Juegos' : 'Ir al Login'}
          </Button>
        </div>
      </div>
    );
  }

  // NUEVO: Mensaje temporal cuando el admin finaliza el juego
  if (gameFinishedByAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-100 to-orange-100 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-8 text-center">
            <div className="text-6xl mb-4">🏁</div>
            <h1 className="text-4xl font-bold mb-4">Juego Finalizado</h1>
            <p className="text-xl mb-4">El administrador ha finalizado el juego</p>
            <div className="flex items-center justify-center space-x-2 text-lg">
              <span>Redirigiendo a resultados</span>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600">Serás redirigido automáticamente a la pantalla de resultados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameFinished) {
    const finalLeaderboard = calculateLeaderboard(); // Siempre usar calculateLeaderboard que filtra al admin
    const podium = finalLeaderboard.slice(0, 3);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-8 text-center">
            <h1 className="text-4xl font-bold mb-4">� ¡Juego Completado!</h1>
            <p className="text-xl">Podio Final</p>
          </div>
          
          {/* Podio de 3 puestos */}
          <div className="p-8">
            <div className="flex justify-center items-end gap-8 mb-8">
              {/* Segundo puesto */}
              {podium[1] && (
                <div className="text-center">
                  <div className="bg-gray-300 rounded-lg p-6 mb-4 relative">
                    <div className="text-6xl mb-2">🥈</div>
                    <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700">{podium[1].name}</h3>
                  <p className="text-lg text-gray-600">{podium[1].score} puntos</p>
                </div>
              )}
              
              {/* Primer puesto */}
              {podium[0] && (
                <div className="text-center">
                  <div className="bg-yellow-400 rounded-lg p-8 mb-4 relative transform scale-110">
                    <div className="text-8xl mb-2">🥇</div>
                    <div className="absolute -top-3 -right-3 bg-yellow-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">1</div>
                  </div>
                  <h3 className="text-2xl font-bold text-yellow-600">{podium[0].name}</h3>
                  <p className="text-xl text-yellow-700">{podium[0].score} puntos</p>
                  <div className="text-sm text-yellow-600 mt-1">¡Campeón!</div>
                </div>
              )}
              
              {/* Tercer puesto */}
              {podium[2] && (
                <div className="text-center">
                  <div className="bg-orange-300 rounded-lg p-6 mb-4 relative">
                    <div className="text-6xl mb-2">🥉</div>
                    <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">3</div>
                  </div>
                  <h3 className="text-xl font-bold text-orange-600">{podium[2].name}</h3>
                  <p className="text-lg text-orange-500">{podium[2].score} puntos</p>
                </div>
              )}
            </div>
            
            {/* Mensaje cuando no hay jugadores en el podio */}
            {finalLeaderboard.length === 0 && (
              <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-xl font-bold text-yellow-700 mb-2">¡Esperando Jugadores!</h3>
                <p className="text-yellow-600">No hubo participantes en este juego.</p>
              </div>
            )}
            
            {/* Clasificación completa */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-center mb-4 text-gray-700">Clasificación Final</h3>
              {finalLeaderboard.length > 0 ? (
                <div className="space-y-2">
                  {finalLeaderboard.map((player, index) => (
                    <div key={player.id} className={`flex justify-between items-center p-3 rounded-lg ${
                      index < 3 ? 'bg-gradient-to-r from-yellow-100 to-orange-100' : 'bg-white'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-400 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-semibold">{player.name}</span>
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Jugador</span>
                      </div>
                      <span className="font-bold text-lg">{player.score} pts</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-3xl mb-3">👥</div>
                  <p className="text-gray-500">No hay jugadores en la clasificación</p>
                  <p className="text-sm text-gray-400 mt-1">Solo participó el administrador del juego</p>
                </div>
              )}
            </div>
            
            <div className="text-center mt-8">
              {isHost ? (
                <div className="space-y-4">
                  <Button 
                    onClick={handlePlayAgain} 
                    className="bg-green-500 hover:bg-green-600 mr-4"
                  >
                    🎮 Jugar de Nuevo
                  </Button>
                  <Button 
                    onClick={handleBackToLobby} 
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    📝 Ver Otros Juegos
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="text-6xl mb-4">🙏</div>
                  <h3 className="text-2xl font-bold mb-4">¡Gracias por Participar!</h3>
                  <p className="text-gray-600 mb-6">Esperamos que hayas disfrutado el juego</p>
                  <p className="text-sm text-gray-500 mb-4">Serás redirigido al login en <span className="font-semibold">5 segundos</span>...</p>
                  <Button 
                    onClick={() => navigate('/login')} 
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    🌟 Ir al Login Ahora
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Validar que tenemos preguntas
  if (!game.questions || game.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">No hay preguntas disponibles</h2>
          <Button onClick={handleBackToLobby} className="bg-yellow-500 hover:bg-yellow-600">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = game.questions[currentQuestionIndex];
  
  // IDs del jugador actual (consistentes usando useState)
  const currentPlayerId = playerId;
  const currentPlayerName = playerName;

  // DEBUG: Log para rastrear el renderizado
  console.log('🎨 [MultiplayerGameScreen] === EVALUANDO RENDERIZADO ===');
  console.log('🎨 [MultiplayerGameScreen] gameState:', gameState);
  console.log('🎨 [MultiplayerGameScreen] showAnswerStats:', showAnswerStats);
  console.log('🎨 [MultiplayerGameScreen] game existe:', !!game);
  console.log('🎨 [MultiplayerGameScreen] game.questions existe:', !!(game && game.questions));
  console.log('🎨 [MultiplayerGameScreen] currentQuestion existe:', !!currentQuestion);
  console.log('🎨 [MultiplayerGameScreen] answerStatistics length:', answerStatistics.length);

  // Pantalla de estadísticas de respuestas (cuando hideResults está activado)
  if (gameState === 'answer-stats' || showAnswerStats) {
    console.log('🎨 [MultiplayerGameScreen] === RENDERIZANDO PANTALLA DE ESTADÍSTICAS ===');
    
    // Verificaciones de seguridad
    if (!game || !game.questions || !currentQuestion) {
      console.log('⚠️ [MultiplayerGameScreen] Faltan datos del juego, usando pantalla de carga...');
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando estadísticas...</p>
            <p className="text-slate-400 text-sm mt-2">gameState: {gameState}</p>
          </div>
        </div>
      );
    }

    // Si no hay respuestas, verificar si las tenemos que crear por defecto
    // El backend envía 'options' pero el componente espera 'answers'
    const questionAnswers = currentQuestion.answers || currentQuestion.options;
    if (!questionAnswers || !Array.isArray(questionAnswers)) {
      console.log('⚠️ [MultiplayerGameScreen] currentQuestion.answers/options no válido:', { 
        answers: currentQuestion.answers, 
        options: currentQuestion.options 
      });
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <p className="text-slate-600">Error al cargar las respuestas de la pregunta</p>
            <p className="text-slate-400 text-sm mt-2">currentQuestionIndex: {currentQuestionIndex}</p>
          </div>
        </div>
      );
    }

    console.log('✅ [MultiplayerGameScreen] Todos los datos válidos, renderizando estadísticas...');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
        {/* Botón Ver Clasificación - Solo para admin */}
        {isHost && (
          <div className="fixed top-6 right-6 z-50">
            <Button 
              onClick={handleShowClassification}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg border-0 font-semibold text-sm transition-all duration-300 transform hover:scale-105"
            >
              📊 Ver Clasificación
            </Button>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <div className="text-6xl mb-4">📊</div>
                <h1 className="text-4xl font-bold mb-2">Resultados de la Pregunta</h1>
                <p className="text-xl opacity-90">
                  Pregunta {currentQuestionIndex + 1} de {game.questions.length}
                </p>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-8">
              {/* Pregunta */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Estadísticas de respuestas */}
              <div className="space-y-4">
                {questionAnswers.map((answer, index) => {
                  const answerStat = answerStatistics && Array.isArray(answerStatistics) 
                    ? answerStatistics.find(stat => stat.answerIndex === index) || { count: 0, percentage: 0 }
                    : { count: 0, percentage: 0 };
                  const isCorrect = index === correctAnswerIndex;
                  
                  return (
                    <div 
                      key={index}
                      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        isCorrect 
                          ? 'border-green-400 bg-green-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                        {/* Barra de progreso de fondo */}
                        <div 
                          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${
                            isCorrect ? 'bg-green-200' : 'bg-blue-200'
                          }`}
                          style={{ width: `${answerStat.percentage}%` }}
                        ></div>
                        
                        {/* Contenido */}
                        <div className="relative z-10 p-6 flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            {/* Indicador de respuesta correcta - siempre mostrar en estadísticas */}
                            {isCorrect && (
                              <div className="text-2xl">
                                ✅
                              </div>
                            )}
                            
                            {/* Texto de la respuesta */}
                            <div className={`font-semibold text-lg ${
                              isCorrect ? 'text-green-800' : 'text-gray-800'
                            }`}>
                              {answer}
                            </div>
                          </div>
                          
                          {/* Estadísticas */}
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              isCorrect ? 'text-green-700' : 'text-gray-700'
                            }`}>
                              {answerStat.count}
                            </div>
                            <div className={`text-sm ${
                              isCorrect ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {answerStat.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Información adicional */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="text-center">
                  <div className="text-blue-800 font-semibold text-lg mb-2">
                    📈 Resumen de Respuestas
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-blue-600">
                        {answerStatistics && Array.isArray(answerStatistics) 
                          ? answerStatistics.reduce((total, stat) => total + stat.count, 0)
                          : 0
                        }
                      </div>
                      <div className="text-sm text-gray-600">Total de respuestas</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="text-2xl font-bold text-green-600">
                        {answerStatistics && Array.isArray(answerStatistics) 
                          ? (answerStatistics.find(stat => stat.answerIndex === correctAnswerIndex)?.count || 0)
                          : 0
                        }
                      </div>
                      <div className="text-sm text-gray-600">Respuestas correctas</div>
                    </div>
                  </div>
                  
                  {!isHost && (
                    <div className="mt-4 text-blue-700">
                      ⏳ Esperando que el host muestre la clasificación...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de tabla de clasificación entre preguntas
  if (gameState === 'leaderboard') {
    const currentLeaderboard = leaderboard.length > 0 ? leaderboard : calculateLeaderboard();
    
    console.log('📊 [MultiplayerGameScreen] === RENDERIZANDO LEADERBOARD ===');
    console.log('📊 [MultiplayerGameScreen] CurrentLeaderboard:', currentLeaderboard);
    console.log('📊 [MultiplayerGameScreen] Jugadores originales:', players);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
        {/* Botón Siguiente Pregunta - Esquina superior derecha */}
        {isHost && (
          <div className="fixed top-6 right-6 z-50">
            <Button 
              onClick={handleNextQuestion}
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg border-0 font-semibold text-sm transition-all duration-300 transform hover:scale-105"
            >
              {currentQuestionIndex < game.questions.length - 1 ? 
                '⏭️ Siguiente Pregunta' : 
                '🏁 Finalizar Juego'
              }
            </Button>
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Contenedor principal unificado */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Header elegante */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <h1 className="text-4xl font-bold mb-2">Clasificación</h1>
                <p className="text-xl opacity-90">
                  Pregunta {currentQuestionIndex + 1} de {game.questions.length}
                </p>
                <div className="flex justify-center items-center mt-4 space-x-4">
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    👥 {currentLeaderboard.length} Jugadores
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido de la clasificación */}
            <div className="p-8">
              {/* Tabla de clasificación con diseño profesional */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                  🏆 Clasificación Actual
                </h2>
                
                {currentLeaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {currentLeaderboard.map((player, index) => (
                      <div 
                        key={player.id} 
                        className={`flex justify-between items-center p-6 rounded-2xl transition-all duration-300 transform hover:scale-102 ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-200 border-2 border-yellow-500 shadow-lg' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-100 border-2 border-gray-400 shadow-md' :
                          index === 2 ? 'bg-gradient-to-r from-orange-300 via-orange-200 to-orange-100 border-2 border-orange-400 shadow-md' :
                          'bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          {/* Corona para el primer lugar */}
                          {index === 0 && (
                            <div className="text-4xl animate-pulse">
                              👑
                            </div>
                          )}
                          
                          {/* Posición */}
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-400 text-white' :
                            'bg-indigo-500 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          
                          {/* Información del jugador */}
                          <div>
                            <div className="font-bold text-xl text-gray-800">{player.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                                🎮 Jugador
                              </span>
                              {index < 3 && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                  index === 1 ? 'bg-gray-100 text-gray-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {index === 0 ? '🥇 Oro' : index === 1 ? '🥈 Plata' : '🥉 Bronce'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Puntuación */}
                        <div className="text-right">
                          <div className="font-bold text-3xl text-gray-800">{player.score}</div>
                          <div className="text-sm text-gray-600 font-medium">puntos</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <div className="text-8xl mb-6">🎮</div>
                    <h3 className="text-2xl font-bold text-gray-700 mb-4">Sin jugadores participantes</h3>
                    <p className="text-gray-500 text-lg">Esperando que se unan jugadores al juego...</p>
                    <div className="mt-6 inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-medium">
                      👥 Total conectados: {players.length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-screen h-screen bg-gray-100 p-0 m-0" style={{ backgroundColor: styles.containerBg, backgroundImage: styles.containerBgImage ? `url(${styles.containerBgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Contenedor principal del juego - pantalla completa */}
      <div className="w-full h-full relative" style={{ minHeight: '100vh', backgroundColor: styles.containerBg, backgroundImage: styles.containerBgImage ? `url(${styles.containerBgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {/* Timer */}
        <div className="absolute top-6 right-6 z-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg" style={{ backgroundColor: styles.timerBg, color: styles.timerTextColor }}>
            {countdown}
          </div>
        </div>

        {/* Pregunta */}
        <div className="pt-20 pb-8 px-8 text-center">
          <h2 className="text-4xl font-bold" style={{ color: styles.questionText }}>
            {currentQuestion.question}
          </h2>
        </div>

        {/* Imagen - Universal o específica */}
        <div className="flex justify-center mb-8">
          <div className="question-image-dropzone" style={{ width: '1000px', height: '490px', background: 'transparent', overflow: 'hidden', border: 'none', padding: '0' }}>
            <div className="relative w-full h-full flex items-center justify-center">
              <img 
                src={currentQuestion.image_url ? 
                  `http://localhost:5003${currentQuestion.image_url}` : 
                  '/images/universal-question.svg'
                } 
                alt="Pregunta" 
                className="question-image-preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  background: 'transparent'
                }}
                onError={(e) => {
                  console.log('❌ [MultiplayerGameScreen] Error cargando imagen:', e.target.src);
                  // Fallback: mostrar una imagen de data URL como último recurso
                  e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 490" width="1000" height="490">
                      <rect width="1000" height="490" fill="#ffffff" stroke="#3b82f6" stroke-width="4" rx="12"/>
                      <circle cx="500" cy="245" r="60" fill="#3b82f6"/>
                      <text x="500" y="265" text-anchor="middle" font-size="80" fill="white" font-family="Arial">?</text>
                      <text x="500" y="350" text-anchor="middle" font-size="24" fill="#3b82f6" font-family="Arial">Pregunta de Quiz</text>
                    </svg>
                  `);
                }}
              />
            </div>
          </div>
        </div>

        {/* Respuestas */}
        <div className="px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-full mx-auto">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correct_answer;
              
              let buttonStyle = { 
                borderRadius: `${styles.buttonRadius}px`, 
                backgroundColor: styles.answerBg, 
                color: styles.answerTextColor, 
                border: '2px solid transparent',
                padding: '30px 40px',
                fontSize: '20px',
                fontWeight: '500',
                minHeight: '80px',
                width: '100%'
              };

              if (isAnswered) {
                console.log('🎨 [MultiplayerGameScreen] === APLICANDO COLORES DE RESPUESTA ===');
                console.log('🎨 [MultiplayerGameScreen] Respuesta:', option);
                console.log('🎨 [MultiplayerGameScreen] isCorrect:', isCorrect);
                console.log('🎨 [MultiplayerGameScreen] isSelected:', isSelected);
                console.log('🎨 [MultiplayerGameScreen] gameSettings.showCorrectAnswers:', gameSettings.showCorrectAnswers);
                console.log('🎨 [MultiplayerGameScreen] gameSettings completos:', gameSettings);
                
                // Solo mostrar respuesta correcta si está habilitado en configuraciones
                if (gameSettings.showCorrectAnswers && isCorrect) {
                  console.log('🎨 [MultiplayerGameScreen] ✅ Aplicando color VERDE para respuesta correcta');
                  buttonStyle = { ...buttonStyle, backgroundColor: '#22c55e', color: 'white', borderColor: '#16a34a' };
                } else if (isSelected) {
                  // Mostrar respuesta seleccionada
                  if (gameSettings.showCorrectAnswers) {
                    console.log('🎨 [MultiplayerGameScreen] 📍 Mostrando respuesta seleccionada con colores verde/rojo');
                    // Si se muestran respuestas correctas, usar rojo para incorrecta y verde para correcta
                    buttonStyle = { ...buttonStyle, 
                      backgroundColor: isCorrect ? '#22c55e' : '#ef4444', 
                      color: 'white', 
                      borderColor: isCorrect ? '#16a34a' : '#dc2626' 
                    };
                  } else {
                    console.log('🎨 [MultiplayerGameScreen] 🔵 Mostrando respuesta seleccionada con color AZUL (respuestas ocultas)');
                    // Si no se muestran respuestas correctas, usar azul para indicar selección
                    buttonStyle = { ...buttonStyle, backgroundColor: '#3b82f6', color: 'white', borderColor: '#2563eb' };
                  }
                } else {
                  buttonStyle = { ...buttonStyle, opacity: 0.6 };
                }
              } else if (isHost) {
                buttonStyle = { ...buttonStyle, backgroundColor: '#e5e7eb', color: '#6b7280', cursor: 'not-allowed' };
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  disabled={isAnswered || gameState !== 'playing'}
                  className="w-full text-left transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center"
                  style={buttonStyle}
                  title=""
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de control para el host - posicionado de forma elegante */}
        {isHost && isAnswered && gameState === 'playing' && (
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-white bg-opacity-90 rounded-xl shadow-2xl p-4 text-center backdrop-blur-sm">
              <div className="space-x-4">
                <Button 
                  onClick={handleShowLeaderboard}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-semibold rounded-lg"
                >
                  📊 Ver Clasificación
                </Button>
                <Button 
                  onClick={handleNextQuestion}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 text-sm font-semibold rounded-lg"
                >
                  {currentQuestionIndex < game.questions.length - 1 ? 
                    '⏭️ Siguiente' : 
                    '🏁 Finalizar'
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiplayerGameScreen;