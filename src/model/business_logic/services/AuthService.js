// Lógica de Negocio: Reglas de negocio para la autenticación.
import apiClient from '../../data/api/apiClient';

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.msg || 'Error en el inicio de sesión');
    }
  },

  register: async (username, email, password) => {
    try {
      const response = await apiClient.post('/auth/register', { username, email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.msg || 'Error en el registro');
    }
  },

  // AÑADIDO: Verificar correo electrónico
  verifyEmail: async (token) => {
    try {
      const response = await apiClient.get(`/auth/verify-email/${token}`);
      return response.data; // Devuelve { msg: "...", verified: true }
    } catch (error) {
      throw new Error(error.response?.data?.msg || 'Error al verificar el correo');
    }
  },

  // AÑADIDO: Solicitar reseteo de contraseña
  requestPasswordReset: async (email) => {
    try {
      const response = await apiClient.post('/auth/request-password-reset', { email });
      return response.data; // Devuelve { msg: "..." }
    } catch (error) {
      throw new Error(error.response?.data?.msg || 'Error al solicitar el reseteo');
    }
  },

  // AÑADIDO: Resetear la contraseña con el token
  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password', { token, newPassword });
      return response.data; // Devuelve { msg: "..." }
    } catch (error) {
      throw new Error(error.response?.data?.msg || 'Error al resetear la contraseña');
    }
  },

  // AÑADIDO: Renovar token antes de que expire
  refreshToken: async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      return response.data; // Devuelve { token: "..." }
    } catch (error) {
      throw new Error(error.response?.data?.msg || 'Error al renovar el token');
    }
  },
};

export default AuthService;