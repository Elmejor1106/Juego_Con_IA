import axios from 'axios';
import { isTokenNearExpiry, isTokenExpired } from '../../business_logic/utils/tokenUtils';

// Variable para evitar múltiples intentos de renovación simultáneos
let isRefreshing = false;
let refreshPromise = null;

// Crea una instancia de axios pre-configurada
const apiClient = axios.create({
  // La URL base de tu API de backend
  // Asegúrate de que tu servidor backend esté corriendo en el puerto 5003
  baseURL: 'http://localhost:5003/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para renovar el token
const refreshToken = async () => {
  console.log('🔄 Intentando renovar token...');
  
  const currentToken = localStorage.getItem('token');
  if (!currentToken || isTokenExpired(currentToken)) {
    throw new Error('Token expirado, requiere login');
  }

  try {
    const response = await axios.post(
      'http://localhost:5003/api/auth/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { token: newToken } = response.data;
    localStorage.setItem('token', newToken);
    
    // Actualizar header por defecto
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    console.log('✅ Token renovado exitosamente');
    
    // Disparar evento personalizado para que AuthContext se entere
    window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: { token: newToken } }));
    
    return newToken;
  } catch (error) {
    console.error('❌ Error renovando token:', error);
    throw error;
  }
};

// Interceptor para añadir el token JWT y manejar renovación automática
apiClient.interceptors.request.use(
  async (config) => {
    // Evitar renovación infinita en la propia petición de refresh
    if (config.url === '/auth/refresh') {
      return config;
    }

    const token = localStorage.getItem('token');
    
    if (token) {
      // Verificar si el token está próximo a expirar
      if (isTokenNearExpiry(token, 10)) { // 10 minutos antes
        console.log('⚠️ Token próximo a expirar, renovando...');
        
        try {
          // Evitar múltiples renovaciones simultáneas
          if (!isRefreshing) {
            isRefreshing = true;
            refreshPromise = refreshToken().finally(() => {
              isRefreshing = false;
              refreshPromise = null;
            });
          }
          
          // Esperar a que termine la renovación
          await refreshPromise;
          
          // Usar el nuevo token
          const newToken = localStorage.getItem('token');
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } catch (error) {
          console.error('❌ Fallo en renovación automática:', error);
          // Si falla la renovación, continuar con el token actual
          // El interceptor de respuesta manejará el error 401
          config.headers.Authorization = `Bearer ${token}`;
        }
      } else {
        // Token aún válido, usarlo normalmente
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores de autenticación
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, la devuelve tal como está
    return response;
  },
  (error) => {
    // Maneja errores de respuesta
    console.log('🔍 [apiClient] Error interceptado:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🚨 [apiClient] Token inválido o expirado, limpiando sesión...');
      
      // Evitar múltiples limpiezas simultáneas
      if (!window.sessionCleanupInProgress) {
        window.sessionCleanupInProgress = true;
        
        // Limpiar localStorage completamente
        localStorage.removeItem('token');
        localStorage.removeItem('guestPlayerName');
        localStorage.removeItem('guestPlayerId');
        localStorage.removeItem('hostGameId');
        localStorage.removeItem('hostUserId');
        
        // Limpiar headers de axios
        delete apiClient.defaults.headers.common['Authorization'];
        
        // Limpiar cualquier estado de renovación de token
        isRefreshing = false;
        refreshPromise = null;
        
        // Disparar evento de limpieza de sesión
        window.dispatchEvent(new CustomEvent('sessionCleanup', { 
          detail: { reason: 'auth_error', status: error.response?.status } 
        }));
        
        // Resetear flag después de un breve delay
        setTimeout(() => {
          window.sessionCleanupInProgress = false;
        }, 1000);
        
        // Redirigir al login solo si no estamos ya en páginas de auth
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/forgot-password')) {
          console.log('🔄 [apiClient] Redirigiendo al login...');
          // Delay la redirección para permitir que se complete la limpieza
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;