import apiClient from '../../data/api/apiClient';

const StatsService = {
  /**
   * Obtiene las estadísticas para el dashboard del usuario actual (admin o user).
   * @returns {Promise<Object>} Una promesa que se resuelve con el objeto de estadísticas.
   */
  getStats: async () => {
    try {
      console.log('🔍 [STATS DEBUG] StatsService: Iniciando petición a /stats');
      const response = await apiClient.get('/stats');
      console.log('🔍 [STATS DEBUG] StatsService: Respuesta recibida:', response.data);
      console.log('🔍 [STATS DEBUG] StatsService: Claves del objeto:', Object.keys(response.data));
      return response.data;
    } catch (error) {
      console.error("🔍 [STATS DEBUG] StatsService: Error al obtener las estadísticas:", error.response?.data?.msg || error.message);
      console.error("🔍 [STATS DEBUG] StatsService: Error completo:", error);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener las estadísticas');
    }
  },

  /**
   * Obtiene las estadísticas personales del usuario actual (independientemente del rol).
   * @returns {Promise<Object>} Una promesa que se resuelve con el objeto de estadísticas personales.
   */
  getPersonalStats: async () => {
    try {
      console.log('🔍 [STATS DEBUG] StatsService: Haciendo petición a /stats/personal');
      const response = await apiClient.get('/stats/personal');
      console.log('🔍 [STATS DEBUG] StatsService: Respuesta personal recibida:', response.data);
      console.log('🔍 [STATS DEBUG] StatsService: Claves del objeto personal:', Object.keys(response.data));
      return response.data;
    } catch (error) {
      console.error("❌ StatsService: Error al obtener las estadísticas personales:", error.response?.data?.msg || error.message);
      console.error("❌ StatsService: Error completo:", error);
      throw new Error(error.response?.data?.msg || 'No se pudieron obtener las estadísticas personales');
    }
  },
};

export default StatsService;