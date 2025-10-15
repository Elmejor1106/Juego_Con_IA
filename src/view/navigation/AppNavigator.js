import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import ManageUsersScreen from '../screens/admin/ManageUsersScreen';
import HomeScreen from '../screens/user/HomeScreen';
import UserGamesScreen from '../screens/user/UserGamesScreen';
import CreateGameScreen from '../screens/user/CreateGameScreen';
import GameEditorScreen from '../screens/user/GameEditorScreen';
import CreateGameAIScreen from '../screens/user/CreateGameAIScreen';
import PublicGamesScreen from '../screens/user/PublicGamesScreen';
import GamePlayerScreen from '../screens/user/GamePlayerScreen';
import GameLobbyScreen from '../screens/user/GameLobbyScreen';
import JoinGameScreen from '../screens/user/JoinGameScreen';
import MultiplayerGameScreen from '../screens/user/MultiplayerGameScreen';
import MultiplayerGameDebug from '../screens/user/MultiplayerGameDebug';
import SharedGameScreen from '../screens/user/SharedGameScreen';

import { useAuth } from '../../context/AuthContext';
import MainLayout from '../components/common/MainLayout';

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  console.log('🧭 [AppNavigator] === ESTADO DE AUTENTICACIÓN ===');
  console.log('🧭 [AppNavigator] IsAuthenticated:', isAuthenticated);
  console.log('🧭 [AppNavigator] Loading:', loading);
  console.log('🧭 [AppNavigator] Ruta actual:', window.location.pathname);

  if (loading) {
    console.log('🧭 [AppNavigator] Mostrando pantalla de carga...');
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <Routes>
      {isAuthenticated ? (
        <>
          {console.log('🧭 [AppNavigator] Renderizando rutas AUTENTICADAS')}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/user-games" element={<UserGamesScreen />} />
            <Route path="/create-game" element={<CreateGameScreen />} />
            <Route path="/create-game-editor/:templateId" element={<GameEditorScreen />} />
            <Route path="/public-games" element={<PublicGamesScreen />} />
            {/* Rutas protegidas para admin */}
            <Route path="/admin" element={<AdminNavigator />}>
              <Route path="dashboard" element={<AdminDashboardScreen />} />
              <Route path="users" element={<ManageUsersScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          {/* Rutas independientes de pantalla completa */}
          <Route path="/create-ai-game" element={<CreateGameAIScreen />} />
          <Route path="/edit-game/:gameId" element={<GameEditorScreen />} />
          <Route path="/play/:gameId" element={<GamePlayerScreen />} />
          <Route path="/shared/:token" element={<SharedGameScreen />} />
          {/* Rutas multijugador - SIEMPRE accesibles */}
          <Route path="/multiplayer-lobby/:gameId" element={<GameLobbyScreen />} />
          <Route path="/multiplayer-game/:gameId/:lobbyCode" element={<MultiplayerGameScreen />} />
        </>
      ) : (
        <>
          {console.log('🧭 [AppNavigator] Renderizando rutas NO AUTENTICADAS')}
          {/* Rutas públicas (sin autenticación) */}
          <Route path="/join-game/:gameId/:lobbyCode" element={<JoinGameScreen />} />
          {/* Ruta de juego multijugador - accesible sin autenticación */}
          <Route path="/multiplayer-game/:gameId/:lobbyCode" element={<MultiplayerGameScreen />} />
          <Route path="/*" element={<AuthNavigator />} />
        </>
      )}
    </Routes>
  );
};

export default AppNavigator;
