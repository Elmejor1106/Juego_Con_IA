console.log('--- Loading routes/ai.js ---');
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // System message to set the context for the AI
    const systemMessage =
      'You are an expert game design assistant. Help the user create educational and fun games. You can generate questions and answers, suggest visual styles (colors, fonts), and provide creative ideas for game mechanics. Respond concisely and be ready to format answers as JSON if requested.';

    // Transform messages to Gemini format
    const history = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // The last message is the new prompt
    const userPrompt = history.pop();
    if (!userPrompt || userPrompt.role !== 'user') {
        return res.status(400).json({ error: 'The last message must be from the user.' });
    }

    const chat = model.startChat({
      history: [
        {
            role: 'user',
            parts: [{ text: systemMessage }]
        },
        {
            role: 'model',
            parts: [{ text: "¡Entendido! Estoy listo para ayudarte a diseñar juegos increíbles." }]
        },
        ...history
      ],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(userPrompt.parts[0].text);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error('Error calling Google Gemini API:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});


// POST /api/ai/create-game
router.post('/create-game', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    // Use a model that supports JSON output
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        response_mime_type: 'application/json',
      },
    });

const prompt = `
      Actúa como un experto diseñador de juegos educativos. Basado en la siguiente descripción, crea un juego de preguntas y respuestas.
      Descripción del usuario: "${description.replace(/"/g, '\\"')}"

      Tu respuesta DEBE ser un único objeto JSON válido, sin nada de texto antes o después del JSON.
      La estructura del JSON debe ser la siguiente:
      {
        "title": "Un título creativo y corto para el juego",
        "description": "Una descripción corta y atractiva del juego.",
        "questions": [
          {
            "question_text": "El texto completo de la pregunta 1.",
            "answers": [
              { "answer_text": "Texto de la respuesta correcta.", "is_correct": true },
              { "answer_text": "Texto de una respuesta incorrecta.", "is_correct": false },
              { "answer_text": "Texto de otra respuesta incorrecta.", "is_correct": false },
              { "answer_text": "Texto de una tercera respuesta incorrecta.", "is_correct": false }
            ]
          },
          {
            "question_text": "El texto completo de la pregunta 2.",
            "answers": [
              { "answer_text": "Texto de la respuesta correcta.", "is_correct": true },
              { "answer_text": "Texto de una respuesta incorrecta.", "is_correct": false },
              { "answer_text": "Texto de otra respuesta incorrecta.", "is_correct": false }
            ]
          }
        ]
      }

      Asegúrate de que:
      - Haya entre 5 y 10 preguntas en total.
      - Cada pregunta tenga entre 3 y 4 respuestas.
      - Solo UNA respuesta por pregunta sea la correcta (\`is_correct: true\`).
      
      - El contenido sea educativo, preciso y relacionado con la descripción del usuario.
      - El JSON esté perfectamente formado.
    `;


    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    // Parse the JSON to ensure it's valid before sending
    const gameObject = JSON.parse(jsonText);

    res.json(gameObject);

  } catch (error) {
    console.error('Error calling Google Gemini API for game creation:', error);
    res.status(500).json({ error: 'Failed to create game from AI' });
  }
});

module.exports = router;
