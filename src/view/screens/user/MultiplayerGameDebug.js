import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const MultiplayerGameDebug = () => {
  const { gameId, lobbyCode } = useParams();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    console.log('🔥 [DEBUGGING] === MULTIPLAYER GAME DEBUG CARGADO ===');
    console.log('🔥 [DEBUGGING] Params:', { gameId, lobbyCode });
    console.log('🔥 [DEBUGGING] User:', user);
    console.log('🔥 [DEBUGGING] URL actual:', window.location.href);
    console.log('🔥 [DEBUGGING] Usuario autenticado:', !!user);
    
    // Determinar si es host basado en referrer o localStorage
    const referrer = document.referrer;
    const isComingFromLobby = referrer.includes('/multiplayer-lobby/');
    const hostGameId = localStorage.getItem('hostGameId');
    const hostUserId = localStorage.getItem('hostUserId');
    const isHost = !!user || isComingFromLobby || (hostGameId === gameId);
    
    const info = {
      referrer,
      isComingFromLobby,
      hostGameId,
      hostUserId,
      currentUserId: user?.id,
      isHost,
      isAuthenticated: !!user,
      username: user?.username || 'Invitado'
    };
    
    setDebugInfo(info);
    
    console.log('🔥 [DEBUGGING] === DETERMINACIÓN DE HOST ===');
    console.log('🔥 [DEBUGGING] Referrer:', referrer);
    console.log('🔥 [DEBUGGING] Viene del lobby:', isComingFromLobby);
    console.log('🔥 [DEBUGGING] Host Game ID guardado:', hostGameId);
    console.log('🔥 [DEBUGGING] Host User ID guardado:', hostUserId);
    console.log('🔥 [DEBUGGING] Actual User ID:', user?.id);
    console.log('🔥 [DEBUGGING] ¿Es HOST?:', isHost);
    
    // Limpiar localStorage después de un tiempo
    if (isHost) {
      setTimeout(() => {
        localStorage.removeItem('hostGameId');
        localStorage.removeItem('hostUserId');
        console.log('🧹 [DEBUGGING] LocalStorage limpiado');
      }, 5000);
    }
    
  }, [gameId, lobbyCode, user]);

  return (
    <div className="min-h-screen bg-red-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-red-600 mb-8">🔥 DEBUG: Multiplayer Game Screen</h1>
        
        <div className="space-y-4 text-lg">
          <div className="p-4 bg-blue-50 rounded-lg">
            <strong>Game ID:</strong> {gameId}
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <strong>Lobby Code:</strong> {lobbyCode}
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <strong>Usuario:</strong> {debugInfo.username} 
            {debugInfo.isAuthenticated ? ` (ID: ${debugInfo.currentUserId}) ✅ AUTENTICADO` : ' ❌ NO AUTENTICADO (Invitado)'}
          </div>
          
          <div className={`p-4 rounded-lg ${debugInfo.isHost ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
            <strong>Rol:</strong> {debugInfo.isHost ? '👑 HOST (Admin del juego)' : '👤 JUGADOR (Invitado)'}
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <strong>Referrer:</strong> {debugInfo.referrer || 'Sin referrer'}
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <strong>Host Game ID (localStorage):</strong> {debugInfo.hostGameId || 'No guardado'}
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <strong>Host User ID (localStorage):</strong> {debugInfo.hostUserId || 'No guardado'}
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <strong>URL Completa:</strong> {window.location.href}
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <strong>Timestamp:</strong> {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-xl font-bold text-red-700 mb-2">✅ Si ves esta pantalla:</h3>
          <ul className="list-disc list-inside text-red-600 space-y-1">
            <li>La navegación funciona correctamente</li>
            <li>Los parámetros se están pasando bien</li>
            <li>El routing está funcionando</li>
          </ul>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-xl font-bold text-green-700 mb-2">📝 Siguiente paso:</h3>
          <p className="text-green-600">Una vez confirmado que la navegación funciona, reemplazaremos esto con el componente completo.</p>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerGameDebug;