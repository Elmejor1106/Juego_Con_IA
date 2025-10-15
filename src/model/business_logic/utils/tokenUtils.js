// Utilidades para el manejo de tokens JWT
import { jwtDecode } from 'jwt-decode';

/**
 * Verifica si un token está próximo a expirar
 * @param {string} token - Token JWT
 * @param {number} minutesBeforeExpiry - Minutos antes de expirar (por defecto 10)
 * @returns {boolean} - true si está próximo a expirar
 */
export const isTokenNearExpiry = (token, minutesBeforeExpiry = 10) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000); // Tiempo actual en segundos
    const expiryTime = decoded.exp;
    const timeUntilExpiry = expiryTime - currentTime;
    const minutesUntilExpiry = timeUntilExpiry / 60;
    
    console.log(`🕒 Token expira en ${minutesUntilExpiry.toFixed(1)} minutos`);
    
    return minutesUntilExpiry <= minutesBeforeExpiry;
  } catch (error) {
    console.error('Error verificando expiración de token:', error);
    return true; // Si hay error, asumir que necesita renovación
  }
};

/**
 * Verifica si un token ha expirado completamente
 * @param {string} token - Token JWT
 * @returns {boolean} - true si ha expirado
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error verificando expiración de token:', error);
    return true;
  }
};

/**
 * Obtiene información del usuario desde el token
 * @param {string} token - Token JWT
 * @returns {object|null} - Datos del usuario o null si hay error
 */
export const getUserFromToken = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.user;
  } catch (error) {
    console.error('Error decodificando token:', error);
    return null;
  }
};