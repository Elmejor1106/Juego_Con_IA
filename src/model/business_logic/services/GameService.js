// Lógica de Negocio: Reglas de negocio para la gestión de juegos.
import apiClient from '../../data/api/apiClient';

const GameService = {
  /**
   * Obtiene las plantillas de juego disponibles.
   * @returns {Promise<Array>} Una promesa que se resuelve con un array de plantillas.
   */
  getTemplates: async () => {
    try {
      const response = await apiClient.get('/games/templates');
      return response.data;
    } catch (error) {
      console.error("Error al obtener las plantillas de juego:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener las plantillas');
    }
  },

  /**
   * Obtiene las partidas del usuario actualmente autenticado.
   * @returns {Promise<Array>} Una promesa que se resuelve con un array de las partidas del usuario.
   */
  getMyGames: async () => {
    try {
      const response = await apiClient.get('/games/my-games');
      return response.data;
    } catch (error) {
      console.error("Error al obtener las partidas del usuario:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener las partidas');
    }
  },

  /**
   * Obtiene todos los juegos públicos.
   * @returns {Promise<Array>} Una promesa que se resuelve con un array de juegos públicos.
   */
  getPublicGames: async () => {
    try {
      const response = await apiClient.get('/games/public');
      return response.data;
    } catch (error) {
      console.error("Error al obtener los juegos públicos:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener los juegos públicos');
    }
  },

  /**
   * Crea un nuevo juego.
   * @param {object} gameData - Datos del juego a crear (title, description, template_id, is_public, questions).
   * @returns {Promise<object>} El juego recién creado.
   */
  createGame: async (gameData) => {
    try {
      const response = await apiClient.post('/games', gameData);
      return response.data;
    } catch (error) {
      console.error("Error al crear el juego:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo crear el juego');
    }
  },

  /**
   * Obtiene un juego específico por su ID.
   * @param {string} gameId - El ID del juego a obtener.
   * @returns {Promise<object>} El objeto completo del juego.
   */
  getGameById: async (gameId) => {
    try {
      const response = await apiClient.get(`/games/${gameId}`);
      return response.data;
    } catch (error) {
      console.error("Error al obtener el juego:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo obtener el juego');
    }
  },

  /**
   * Actualiza un juego existente.
   * @param {string} gameId - El ID del juego a actualizar.
   * @param {object} gameData - Datos del juego a actualizar.
   * @returns {Promise<object>} El juego actualizado.
   */
  updateGame: async (gameId, gameData) => {
    try {
      const response = await apiClient.put(`/games/${gameId}`, gameData);
      return response.data;
    } catch (error) {
      console.error("Error al actualizar el juego:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo actualizar el juego');
    }
  },

  /**
   * Obtiene todos los juegos del sistema (para administradores).
   * @returns {Promise<Array>} Un array con todos los juegos.
   */
  getAllGames: async () => {
    try {
      const response = await apiClient.get('/games');
      return response.data;
    } catch (error) {
      console.error("Error al obtener todos los juegos:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener los juegos');
    }
  },

  /**
   * Elimina un juego por su ID (para administradores).
   * @param {string} gameId - El ID del juego a eliminar.
   * @returns {Promise<object>} Un mensaje de confirmación.
   */
  deleteGame: async (gameId) => {
    try {
      const response = await apiClient.delete(`/games/${gameId}`);
      return response.data;
    } catch (error) {
      console.error("Error al eliminar el juego:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo eliminar el juego');
    }
  },

  /**
   * Registra que un usuario jugó un juego.
   * @param {string} gameId - El ID del juego jugado.
   * @returns {Promise<object>} Un mensaje de confirmación.
   */
  logGamePlay: async (gameId) => {
    try {
      const response = await apiClient.post(`/games/${gameId}/play`);
      return response.data;
    } catch (error) {
      console.error("Error al registrar la partida:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudo registrar la partida');
    }
  },
};

export default GameService;