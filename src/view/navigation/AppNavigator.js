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
import GamePlayerScreen from '../screens/user/GamePlayerScreen'; // Importar la pantalla de juego
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../components/common/MainLayout';

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <Routes>
      {isAuthenticated ? (
        <>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/user-games" element={<UserGamesScreen />} />
            <Route path="/create-game" element={<CreateGameScreen />} />
            <Route path="/create-game-editor/:templateId" element={<GameEditorScreen />} />
            <Route path="/play/:gameId" element={<GamePlayerScreen />} />
            {/* Rutas protegidas para admin */}
            <Route path="/admin" element={<AdminNavigator />}>
              <Route path="dashboard" element={<AdminDashboardScreen />} />
              <Route path="users" element={<ManageUsersScreen />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          <Route path="/create-ai-game" element={<CreateGameAIScreen />} />
        </>
      ) : (
        <Route path="/*" element={<AuthNavigator />} />
      )}
    </Routes>
  );
};

export default AppNavigator;