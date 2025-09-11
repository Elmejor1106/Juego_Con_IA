import UserService from '../../model/business_logic/services/UserService';
import StatsService from '../../model/business_logic/services/StatsService';

const AdminViewModel = {
  /**
   * Fetches statistics for the admin dashboard.
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
  /**
   * Fetches all users from the system.
   * @returns {Promise<Object>} An object containing the list of users or an error message.
   */
  fetchAllUsers: async () => {
    try {
      const users = await UserService.getAllUsers();
      return { success: true, data: users };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Creates a new user.
   * @param {object} userData - The data for the new user.
   * @returns {Promise<Object>} An object containing the new user or an error message.
   */
  addNewUser: async (userData) => {
    try {
      const newUser = await UserService.createUser(userData);
      return { success: true, data: newUser };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Updates an existing user.
   * @param {string} userId - The ID of the user to update.
   * @param {object} userData - The data to update.
   * @returns {Promise<Object>} An object indicating success or failure.
   */
  editUser: async (userId, userData) => {
    try {
      await UserService.updateUser(userId, userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  /**
   * Deactivates a user.
   * @param {string} userId - The ID of the user to deactivate.
   * @returns {Promise<Object>} An object indicating success or failure.
   */
  deactivateUser: async (userId) => {
    try {
      await UserService.deactivateUser(userId);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};

export default AdminViewModel;
