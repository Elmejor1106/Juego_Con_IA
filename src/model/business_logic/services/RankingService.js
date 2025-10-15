import apiClient from '../../data/api/apiClient';

class RankingService {
  
  // Guardar puntuación del usuario
  static async saveScore(gameId, score, totalQuestions) {
    try {
      const response = await apiClient.post('/rankings', {
        gameId,
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100)
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al guardar puntuación:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al guardar la puntuación' 
      };
    }
  }

  // Obtener ranking de un juego específico
  static async getGameRanking(gameId, limit = 10) {
    try {
      const response = await apiClient.get(`/rankings/game/${gameId}?limit=${limit}`);
      return { success: true, rankings: response.data };
    } catch (error) {
      console.error('Error al obtener ranking:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener el ranking' 
      };
    }
  }

  // Obtener ranking global
  static async getGlobalRanking(limit = 10) {
    try {
      const response = await apiClient.get(`/rankings/global?limit=${limit}`);
      return { success: true, rankings: response.data };
    } catch (error) {
      console.error('Error al obtener ranking global:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener el ranking global' 
      };
    }
  }

  // Obtener mejor puntuación del usuario para un juego
  static async getUserBestScore(gameId) {
    try {
      const response = await apiClient.get(`/rankings/user-best/${gameId}`);
      return { success: true, bestScore: response.data };
    } catch (error) {
      console.error('Error al obtener mejor puntuación:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Error al obtener la mejor puntuación' 
      };
    }
  }
}

export default RankingService;