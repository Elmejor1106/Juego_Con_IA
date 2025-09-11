const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   GET /api/stats
// @desc    Obtener estadísticas para el dashboard (dinámico por rol)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  const { id, role } = req.user;

  try {
    let stats = {};

    if (role === 'admin') {
      // Estadísticas para el Administrador
      const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
      const [gameCount] = await pool.query('SELECT COUNT(*) as count FROM games');
      const [playCount] = await pool.query('SELECT COUNT(*) as count FROM game_plays');

      stats = {
        totalUsers: userCount[0].count,
        totalGames: gameCount[0].count,
        totalPlays: playCount[0].count,
      };

    } else {
      // Estadísticas para el Usuario normal
      const [gamesCreated] = await pool.query('SELECT COUNT(*) as count FROM games WHERE user_id = ?', [id]);
      const [gamesPlayed] = await pool.query('SELECT COUNT(*) as count FROM game_plays WHERE user_id = ?', [id]);
      
      stats = {
        gamesCreated: gamesCreated[0].count,
        gamesPlayed: gamesPlayed[0].count,
        // Se puede añadir logros o rachas en el futuro aquí
        achievements: 0, 
      };
    }

    res.json(stats);

  } catch (err) {
    console.error('Error al obtener estadísticas:', err.message);
    res.status(500).send('Error del Servidor');
  }
});

module.exports = router;
