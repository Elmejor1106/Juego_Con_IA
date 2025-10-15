import StatsService from '../../model/business_logic/services/StatsService';

const UserViewModel = {
  /**
   * Fetches statistics for the user dashboard.
   * @returns {Promise<Object>} An object containing the stats or an error message.
   */
  fetchDashboardStats: async () => {
    try {
      console.log('🔍 [STATS DEBUG] UserViewModel: Llamando StatsService.getPersonalStats()');
      const stats = await StatsService.getPersonalStats();
      console.log('🔍 [STATS DEBUG] UserViewModel: Stats personales recibidas:', stats);
      return { success: true, data: stats };
    } catch (error) {
      console.error('🔍 [STATS DEBUG] UserViewModel: Error:', error.message);
      return { success: false, message: error.message };
    }
  },
};

export default UserViewModel;
