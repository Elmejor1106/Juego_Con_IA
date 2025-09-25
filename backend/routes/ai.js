console.log('--- Loading routes/ai.js ---');
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function for retrying API calls
async function generateWithRetry(model, prompt, retries = 3, delay = 2000) {
  let currentDelay = delay;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      if (error.status === 503 && i < retries - 1) {
        console.log(`Attempt ${i + 1} failed with 503. Retrying in ${currentDelay / 1000}s...`);
        await new Promise(res => setTimeout(res, currentDelay));
        currentDelay *= 2; // Exponential backoff
      } else {
        console.error(`Final attempt failed or non-retriable error:`, error);
        throw error;
      }
    }
  }
}

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
    if (error.status === 503) {
      res.status(503).json({ error: 'El servicio de IA está actualmente sobrecargado. Por favor, inténtalo de nuevo en unos momentos.' });
    } else {
      res.status(500).json({ error: 'Failed to get response from AI' });
    }
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
          }
        ]
      }

      Asegúrate de que:
      - Haya entre 5 y 10 preguntas en total.
      - Cada pregunta tenga EXACTAMENTE 4 respuestas.
      - Solo UNA respuesta por pregunta sea la correcta (\`is_correct: true\`).
      - El contenido sea educativo, preciso y relacionado con la descripción del usuario.
      - El JSON esté perfectamente formado.
    `;


    const result = await generateWithRetry(model, prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    const gameObject = JSON.parse(jsonText);

    res.json(gameObject);

  } catch (error) {
    console.error('Error calling Google Gemini API for game creation:', error);
    if (error.status === 503) {
      res.status(503).json({ error: 'El servicio de IA está actualmente sobrecargado. Por favor, inténtalo de nuevo en unos momentos.' });
    } else {
      res.status(500).json({ error: 'Failed to create game from AI' });
    }
  }
});

// POST /api/ai/generate-questions
router.post('/generate-questions', async (req, res) => {
  const { topic, language, count } = req.body;

  if (!topic || !language || !count) {
    return res.status(400).json({ error: 'Topic, language, and count are required' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        response_mime_type: 'application/json',
      },
    });

    const prompt = `
      Actúa como un experto en creación de contenido educativo.
      Genera una lista de ${count} preguntas de opción múltiple sobre el siguiente tema: "${topic}".
      El idioma de las preguntas y respuestas debe ser: ${language}.

      Tu respuesta DEBE ser un único objeto JSON válido, sin nada de texto antes o después del JSON.
      La estructura del JSON debe ser un objeto con una única clave "questions", que contenga un array de objetos de pregunta. 
      
      Asegúrate de que:
      - Cada pregunta en el array tenga una estructura con "question_text" (string) y "answers" (array).
      - Cada objeto de respuesta en el array "answers" tenga "answer_text" (string) y "is_correct" (boolean).
      - Cada pregunta tenga EXACTAMENTE 4 respuestas.
      - Solo UNA respuesta por pregunta sea la correcta (\`is_correct: true\`).
      - El contenido sea educativo, preciso y estrictamente relacionado con el tema proporcionado.

      Ejemplo de la estructura de respuesta esperada:
      {
        "questions": [
          {
            "question_text": "¿Cuál es el planeta más grande del sistema solar?",
            "answers": [
              { "answer_text": "Júpiter", "is_correct": true },
              { "answer_text": "Saturno", "is_correct": false },
              { "answer_text": "Tierra", "is_correct": false },
              { "answer_text": "Marte", "is_correct": false }
            ]
          }
        ]
      }
    `;

    const result = await generateWithRetry(model, prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    const generatedData = JSON.parse(jsonText);

    const shuffleArray = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    if (generatedData.questions && Array.isArray(generatedData.questions)) {
      generatedData.questions.forEach(question => {
        if (question.answers && Array.isArray(question.answers)) {
          question.answers = shuffleArray(question.answers);
        }
      });
    }

    res.json(generatedData);

  } catch (error) {
    console.error('Error calling Google Gemini API for question generation:', error);
    if (error.status === 503) {
      res.status(503).json({ error: 'El servicio de IA está actualmente sobrecargado. Por favor, inténtalo de nuevo en unos momentos.' });
    } else {
      res.status(500).json({ error: 'Failed to generate questions from AI' });
    }
  }
});

// POST /api/ai/generate-style
router.post('/generate-style', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'A description of the desired style is required' });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        response_mime_type: 'application/json',
      },
    });

    const prompt = `
      Actúa como un experto diseñador de UI/UX especializado en accesibilidad y estética de juegos.
      Basado en la siguiente descripción del usuario, genera una paleta de colores para un juego de preguntas y respuestas.
      Descripción del usuario: "${description.replace(/"/g, '\\"')}"

      Tu respuesta DEBE ser un único objeto JSON válido, sin texto antes o después.
      El JSON debe tener la siguiente estructura exacta:
      {
        "containerBg": "#RRGGBB",
        "questionText": "#RRGGBB",
        "answerBg": "#RRGGBB",
        "answerTextColor": "#RRGGBB",
        "timerBg": "#RRGGBB",
        "timerTextColor": "#RRGGBB"
      }

      Asegúrate de que:
      - Los colores sean estéticamente agradables y coherentes con la descripción.
      - Haya suficiente contraste entre los colores de fondo y de texto para garantizar la legibilidad (WCAG AA o superior).
      - "containerBg" es el fondo de la tarjeta principal de la pregunta.
      - "questionText" es el color del texto de la pregunta.
      - "answerBg" es el fondo de los botones de respuesta.
      - "answerTextColor" es el color del texto de los botones de respuesta.
      - Todos los valores de color sean códigos hexadecimales de 6 dígitos válidos.
    `;

    const result = await generateWithRetry(model, prompt);
    const response = await result.response;
    const jsonText = response.text();
    
    const styleObject = JSON.parse(jsonText);

    if (!styleObject.containerBg || !styleObject.questionText || !styleObject.answerBg || !styleObject.answerTextColor) {
      throw new Error('AI response is missing required color fields.');
    }

    res.json(styleObject);

  } catch (error) {
    console.error('Error calling Google Gemini API for style generation:', error);
    if (error.status === 503) {
      res.status(503).json({ error: 'El servicio de IA está actualmente sobrecargado. Por favor, inténtalo de nuevo en unos momentos.' });
    } else if (error instanceof SyntaxError) {
      res.status(500).json({ error: 'La IA devolvió una respuesta con formato incorrecto. Por favor, intenta de nuevo.' });
    }
    else {
      res.status(500).json({ error: 'Failed to generate style from AI' });
    }
  }
});

module.exports = router;
