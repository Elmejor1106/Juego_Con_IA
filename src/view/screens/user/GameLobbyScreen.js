import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GameViewModel from '../../../viewModel/game/GameViewModel';
import Button from '../../components/common/Button';
import { Copy, Users, Play, Settings, Share } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useSocket from '../../../hooks/useSocket';
import GameSettingsModal from '../../components/game/GameSettingsModal';

const GameLobbyScreen = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [lobbyCode, setLobbyCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [kickedInfo, setKickedInfo] = useState(null); // Para manejar modal de expulsión
  
  // Configuraciones del juego
  const [gameSettings, setGameSettings] = useState({
    maxPlayers: 6,
    timePerQuestion: 30, // en segundos
    showCorrectAnswers: true
  });

  // URL para invitados - usar el puerto natural del navegador (3001)
  const gameUrl = `http://localhost:3001/join-game/${gameId}/${lobbyCode}`;

  useEffect(() => {
    // Generar código de lobby único
    const generateLobbyCode = () => {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    };
    setLobbyCode(generateLobbyCode());
  }, []);

  useEffect(() => {
    if (socket && lobbyCode && user) {
      console.log('🎮 [GameLobbyScreen] Configurando eventos WebSocket...');
      console.log('🎮 [GameLobbyScreen] Socket:', socket.connected ? 'CONECTADO' : 'DESCONECTADO');
      console.log('🎮 [GameLobbyScreen] Lobby Code:', lobbyCode);
      console.log('🎮 [GameLobbyScreen] User:', user);

      // Configurar eventos de socket
      socket.on('lobby-updated', (data) => {
        console.log('📨 [GameLobbyScreen] Evento lobby-updated recibido:', data);
        console.log('📨 [GameLobbyScreen] Jugadores antes:', players);
        setPlayers(data.players);
        console.log('📨 [GameLobbyScreen] Jugadores después:', data.players);
      });

      socket.on('join-success', (data) => {
        console.log('✅ [GameLobbyScreen] Evento join-success recibido:', data);
        setIsHost(data.isHost);
      });

      socket.on('game-started', (data) => {
        console.log('🚀 [GameLobbyScreen] === EVENTO GAME-STARTED RECIBIDO ===');
        console.log('🚀 [GameLobbyScreen] Data recibida:', data);
        console.log('🚀 [GameLobbyScreen] Usuario actual:', user?.username);
        console.log('🚀 [GameLobbyScreen] Es host:', isHost);
        console.log('🚀 [GameLobbyScreen] URL destino:', `/multiplayer-game/${data.gameId}/${data.lobbyCode}`);
        
        try {
          navigate(`/multiplayer-game/${data.gameId}/${data.lobbyCode}`);
          console.log('✅ [GameLobbyScreen] Navegación ejecutada exitosamente');
        } catch (error) {
          console.error('❌ [GameLobbyScreen] Error en navegación:', error);
        }
      });

      socket.on('settings-updated', (data) => {
        console.log('⚙️ [GameLobbyScreen] === CONFIGURACIONES ACTUALIZADAS ===');
        console.log('⚙️ [GameLobbyScreen] Nuevas configuraciones:', data.settings);
        setGameSettings(data.settings);
        console.log('⚙️ [GameLobbyScreen] Configuraciones aplicadas localmente');
      });

      socket.on('player-kicked', (data) => {
        console.log('🚫 [GameLobbyScreen] === JUGADOR EXPULSADO ===');
        console.log('🚫 [GameLobbyScreen] Mensaje:', data.message);
        console.log('🚫 [GameLobbyScreen] Razón:', data.reason);
        
        // Establecer información de expulsión para mostrar modal
        setKickedInfo({
          message: data.message,
          reason: data.reason
        });
        
        // Limpiar el lobby inmediatamente
        setPlayers([]);
        setIsHost(false);
        
        // Desconectar completamente del socket para evitar que reciba más eventos
        if (socket) {
          socket.disconnect();
          console.log('🚫 [GameLobbyScreen] Socket desconectado completamente');
        }
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          console.log('🚫 [GameLobbyScreen] Redirigiendo al login...');
          navigate('/login');
        }, 3000);
      });

      // Unirse al lobby como host
      const joinData = {
        gameId,
        lobbyCode,
        playerName: user.username,
        playerId: user.id
      };
      console.log('🔗 [GameLobbyScreen] Enviando join-lobby:', joinData);
      socket.emit('join-lobby', joinData);

      return () => {
        console.log('🧹 [GameLobbyScreen] Limpiando eventos WebSocket');
        socket.off('lobby-updated');
        socket.off('join-success');
        socket.off('game-started');
        socket.off('settings-updated');
        socket.off('player-kicked');
      };
    } else {
      console.log('❌ [GameLobbyScreen] Falta información para WebSocket:', {
        socket: !!socket,
        lobbyCode: !!lobbyCode,
        user: !!user
      });
    }
  }, [socket, lobbyCode, user, gameId, navigate]);

  useEffect(() => {
    const fetchGame = async () => {
      setLoading(true);
      try {
        const result = await GameViewModel.getGameById(gameId);
        if (result.success) {
          setGame(result.game);
          // Los jugadores ahora se manejan a través de WebSocket
        } else {
          setError(result.error || 'No se pudo cargar el juego.');
        }
      } catch (err) {
        setError(err.message || 'Ocurrió un error al buscar el juego.');
      } finally {
        setLoading(false);
      }
    };

    if (user && gameId) {
      fetchGame();
    }
  }, [gameId, user]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // TODO: Mostrar toast de confirmación
      alert('¡Enlace copiado al portapapeles!');
    });
  };

  const startGame = () => {
    console.log('🚀 [GameLobbyScreen] === INTENTANDO INICIAR JUEGO ===');
    console.log('🚀 [GameLobbyScreen] Jugadores actuales:', players.length);
    console.log('🚀 [GameLobbyScreen] Lista de jugadores:', players);
    console.log('🚀 [GameLobbyScreen] Socket disponible:', !!socket);
    console.log('🚀 [GameLobbyScreen] Es host:', isHost);
    console.log('🚀 [GameLobbyScreen] GameId:', gameId);
    console.log('🚀 [GameLobbyScreen] LobbyCode:', lobbyCode);
    
    if (players.length < 2) {
      console.log('❌ [GameLobbyScreen] Insuficientes jugadores');
      alert('Necesitas al menos 2 jugadores para iniciar el juego.');
      return;
    }

    if (players.length > gameSettings.maxPlayers) {
      console.log('❌ [GameLobbyScreen] Demasiados jugadores');
      alert(`Hay demasiados jugadores. Máximo permitido: ${gameSettings.maxPlayers}`);
      return;
    }
    
    if (socket && isHost) {
      const lobbyKey = `${gameId}-${lobbyCode}`;
      console.log('📡 [GameLobbyScreen] === ENVIANDO START-GAME ===');
      console.log('📡 [GameLobbyScreen] LobbyKey:', lobbyKey);
      console.log('📡 [GameLobbyScreen] Socket conectado:', socket.connected);
      console.log('📡 [GameLobbyScreen] Socket ID:', socket.id);
      
      // Marcar este usuario como host para después
      localStorage.setItem('hostGameId', gameId);
      localStorage.setItem('hostUserId', user.id);
      console.log('💾 [GameLobbyScreen] Host guardado en localStorage:', { gameId, userId: user.id });
      
      console.log('📡 [CONFIGURACIÓN] *** ENVIANDO CONFIGURACIONES AL BACKEND ***');
      console.log('📡 [CONFIGURACIÓN] GameId:', gameId);
      console.log('📡 [CONFIGURACIÓN] LobbyCode:', lobbyCode);
      console.log('📡 [CONFIGURACIÓN] GameSettings completas:', JSON.stringify(gameSettings, null, 2));
      console.log('📡 [CONFIGURACIÓN] maxPlayers:', gameSettings.maxPlayers);
      console.log('📡 [CONFIGURACIÓN] timePerQuestion:', gameSettings.timePerQuestion);
      console.log('📡 [CONFIGURACIÓN] showCorrectAnswers:', gameSettings.showCorrectAnswers);
      
      socket.emit('start-game', {
        gameId: gameId,
        lobbyCode: lobbyCode,
        gameSettings: gameSettings // Enviar configuraciones al servidor
      });
      
      console.log('📡 [CONFIGURACIÓN] ✅ EVENTO start-game ENVIADO AL BACKEND');
      
      // Redirigir al admin inmediatamente también
      console.log('🎯 [GameLobbyScreen] === NAVEGACIÓN INMEDIATA DEL ADMIN ===');
      setTimeout(() => {
        console.log('🎯 [GameLobbyScreen] Ejecutando setTimeout para admin');
        console.log('🎯 [GameLobbyScreen] URL destino:', `/multiplayer-game/${gameId}/${lobbyCode}`);
        try {
          navigate(`/multiplayer-game/${gameId}/${lobbyCode}`);
          console.log('✅ [GameLobbyScreen] Admin navegado exitosamente vía setTimeout');
        } catch (error) {
          console.error('❌ [GameLobbyScreen] Error en navegación del admin:', error);
        }
      }, 500); // Pequeño delay para que el evento WebSocket llegue primero
      
    } else {
      console.log('❌ [GameLobbyScreen] === NO SE PUEDE INICIAR ===');
      console.log('❌ [GameLobbyScreen] Socket disponible:', !!socket);
      console.log('❌ [GameLobbyScreen] Socket conectado:', socket?.connected);
      console.log('❌ [GameLobbyScreen] Es host:', isHost);
    }
  };

  const removePlayer = (playerId) => {
    console.log('🚫 [GameLobbyScreen] === REMOVIENDO JUGADOR ===');
    console.log('🚫 [GameLobbyScreen] Player ID a remover:', playerId);
    console.log('🚫 [GameLobbyScreen] Es host:', isHost);
    console.log('🚫 [GameLobbyScreen] Socket disponible:', !!socket);
    
    if (playerId !== user.id && socket && isHost) {
      console.log('🚫 [GameLobbyScreen] Enviando comando kick-player...');
      
      socket.emit('kick-player', {
        gameId,
        lobbyCode,
        playerIdToKick: playerId
      });
      
      console.log('🚫 [GameLobbyScreen] ✅ Comando kick-player enviado');
    } else {
      console.log('🚫 [GameLobbyScreen] ❌ No se puede remover jugador - condiciones no cumplidas');
    }
  };

  const handleSettingsChange = (newSettings) => {
    setGameSettings(newSettings);
  };

  const handleSaveSettings = (settings) => {
    console.log('💾 [GameLobbyScreen] Guardando configuraciones:', settings);
    setGameSettings(settings);
    
    // Enviar configuraciones actualizadas a través de WebSocket
    if (socket && isHost) {
      socket.emit('update-game-settings', {
        lobbyKey: `${gameId}-${lobbyCode}`,
        settings: settings
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-slate-500">Preparando lobby...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Juego no encontrado'}</p>
          <Button onClick={() => navigate('/user-games')} className="bg-slate-500 hover:bg-slate-600">
            Volver a Mis Juegos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{game.title}</h1>
              <p className="text-slate-600 mt-1">{game.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-medium">
                  {game.questions?.length || 0} preguntas
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-slate-500 hover:bg-slate-600 p-3"
              >
                <Settings size={20} />
              </Button>
              <Button onClick={() => navigate('/user-games')} className="bg-slate-500 hover:bg-slate-600">
                Cancelar
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de invitación */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Share className="text-sky-500" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Invitar Jugadores</h2>
            </div>

            {/* QR Code */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-4">
              <div className="w-48 h-48 mx-auto bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center p-4">
                <QRCodeSVG 
                  value={gameUrl} 
                  size={180}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-slate-500 text-sm mt-2">Escanea para unirte</p>
            </div>

            {/* Enlace de invitación */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Enlace de invitación:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={gameUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                />
                <Button
                  onClick={() => copyToClipboard(gameUrl)}
                  className="bg-sky-500 hover:bg-sky-600 px-4"
                >
                  <Copy size={16} />
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Comparte este enlace para que otros jugadores se unan
              </p>
            </div>
          </div>

          {/* Panel de jugadores */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Users className="text-green-500" size={24} />
                <h2 className="text-xl font-bold text-slate-800">
                  Jugadores ({players.length}/{gameSettings.maxPlayers})
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">En línea</span>
              </div>
            </div>

            {/* Lista de jugadores */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      player.isHost ? 'bg-yellow-500' : 'bg-sky-500'
                    }`}>
                      {player.isHost ? '👑' : index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {player.username}
                        {player.isHost && ' (Host)'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {player.ready ? '✅ Listo' : '⏳ Esperando...'}
                      </p>
                    </div>
                  </div>
                  {!player.isHost && (
                    <Button
                      onClick={() => removePlayer(player.id)}
                      className="bg-red-500 hover:bg-red-600 px-3 py-1 text-sm"
                    >
                      Remover
                    </Button>
                  )}
                </div>
              ))}

              {/* Slots vacíos */}
              {Array.from({ length: gameSettings.maxPlayers - players.length }, (_, i) => (
                <div key={`empty-${i}`} className="flex items-center p-3 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                  <div className="w-10 h-10 rounded-full bg-slate-300 flex items-center justify-center">
                    <span className="text-slate-500 text-sm">{players.length + i + 1}</span>
                  </div>
                  <p className="ml-3 text-slate-400">Esperando jugador...</p>
                </div>
              ))}
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Los jugadores pueden unirse escaneando el QR o usando el enlace
              </p>
            </div>
          </div>
        </div>

        {/* Panel de control */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">¿Listos para jugar?</h3>
              <p className="text-slate-600">
                Mínimo 2 jugadores requeridos. Máximo {gameSettings.maxPlayers} jugadores.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={startGame}
                disabled={players.length < 2}
                className={`px-8 py-3 text-lg font-bold flex items-center space-x-2 ${
                  players.length >= 2
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                <Play size={20} />
                <span>Empezar Juego</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuraciones */}
      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={gameSettings}
        onSettingsChange={handleSettingsChange}
        onSave={handleSaveSettings}
        isHost={isHost}
      />

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
                  Serás redirigido al login en unos segundos...
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="bg-blue-500 hover:bg-blue-600 w-full"
              >
                Ir al Login Ahora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameLobbyScreen;