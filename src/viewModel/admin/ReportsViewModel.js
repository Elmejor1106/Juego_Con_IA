// ViewModel: Lógica de presentación y estado para los reportes.
import GameService from '../../model/business_logic/services/GameService';
// import UserService from '../../model/business_logic/services/UserService'; // Se usará en el futuro

const ReportsViewModel = {
  /**
   * Obtiene los datos necesarios para los reportes del administrador.
   * @returns {Promise<Object>} Un objeto con el estado y los datos (juegos, usuarios) o el error.
   */
  fetchAdminDashboardData: async () => {
    try {
      // Se pueden hacer varias llamadas en paralelo para optimizar la carga
      const [games /*, users*/] = await Promise.all([
        GameService.getAllGames(),
        // UserService.getAllUsers(), // Futura implementación
      ]);

      // Aquí podrías procesar o combinar datos antes de enviarlos a la vista
      return { success: true, data: { games /*, users*/ } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Llama al servicio para eliminar un juego.
   * @param {string} gameId - El ID del juego a eliminar.
   * @returns {Promise<Object>} Un objeto con el estado del éxito o el error.
   */
  deleteGame: async (gameId) => {
    try {
      await GameService.deleteGame(gameId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default ReportsViewModel;
