const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

// @route   GET /api/stats
// @desc    Obtener estadísticas para el dashboard (dinámico por rol)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  const { id, role } = req.user;

  console.log('🔍 [STATS DEBUG] Petición recibida - User ID:', id, 'Role:', role);

  try {
    let stats = {};

    if (role === 'admin') {
      console.log('🔍 [STATS DEBUG] Procesando estadísticas de ADMIN');
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
      console.log('🔍 [STATS DEBUG] Procesando estadísticas de USUARIO - ID:', id);
      // Estadísticas para el Usuario normal
      const [gamesCreated] = await pool.query('SELECT COUNT(*) as count FROM games WHERE user_id = ?', [id]);
      const [gamesPlayed] = await pool.query('SELECT COUNT(*) as count FROM game_plays WHERE user_id = ?', [id]);
      
      console.log('🔍 [STATS DEBUG] Juegos creados resultado:', gamesCreated[0]);
      console.log('🔍 [STATS DEBUG] Partidas jugadas resultado:', gamesPlayed[0]);
      
      stats = {
        gamesCreated: gamesCreated[0].count,
        gamesPlayed: gamesPlayed[0].count,
        // Se puede añadir logros o rachas en el futuro aquí
        achievements: 0, 
      };
    }

    console.log('🔍 [STATS DEBUG] Enviando stats:', stats);
    res.json(stats);

  } catch (err) {
    console.error('Error al obtener estadísticas:', err.message);
    res.status(500).send('Error del Servidor');
  }
});

// @route   GET /api/stats/personal
// @desc    Obtener estadísticas personales del usuario (independientemente del rol)
// @access  Private
router.get('/personal', authMiddleware, async (req, res) => {
  const { id } = req.user;

  console.log('🔍 [STATS DEBUG] Petición personal recibida - User ID:', id);

  try {
    // Siempre devolver estadísticas personales del usuario
    const [gamesCreated] = await pool.query('SELECT COUNT(*) as count FROM games WHERE user_id = ?', [id]);
    const [gamesPlayed] = await pool.query('SELECT COUNT(*) as count FROM game_plays WHERE user_id = ?', [id]);
    
    console.log('🔍 [STATS DEBUG] Juegos creados resultado personal:', gamesCreated[0]);
    console.log('🔍 [STATS DEBUG] Partidas jugadas resultado personal:', gamesPlayed[0]);
    
    const stats = {
      gamesCreated: gamesCreated[0].count,
      gamesPlayed: gamesPlayed[0].count,
      achievements: 0, 
    };

    console.log('🔍 [STATS DEBUG] Enviando stats personales:', stats);
    res.json(stats);

  } catch (err) {
    console.error('Error al obtener estadísticas personales:', err.message);
    res.status(500).send('Error del Servidor');
  }
});

const axios = require('axios');

// @route   POST /api/stats/reports/users
// @desc    Generar un informe de usuarios llamando al microservicio de Python
// @access  Private (Admin)
router.post('/reports/users', authMiddleware, async (req, res) => {
  // Solo los admins pueden generar informes
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Acceso denegado' });
  }

  try {
    const pythonServiceUrl = 'http://127.0.0.1:8000/reports/users';

    // Llamamos al microservicio de Python pidiendo la respuesta como un stream
    const response = await axios({
      method: 'post',
      url: pythonServiceUrl,
      data: req.body, // Pasamos el cuerpo de la petición (ej. { "report_type": "ALL_USERS" })
      responseType: 'stream',
    });

    // Establecemos los headers para que el navegador sepa que es un PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');

    // Tuberiamos (pipe) la respuesta del microservicio directamente a la respuesta del cliente
    response.data.pipe(res);

  } catch (error) {
    console.error('Error al contactar el servicio de informes:', error.message);
    res.status(502).send('Error al generar el informe: no se pudo contactar el servicio de informes.');
  }
});

// @route   POST /api/stats/reports/games
// @desc    Generar un informe de juegos llamando al microservicio de Python
// @access  Private (Admin)
router.post('/reports/games', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Acceso denegado' });
  }

  try {
    const pythonServiceUrl = 'http://127.0.0.1:8000/reports/games';
    const response = await axios({
      method: 'post',
      url: pythonServiceUrl,
      data: req.body,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_juegos.pdf');
    response.data.pipe(res);

  } catch (error) {
    console.error('Error al contactar el servicio de informes:', error.message);
    res.status(502).send('Error al generar el informe: no se pudo contactar el servicio de informes.');
  }
});

// @route   GET /api/stats/reports/images
// @desc    Generar un informe de actividad de imágenes llamando al microservicio de Python
// @access  Private (Admin)
router.get('/reports/images', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Acceso denegado' });
  }

  try {
    const pythonServiceUrl = 'http://127.0.0.1:8000/reports/images';
    const response = await axios({
      method: 'get',
      url: pythonServiceUrl,
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_imagenes.pdf');
    response.data.pipe(res);

  } catch (error) {
    console.error('Error al contactar el servicio de informes:', error.message);
    res.status(502).send('Error al generar el informe: no se pudo contactar el servicio de informes.');
  }
});

module.exports = router;
