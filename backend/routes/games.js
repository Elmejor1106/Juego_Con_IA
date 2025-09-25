const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

// @route   DELETE api/games/:id
// @desc    Eliminar un juego (dueño o admin)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Verificar si el usuario es el dueño o admin
    const [gameResult] = await connection.query('SELECT user_id FROM games WHERE id = ?', [gameId]);
    if (gameResult.length === 0) {
      await connection.rollback();
      return res.status(404).json({ msg: 'Juego no encontrado' });
    }
    const gameOwnerId = gameResult[0].user_id;
    if (gameOwnerId !== userId && userRole !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ msg: 'Acceso denegado. No eres el dueño de este juego ni un administrador.' });
    }
    // Eliminar respuestas y preguntas asociadas
    await connection.query('DELETE FROM game_answers WHERE question_id IN (SELECT id FROM game_questions WHERE game_id = ?)', [gameId]);
    await connection.query('DELETE FROM game_questions WHERE game_id = ?', [gameId]);
    // Eliminar el juego
    await connection.query('DELETE FROM games WHERE id = ?', [gameId]);
    await connection.commit();
    res.json({ msg: 'Juego eliminado correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  } finally {
    connection.release();
  }
});

// @route   POST api/games/:id/play
// @desc    Registrar que un usuario jugó un juego
// @access  Private
router.post('/:id/play', authMiddleware, async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user.id;
  try {
    await pool.query('INSERT INTO game_plays (game_id, user_id, played_at) VALUES (?, ?, NOW())', [gameId, userId]);
    res.json({ msg: 'Partida registrada' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Error al registrar la partida' });
  }
});



// @route   GET api/games/templates
// @desc    Obtener todas las plantillas de juegos disponibles
// @access  Private
router.get('/templates', authMiddleware, async (req, res) => {
  try {
    const [templates] = await pool.query('SELECT * FROM game_templates ORDER BY id');
    res.json(templates);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
});

// @route   GET api/games/my-games
// @desc    Obtener todos los juegos del usuario logueado
// @access  Private
router.get('/my-games', authMiddleware, async (req, res) => {
  try {
    const [games] = await pool.query(
      `SELECT g.id, g.title, g.description, g.is_public, g.created_at, t.name as template_name 
       FROM games g 
       JOIN game_templates t ON g.template_id = t.id 
       WHERE g.user_id = ? 
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
});

// @route   GET api/games/public
// @desc    Obtener todos los juegos públicos
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const [games] = await pool.query(
      `SELECT g.id, g.title, g.description, g.is_public, g.created_at, t.name as template_name, u.username 
       FROM games g 
       JOIN game_templates t ON g.template_id = t.id 
       JOIN users u ON g.user_id = u.id
       WHERE g.is_public = 1 
       ORDER BY g.created_at DESC`
    );
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
});

// @route   POST api/games
// @desc    Crear un nuevo juego a partir de una plantilla
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, template_id, is_public, questions, styles } = req.body;
  const user_id = req.user.id;

  if (!title || !template_id) {
    return res.status(400).json({ msg: 'Por favor, proporciona un título y una plantilla.' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const newGame = {
      user_id,
      template_id,
      title,
      description,
      is_public: is_public || false,
      styles: styles ? JSON.stringify(styles) : null,
    };

    const [result] = await connection.query('INSERT INTO games SET ?', newGame);
    const gameId = result.insertId;

    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        const newQuestion = {
          game_id: gameId,
          question_text: q.question_text,
          order: q.order,
          image_url: q.imageUrl || null,
        };
        const [questionResult] = await connection.query('INSERT INTO game_questions SET ?', newQuestion);
        const questionId = questionResult.insertId;

        if (q.answers && Array.isArray(q.answers)) {
          for (const a of q.answers) {
            const newAnswer = {
              question_id: questionId,
              answer_text: a.answer_text,
              is_correct: a.is_correct,
              order: a.order,
            };
            await connection.query('INSERT INTO game_answers SET ?', newAnswer);
          }
        }
      }
    }

    await connection.commit();

    const [gameCreated] = await connection.query('SELECT * FROM games WHERE id = ?', [gameId]);

    res.status(201).json(gameCreated[0]);

  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  } finally {
    connection.release();
  }
});

// @route   GET api/games
// @desc    Obtener todos los juegos (para Admin)
// @access  Private (Admin only)
router.get('/', [authMiddleware, isAdmin], async (req, res) => {
  try {
    const [games] = await pool.query(`
      SELECT g.id, g.user_id, g.title, g.is_public, g.created_at, u.username, t.name as template_name
      FROM games g
      JOIN users u ON g.user_id = u.id
      JOIN game_templates t ON g.template_id = t.id
      ORDER BY g.created_at DESC
    `);
    res.json(games);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
});


// @route   GET api/games/:id
// @desc    Obtener un juego específico por ID con sus preguntas y respuestas
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const gameId = req.params.id;

    // 1. Obtener los detalles del juego
    const [gameResult] = await pool.query('SELECT id, title, description, template_id, styles, is_public FROM games WHERE id = ?', [gameId]);

    if (gameResult.length === 0) {
      return res.status(404).json({ msg: 'Juego no encontrado' });
    }
    const game = gameResult[0];

    // 2. Obtener las preguntas del juego
    const [questions] = await pool.query('SELECT id, question_text, `order`, image_url as imageUrl FROM game_questions WHERE game_id = ? ORDER BY `order` ASC', [gameId]);

    // 3. Para cada pregunta, obtener sus respuestas
    for (let i = 0; i < questions.length; i++) {
      const [answers] = await pool.query('SELECT id, answer_text, is_correct, `order` FROM game_answers WHERE question_id = ? ORDER BY `order` ASC', [questions[i].id]);
      questions[i].answers = answers;
    }

    game.questions = questions;

    res.json(game);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  }
});

// @route   PUT api/games/:id
// @desc    Actualizar un juego existente con sus preguntas y respuestas
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  const gameId = req.params.id;
  const { title, description, is_public, questions, styles } = req.body;
  const userId = req.user.id;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verificar que el juego existe y pertenece al usuario o es admin
    const [games] = await connection.query('SELECT user_id FROM games WHERE id = ?', [gameId]);
    if (games.length === 0) {
      await connection.rollback();
      return res.status(404).json({ msg: 'Juego no encontrado' });
    }
    const gameOwnerId = games[0].user_id;
    if (gameOwnerId !== userId && req.user.role !== 'admin') {
      await connection.rollback();
      return res.status(403).json({ msg: 'No autorizado para editar este juego' });
    }

    // Actualizar detalles del juego
    await connection.query(
      'UPDATE games SET title = ?, description = ?, is_public = ?, styles = ? WHERE id = ?',
      [title, description, is_public, styles ? JSON.stringify(styles) : null, gameId]
    );

    // Eliminar preguntas y respuestas existentes para reinsertar (simplificado)
    await connection.query('DELETE FROM game_answers WHERE question_id IN (SELECT id FROM game_questions WHERE game_id = ?)', [gameId]);
    await connection.query('DELETE FROM game_questions WHERE game_id = ?', [gameId]);

    // Insertar nuevas preguntas y respuestas
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        const newQuestion = {
          game_id: gameId,
          question_text: q.question_text,
          order: q.order,
          image_url: q.imageUrl || null
        };
        const [questionResult] = await connection.query('INSERT INTO game_questions SET ?', newQuestion);
        const questionId = questionResult.insertId;

        if (q.answers && Array.isArray(q.answers)) {
          for (const a of q.answers) {
            const newAnswer = {
              question_id: questionId,
              answer_text: a.answer_text,
              is_correct: a.is_correct,
              order: a.order,
            };
            await connection.query('INSERT INTO game_answers SET ?', newAnswer);
          }
        }
      }
    }

    await connection.commit();
    res.json({ msg: 'Juego actualizado correctamente' });

  } catch (err) {
    await connection.rollback();
    console.error(err.message);
    res.status(500).send('Error del Servidor');
  } finally {
    connection.release();
  }
});

module.exports = router;