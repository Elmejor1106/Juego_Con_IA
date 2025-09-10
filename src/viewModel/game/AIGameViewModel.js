import aiApi from '../../model/data/api/aiApi';

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
  }
};

export default AIGameViewModel;
