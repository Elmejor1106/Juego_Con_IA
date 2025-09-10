console.log('--- Loading routes/ai.js ---');
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  try {
    // System message to set the context for the AI
    const systemMessage = {
      role: 'system',
      content: 'You are an expert game design assistant. Help the user create educational and fun games. You can generate questions and answers, suggest visual styles (colors, fonts), and provide creative ideas for game mechanics. Respond concisely and be ready to format answers as JSON if requested.'
    };

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Changed to a more accessible model
      messages: [systemMessage, ...messages], // Pass the conversation history including the system message
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

module.exports = router;
