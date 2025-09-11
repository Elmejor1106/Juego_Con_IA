// ViewModel: Lógica de presentación y estado para la creación y gestión de juegos.
import GameService from '../../model/business_logic/services/GameService';

const GameViewModel = {
  /**
   * Llama al servicio para obtener las plantillas de juego.
   * @returns {Promise<Object>} Un objeto con el estado del éxito y los datos o el error.
   */
  getTemplates: async () => {
    try {
      const templates = await GameService.getTemplates();
      return { success: true, templates };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Llama al servicio para obtener las partidas del usuario y maneja el estado.
   * @returns {Promise<Object>} Un objeto con el estado del éxito y los datos o el error.
   */
  fetchMyGames: async () => {
    try {
      const games = await GameService.getMyGames();
      return { success: true, games };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Llama al servicio para obtener un juego específico por su ID.
   * @param {string} gameId - El ID del juego a obtener.
   * @returns {Promise<Object>} Un objeto con el estado del éxito y los datos del juego o el error.
   */
  getGameById: async (gameId) => {
    try {
      const game = await GameService.getGameById(gameId);
      return { success: true, game };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Llama al servicio para crear un nuevo juego.
   * @param {object} gameData - Datos del juego (title, template_id, etc.).
   * @returns {Promise<Object>} Un objeto con el estado del éxito y el juego creado o el error.
   */

  createGame: async (gameData) => {
    // Validación básica en el ViewModel
    if (!gameData.title || !gameData.template_id) {
      return { success: false, error: 'El título y la plantilla son obligatorios.' };
    }
    try {
      const newGame = await GameService.createGame(gameData);
      return { success: true, game: newGame };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Llama al servicio para eliminar un juego por su ID.
   * @param {string} gameId - El ID del juego a eliminar.
   * @returns {Promise<Object>} Un objeto con el estado del éxito o error.
   */
  deleteGame: async (gameId) => {
    try {
      const result = await GameService.deleteGame(gameId);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Llama al servicio para registrar que un usuario jugó un juego.
   * @param {string} gameId - El ID del juego jugado.
   * @returns {Promise<Object>} Un objeto con el estado del éxito o error.
   */
  logGamePlay: async (gameId) => {
    try {
      const result = await GameService.logGamePlay(gameId);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default GameViewModel;