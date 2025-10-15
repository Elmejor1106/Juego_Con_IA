const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

// Guardar puntuación del usuario
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { gameId, score, totalQuestions, percentage } = req.body;
    const userId = req.user.id;

    if (!gameId || score === undefined || !totalQuestions) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Insertar la nueva puntuación
    const query = `
      INSERT INTO rankings (user_id, game_id, score, total_questions, percentage, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(query, [userId, gameId, score, totalQuestions, percentage]);

    res.status(201).json({ 
      message: 'Puntuación guardada exitosamente',
      rankingId: result.insertId 
    });
  } catch (error) {
    console.error('Error al guardar puntuación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener ranking de un juego específico
router.get('/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const query = `
      SELECT 
        r.id,
        r.user_id,
        u.username,
        r.score,
        r.total_questions,
        r.percentage,
        r.created_at,
        ROW_NUMBER() OVER (ORDER BY r.percentage DESC, r.score DESC, r.created_at ASC) as position
      FROM rankings r
      JOIN users u ON r.user_id = u.id
      WHERE r.game_id = ?
      ORDER BY r.percentage DESC, r.score DESC, r.created_at ASC
      LIMIT ?
    `;

    const [rankings] = await db.execute(query, [gameId, limit]);
    res.json(rankings);
  } catch (error) {
    console.error('Error al obtener ranking del juego:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener ranking global (todas las puntuaciones)
router.get('/global', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const query = `
      SELECT 
        r.id,
        r.user_id,
        u.username,
        g.title as game_title,
        r.score,
        r.total_questions,
        r.percentage,
        r.created_at,
        ROW_NUMBER() OVER (ORDER BY r.percentage DESC, r.score DESC, r.created_at ASC) as position
      FROM rankings r
      JOIN users u ON r.user_id = u.id
      JOIN games g ON r.game_id = g.id
      ORDER BY r.percentage DESC, r.score DESC, r.created_at ASC
      LIMIT ?
    `;

    const [rankings] = await db.execute(query, [limit]);
    res.json(rankings);
  } catch (error) {
    console.error('Error al obtener ranking global:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener mejor puntuación del usuario para un juego
router.get('/user-best/:gameId', authMiddleware, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user.id;

    const query = `
      SELECT 
        MAX(score) as best_score,
        MAX(percentage) as best_percentage,
        COUNT(*) as attempts
      FROM rankings 
      WHERE user_id = ? AND game_id = ?
    `;

    const [result] = await db.execute(query, [userId, gameId]);
    res.json(result[0] || { best_score: 0, best_percentage: 0, attempts: 0 });
  } catch (error) {
    console.error('Error al obtener mejor puntuación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del usuario
router.get('/user-stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        COUNT(*) as total_games_played,
        AVG(percentage) as average_percentage,
        MAX(percentage) as best_percentage,
        COUNT(DISTINCT game_id) as unique_games_played
      FROM rankings 
      WHERE user_id = ?
    `;

    const [result] = await db.execute(query, [userId]);
    res.json(result[0] || { 
      total_games_played: 0, 
      average_percentage: 0, 
      best_percentage: 0, 
      unique_games_played: 0 
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;