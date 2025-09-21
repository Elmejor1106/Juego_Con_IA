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
  },

  /**
   * Sends a description to the backend to generate a full game structure.
   * @param {string} description - The detailed description of the game.
   * @returns {Promise<Object>} - The response from the API containing the game JSON.
   */
  createGameFromDescription: async (description) => {
    try {
      const payload = { description };
      const response = await apiClient.post('/ai/create-game', payload);
      return { error: false, data: response.data };
    } catch (error) {
      console.error('Axios Error Details:', error);
      if (error.response) {
        console.error('Backend Response Data:', error.response.data);
        console.error('Backend Response Status:', error.response.status);
      }
      return { 
        error: true, 
        data: null,
        message: error.response?.data?.error || 'No se pudo generar el juego desde la IA.' 
      };
    }
  },

  /**
   * Sends a topic to the backend to generate a list of question candidates.
   * @param {Object} definition - The game definition object { topic, language, count }.
   * @returns {Promise<Object>} - The response from the API containing the questions JSON.
   */
  generateQuestionsFromTopic: async (definition) => {
    try {
      const response = await apiClient.post('/ai/generate-questions', definition);
      return { error: false, data: response.data };
    } catch (error) {
      console.error('Axios Error Details:', error);
      if (error.response) {
        console.error('Backend Response Data:', error.response.data);
        console.error('Backend Response Status:', error.response.status);
      }
      return { 
        error: true, 
        data: null,
        message: error.response?.data?.error || 'No se pudo generar la lista de preguntas.' 
      };
    }
  }
};

export default aiApi;
