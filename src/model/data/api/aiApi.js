import apiClient from './apiClient';

const aiApi = {
  /**
   * Sends a message history to the backend to get a completion from the AI.
   * @param {Array<Object>} messages - The array of message objects (e.g., [{ role: 'user', content: 'Hello' }]).
   * @returns {Promise<Object>} - The response from the API containing the AI's reply.
   */
  getChatCompletion: async (messages) => {
    try {
      // El backend espera un objeto con una propiedad `messages`
      const payload = { messages };
      const response = await apiClient.post('/ai/chat', payload);
      return response.data;
    } catch (error) {
      // --- DEPURACIÓN ---
      console.error('Axios Error Details:', error);
      if (error.response) {
        console.error('Backend Response Data:', error.response.data);
        console.error('Backend Response Status:', error.response.status);
      }
      // --- FIN DEPURACIÓN ---
      return { 
        error: true, 
        reply: error.response?.data?.error || 'No se pudo obtener una respuesta de la IA. Inténtalo de nuevo.' 
      };
    }
  }
};

export default aiApi;
