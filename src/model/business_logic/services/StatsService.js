import apiClient from '../../data/api/apiClient';

const StatsService = {
  /**
   * Obtiene las estadísticas para el dashboard del usuario actual (admin o user).
   * @returns {Promise<Object>} Una promesa que se resuelve con el objeto de estadísticas.
   */
  getStats: async () => {
    try {
      const response = await apiClient.get('/stats');
      return response.data;
    } catch (error) {
      console.error("Error al obtener las estadísticas:", error.response?.data?.msg || error.message);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener las estadísticas');
    }
  },
};

export default StatsService;