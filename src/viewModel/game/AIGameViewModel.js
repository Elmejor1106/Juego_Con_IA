import aiApi from '../../model/data/api/aiApi';
import GameService from '../../model/business_logic/services/GameService';

const AIGameViewModel = {
  /**
   * Processes a user's prompt by sending it to the AI service and returning the response.
   * @param {Array<Object>} messages - The current conversation history from the UI.
   * @returns {Promise<Object>} - An object containing the AI's reply or an error.
   */
  getAIResponse: async (messages) => {
    // La API de OpenAI espera un formato específico: { role: 'user' | 'assistant', content: '...' }
    // La UI usa: { sender: 'user' | 'ai', text: '...' }
    // Aquí mapeamos del formato de la UI al formato de la API.
    const apiMessages = messages.map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    const result = await aiApi.getChatCompletion(apiMessages);

    if (result.error) {
      return { success: false, reply: result.reply };
    }
    
    return { success: true, reply: result.reply };
  },

  /**
   * Calls the AI service to generate a full game based on a description.
   * @param {string} description - The detailed description of the game.
   * @returns {Promise<Object>} - An object containing the generated game data or. an error
   */
  generateGame: async (description) => {
    const result = await aiApi.createGameFromDescription(description);
    return result;
  },

  /**
   * Saves a newly created game to the database.
   * @param {Object} gameData - The game data object (title, description, questions).
   * @returns {Promise<Object>} - The newly created game from the backend or an error object.
   */
  saveGame: async (gameData) => {
    try {
      // We need to add template_id and is_public to the gameData
      // I'll assume template_id 1 (Cuestionario) and is_public false by default.
      const fullGameData = {
        ...gameData,
        template_id: 1, // 'Cuestionario'
        is_public: false,
      };
      const newGame = await GameService.createGame(fullGameData);
      return { success: true, game: newGame };
    } catch (error) {
      return { success: false, message: error.message || 'Failed to save the game.' };
    }
  },

  /**
   * Calls the AI service to generate a list of question candidates.
   * @param {Object} definition - The game definition object { topic, language, count }.
   * @returns {Promise<Object>} - An object containing the generated questions or an error.
   */
  generateQuestions: async (definition) => {
    const result = await aiApi.generateQuestionsFromTopic(definition);
    // The backend response is { data: { questions: [...] } } on success
    if (result.error) {
      return { error: true, message: result.message };
    }
    return result.data; // Should be { questions: [...] }
  }
};

export default AIGameViewModel;
