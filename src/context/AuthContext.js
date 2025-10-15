import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../model/data/api/apiClient';
import { jwtDecode } from 'jwt-decode';
import { isTokenExpired } from '../model/business_logic/utils/tokenUtils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Función para actualizar el token y usuario
  const updateToken = (newToken) => {
    if (newToken && !isTokenExpired(newToken)) {
      try {
        const decodedUser = jwtDecode(newToken);
        setUser(decodedUser.user);
        setToken(newToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        console.log('🔄 AuthContext: Token actualizado para usuario:', decodedUser.user.username);
      } catch (error) {
        console.error("Token inválido en updateToken:", error);
        logout();
      }
    } else {
      logout();
    }
  };

  useEffect(() => {
    if (token) {
      updateToken(token);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  // Escuchar eventos de renovación de token y limpieza de sesión
  useEffect(() => {
    const handleTokenRefresh = (event) => {
      const { token: newToken } = event.detail;
      console.log('🎉 AuthContext: Recibido evento de token renovado');
      updateToken(newToken);
    };

    const handleSessionCleanup = (event) => {
      const { reason, status } = event.detail;
      console.log(`🧹 AuthContext: Limpieza de sesión solicitada. Razón: ${reason}, Status: ${status}`);
      
      // Solo hacer logout si no lo hemos hecho ya
      if (user || token) {
        logout();
      }
    };

    window.addEventListener('tokenRefreshed', handleTokenRefresh);
    window.addEventListener('sessionCleanup', handleSessionCleanup);
    
    return () => {
      window.removeEventListener('tokenRefreshed', handleTokenRefresh);
      window.removeEventListener('sessionCleanup', handleSessionCleanup);
    };
  }, [user, token]);

  const login = (newToken) => {
    console.log('🔑 AuthContext: Iniciando sesión con nuevo token');
    localStorage.setItem('token', newToken);
    updateToken(newToken);
  };

  const logout = () => {
    console.log('🚪 AuthContext: Cerrando sesión...');
    
    // Evitar múltiples logouts simultáneos
    if (!window.logoutInProgress) {
      window.logoutInProgress = true;
      
      localStorage.removeItem('token');
      localStorage.removeItem('guestPlayerName');
      localStorage.removeItem('guestPlayerId');
      localStorage.removeItem('hostGameId');
      localStorage.removeItem('hostUserId');
      setToken(null);
      setUser(null);
      delete apiClient.defaults.headers.common['Authorization'];
      
      // Resetear flag después de completar logout
      setTimeout(() => {
        window.logoutInProgress = false;
      }, 100);
    }
  };

  // Verificación periódica opcional del token (cada 5 minutos)
  useEffect(() => {
    if (!user) return;

    const checkTokenPeriodically = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && isTokenExpired(currentToken)) {
        console.log('🕒 Token expirado detectado en verificación periódica');
        logout();
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(checkTokenPeriodically);
  }, [user]);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children} 
    </AuthContext.Provider>
  );
};
