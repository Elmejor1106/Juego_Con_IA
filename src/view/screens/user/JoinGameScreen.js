import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Users, GamepadIcon, Loader } from 'lucide-react';
import useSocket from '../../../hooks/useSocket';

const JoinGameScreen = () => {
  const { gameId, lobbyCode } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [waitingForStart, setWaitingForStart] = useState(false);
  const [playersInLobby, setPlayersInLobby] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [kickedInfo, setKickedInfo] = useState(null); // Para manejar modal de expulsión

  useEffect(() => {
    if (socket) {
      console.log('🎮 [JoinGameScreen] Configurando eventos WebSocket...');
      console.log('🎮 [JoinGameScreen] Socket:', socket.connected ? 'CONECTADO' : 'DESCONECTADO');

      // Configurar eventos de socket
      socket.on('lobby-updated', (data) => {
        console.log('📨 [JoinGameScreen] Evento lobby-updated recibido:', data);
        console.log('📨 [JoinGameScreen] Jugadores antes:', playersInLobby);
        setPlayersInLobby(data.players);
        console.log('📨 [JoinGameScreen] Jugadores después:', data.players);
      });

      socket.on('join-success', (data) => {
        console.log('✅ [JoinGameScreen] Evento join-success recibido:', data);
        setPlayerId(data.playerId);
        
        // Actualizar AMBOS storages con el playerId del servidor si es diferente
        if (data.playerId) {
          sessionStorage.setItem('guestPlayerId', data.playerId);
          sessionStorage.setItem('windowPlayerId', data.playerId);
          localStorage.setItem('guestPlayerId', data.playerId);
          console.log('💾 [JoinGameScreen] Actualizando guestPlayerId en sessionStorage y localStorage:', data.playerId);
        }
        
        setJoined(true);
        setWaitingForStart(true);
        setIsJoining(false);
      });

      socket.on('join-error', (data) => {
        console.log('❌ [JoinGameScreen] Evento join-error recibido:', data);
        alert(data.message || 'Error al unirse al lobby');
        setIsJoining(false);
      });

      socket.on('player-kicked', (data) => {
        console.log('🚫 [JoinGameScreen] === JUGADOR EXPULSADO ===');
        console.log('🚫 [JoinGameScreen] Mensaje:', data.message);
        console.log('🚫 [JoinGameScreen] Razón:', data.reason);
        
        // Establecer información de expulsión para mostrar modal
        setKickedInfo({
          message: data.message,
          reason: data.reason
        });
        
        // Limpiar estados del juego inmediatamente
        setPlayersInLobby([]);
        setJoined(false);
        setWaitingForStart(false);
        
        // Desconectar completamente del socket para evitar que reciba más eventos
        if (socket) {
          socket.disconnect();
          console.log('🚫 [JoinGameScreen] Socket desconectado completamente');
        }
        
        // Redirigir al inicio después de 3 segundos
        setTimeout(() => {
          console.log('🚫 [JoinGameScreen] Redirigiendo al inicio...');
          navigate('/');
        }, 3000);
      });

      socket.on('game-started', (data) => {
        console.log('🚀 [JoinGameScreen] === EVENTO GAME-STARTED RECIBIDO ===');
        console.log('🚀 [JoinGameScreen] Data recibida:', data);
        console.log('🚀 [JoinGameScreen] Player Name actual:', playerName);
        console.log('🚀 [JoinGameScreen] Player ID actual:', playerId);
        console.log('🚀 [JoinGameScreen] URL destino:', `/multiplayer-game/${data.gameId}/${data.lobbyCode}`);
        
        // Verificar AMBOS storages antes de navegar
        console.log('💾 [JoinGameScreen] Storages antes de navegar:', {
          sessionStorage: {
            guestPlayerName: sessionStorage.getItem('guestPlayerName'),
            guestPlayerId: sessionStorage.getItem('guestPlayerId'),
            windowPlayerId: sessionStorage.getItem('windowPlayerId')
          },
          localStorage: {
            guestPlayerName: localStorage.getItem('guestPlayerName'),
            guestPlayerId: localStorage.getItem('guestPlayerId')
          }
        });
        
        navigate(`/multiplayer-game/${data.gameId}/${data.lobbyCode}`);
        console.log('✅ [JoinGameScreen] Navegación ejecutada');
      });

      return () => {
        console.log('🧹 [JoinGameScreen] Limpiando eventos WebSocket');
        socket.off('lobby-updated');
        socket.off('join-success');
        socket.off('join-error');
        socket.off('player-kicked');
        socket.off('game-started');
      };
    } else {
      console.log('❌ [JoinGameScreen] Socket no disponible');
    }
  }, [socket, navigate]);

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      try {
        // Para invitados, usamos información básica sin autenticación
        const gameInfo = {
          id: gameId,
          title: "Cargando información del juego...",
          template: { name: "Juego Multijugador" },
          questions_count: 5
        };
        
        // Simulamos la carga del juego (en un caso real, esto vendría de un endpoint público)
        setTimeout(() => {
          setGame({
            ...gameInfo,
            title: "Juego de Preguntas Rápidas",
            template: { name: "Juego de Preguntas" }
          });
          setLoading(false);
        }, 500);
        
      } catch (err) {
        setError('Ocurrió un error al buscar el juego.');
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    if (playerName.trim().length < 2) {
      alert('El nombre debe tener al menos 2 caracteres');
      return;
    }

    if (!socket) {
      alert('Error de conexión. Por favor recarga la página.');
      return;
    }

    console.log('🎮 [JoinGameScreen] Intentando unirse al lobby...');
    console.log('🎮 [JoinGameScreen] Socket:', socket.connected ? 'CONECTADO' : 'DESCONECTADO');
    console.log('🎮 [JoinGameScreen] GameId:', gameId);
    console.log('🎮 [JoinGameScreen] LobbyCode:', lobbyCode);
    console.log('🎮 [JoinGameScreen] PlayerName:', playerName.trim());

    setIsJoining(true);
    
    // Generar playerId único por ventana/sesión (usando timestamp + ID de ventana único)
    const windowId = Date.now() + '-' + Math.random().toString(36).substring(2, 8) + '-' + Math.floor(Math.random() * 100000);
    const uniquePlayerId = `guest-${windowId}`;
    
    // Unirse al lobby a través de WebSocket
    const joinData = {
      gameId,
      lobbyCode,
      playerName: playerName.trim(),
      playerId: uniquePlayerId
    };
    
    // Guardar información del jugador en sessionStorage (único por ventana) Y localStorage (como respaldo)
    // sessionStorage es único por pestaña/ventana, localStorage es compartido entre pestañas
    sessionStorage.setItem('guestPlayerName', playerName.trim());
    sessionStorage.setItem('guestPlayerId', joinData.playerId);
    sessionStorage.setItem('windowPlayerId', joinData.playerId); // ID específico de esta ventana
    
    // También en localStorage como respaldo (pero sessionStorage tiene prioridad)
    localStorage.setItem('guestPlayerName', playerName.trim());
    localStorage.setItem('guestPlayerId', joinData.playerId);
    
    console.log('🔗 [JoinGameScreen] Enviando join-lobby:', joinData);
    console.log('💾 [JoinGameScreen] Guardando en sessionStorage (prioridad) y localStorage (respaldo):', {
      guestPlayerName: playerName.trim(),
      guestPlayerId: joinData.playerId,
      windowPlayerId: joinData.playerId
    });
    
    socket.emit('join-lobby', joinData);
  };

  const handleStartGame = () => {
    // TODO: Implementar navegación al juego multijugador
    navigate(`/multiplayer-game/${gameId}/${lobbyCode}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando juego...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-100 to-blue-200">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-red-500 mb-6">{error || 'Juego no encontrado o lobby no válido'}</p>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-slate-500 hover:bg-slate-600"
          >
            Ir al Inicio
          </Button>
        </div>
      </div>
    );
  }

  if (waitingForStart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{game.title}</h1>
            <p className="text-slate-600">{game.description}</p>
            <div className="flex justify-center items-center space-x-2 mt-4">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Código: {lobbyCode}
              </span>
              <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-medium">
                {game.questions?.length || 0} preguntas
              </span>
            </div>
          </div>

          {/* Estado de espera */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Loader className="animate-spin text-sky-500" size={24} />
              <span className="text-lg font-semibold text-slate-700">Esperando que inicie el juego...</span>
            </div>
            <p className="text-slate-500">El host iniciará el juego cuando todos estén listos</p>
          </div>

          {/* Lista de jugadores */}
          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="text-green-500" size={20} />
              <h3 className="font-semibold text-slate-800">Jugadores en el lobby</h3>
            </div>
            <div className="space-y-2">
              {playersInLobby.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-3 p-2 bg-white rounded">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    player.isHost ? 'bg-yellow-500' : 'bg-sky-500'
                  }`}>
                    {player.isHost ? '👑' : index + 1}
                  </div>
                  <span className="font-medium text-slate-700">
                    {player.username}
                    {player.isHost && ' (Host)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Botón de cancelar */}
          <div className="text-center">
            <Button 
              onClick={() => navigate('/')} 
              className="bg-slate-500 hover:bg-slate-600"
            >
              Salir del Lobby
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">¡Únete al Juego!</h1>
          <p className="text-slate-600">{game.title}</p>
        </div>

        {/* Descripción del juego */}
        {game.description && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <p className="text-slate-600 text-center">{game.description}</p>
          </div>
        )}

        {/* Formulario para unirse */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ingresa tu nombre:
            </label>
            <Input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Tu nombre de jugador"
              maxLength={20}
              disabled={isJoining}
              className="w-full"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleJoinGame();
                }
              }}
            />
            <p className="text-xs text-slate-500 mt-1">
              Máximo 20 caracteres. Este será tu nombre en el juego.
            </p>
          </div>

          <Button
            onClick={handleJoinGame}
            disabled={isJoining || !playerName.trim()}
            className={`w-full py-3 text-lg font-semibold flex items-center justify-center space-x-2 ${
              isJoining || !playerName.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isJoining ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Uniéndose...</span>
              </>
            ) : (
              <>
                <GamepadIcon size={20} />
                <span>Unirse al Juego</span>
              </>
            )}
          </Button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700 text-center">
            💡 <strong>Tip:</strong> Asegúrate de tener una buena conexión a internet para la mejor experiencia de juego
          </p>
        </div>

        {/* Link para cancelar */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-700 text-sm underline"
          >
            ← Ir al inicio
          </button>
        </div>
      </div>

      {/* Modal de Expulsión */}
      {kickedInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md mx-4 animate-pulse">
            <div className="text-center">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Expulsado del Lobby</h2>
              <p className="text-gray-700 mb-2">{kickedInfo.message}</p>
              <p className="text-sm text-gray-500 mb-6">
                <strong>Razón:</strong> {kickedInfo.reason}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-700">
                  Serás redirigido al inicio en unos segundos...
                </p>
              </div>
              <Button
                onClick={() => navigate('/')}
                className="bg-blue-500 hover:bg-blue-600 w-full"
              >
                Ir al Inicio Ahora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoinGameScreen;