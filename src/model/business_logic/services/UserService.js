import apiClient from '../../data/api/apiClient';

const UserService = {
  /**
   * Obtiene todos los usuarios del sistema.
   * @returns {Promise<Array>} Una promesa que se resuelve con un array de usuarios.
   */
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/users');
      return response.data;
    } catch (error) {
      console.error("Error al obtener todos los usuarios:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener los usuarios');
    }
  },

  /**
   * Crea un nuevo usuario (solo para admins).
   * @param {object} userData - Datos del usuario a crear (username, email, password, role, status).
   * @returns {Promise<object>} El usuario recién creado.
   */
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error("Error al crear el usuario:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo crear el usuario');
    }
  },

  /**
   * Actualiza un usuario existente (solo para admins).
   * @param {string} userId - El ID del usuario a actualizar.
   * @param {object} userData - Los campos del usuario a actualizar.
   * @returns {Promise<object>} Un mensaje de confirmación.
   */
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar el usuario:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo actualizar el usuario');
    }
  },

  /**
   * Desactiva un usuario (soft delete, solo para admins).
   * @param {string} userId - El ID del usuario a desactivar.
   * @returns {Promise<object>} Un mensaje de confirmación.
   */
  deactivateUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error al desactivar el usuario:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo desactivar el usuario');
    }
  },
};

export default UserService;