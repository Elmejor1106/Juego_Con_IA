import StatsService from '../../model/business_logic/services/StatsService';

const UserViewModel = {
  /**
   * Fetches statistics for the user dashboard.
   * @returns {Promise<Object>} An object containing the stats or an error message.
   */
  fetchDashboardStats: async () => {
    try {
      const stats = await StatsService.getStats();
      return { success: true, data: stats };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

export default UserViewModel;
