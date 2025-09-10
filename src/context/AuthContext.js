import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../model/data/api/apiClient';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser.user);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error("Token inválido", error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      }
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // CORREGIDO: Se añade 'loading' al valor del contexto
  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading, // <-- AÑADIDO
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children} 
    </AuthContext.Provider>
  );
};
