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
    // Obtener juegos propios y colaboraciones en una sola consulta
    const [games] = await pool.query(
      `SELECT 
        g.id, 
        g.title, 
        g.description, 
        g.is_public, 
        g.created_at, 
        t.name as template_name,
        CASE 
          WHEN g.user_id = ? THEN 'owner'
          WHEN gc.user_id IS NOT NULL THEN 'collaborator'
          ELSE 'owner'
        END as role,
        CASE 
          WHEN g.user_id = ? THEN NULL
          ELSE u.username
        END as owner_name
       FROM games g 
       JOIN game_templates t ON g.template_id = t.id 
       LEFT JOIN game_collaborators gc ON g.id = gc.game_id AND gc.user_id = ?
       LEFT JOIN users u ON g.user_id = u.id
       WHERE g.user_id = ? OR gc.user_id = ?
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id]
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
  const { title, description, template_id, is_public, questions, styles, layout } = req.body;
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
      // Store layout as a JSON string always so the DB CHECK (json_valid) accepts it
      layout: layout ? JSON.stringify(layout) : null,
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
            console.log('Inserting question (POST) into DB:', newQuestion);
        const [questionResult] = await connection.query('INSERT INTO game_questions SET ?', newQuestion);
        const questionId = questionResult.insertId;
            console.log('Inserted question (POST) id:', questionId, 'image_url:', newQuestion.image_url);

        if (q.answers && Array.isArray(q.answers)) {
          for (const [ansIndex, a] of q.answers.entries()) {
            const newAnswer = {
              question_id: questionId,
              answer_text: a.answer_text,
              is_correct: a.is_correct || false,
              order: a.order !== undefined && a.order !== null ? a.order : ansIndex,
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
    const [gameResult] = await pool.query('SELECT id, title, description, template_id, styles, layout, is_public FROM games WHERE id = ?', [gameId]);

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

    // Try to parse styles and layout JSON if stored as strings
    try {
      if (game.styles && typeof game.styles === 'string') {
        try { game.styles = JSON.parse(game.styles); } catch (e) { /* keep as string */ }
      }
      if (game.layout && typeof game.layout === 'string') {
        // If the stored layout is a JSON object string, parse it; otherwise keep as string key
        try {
          const parsed = JSON.parse(game.layout);
          game.layout = parsed;
        } catch (e) {
          // keep as simple string key
        }
      }
    } catch (err) {
      console.warn('Failed to parse styles/layout:', err);
    }

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
  const { title, description, is_public, questions, styles, layout } = req.body;
  console.log('--- PUT /api/games/:id body ---', req.body);
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
      'UPDATE games SET title = ?, description = ?, is_public = ?, styles = ?, layout = ? WHERE id = ?',
      [title, description, is_public, styles ? JSON.stringify(styles) : null, layout ? JSON.stringify(layout) : null, gameId]
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
        console.log('Inserting question (PUT) into DB:', newQuestion);
        const [questionResult] = await connection.query('INSERT INTO game_questions SET ?', newQuestion);
        const questionId = questionResult.insertId;
        if (q.answers && Array.isArray(q.answers)) {
          for (const [ansIndex, a] of q.answers.entries()) {
            const newAnswer = {
              question_id: questionId,
              answer_text: a.answer_text,
              is_correct: a.is_correct || false,
              order: a.order !== undefined && a.order !== null ? a.order : ansIndex,
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

// @route   GET api/games/public/:id
// @desc    Obtener un juego sin autenticación (para multijugador)
// @access  Public
router.get('/public/:id', async (req, res) => {
  const gameId = req.params.id;
  console.log(`🔓 [Public Game] Solicitando juego ${gameId} sin autenticación`);
  
  try {
    // Obtener información básica del juego
    const [gameRows] = await pool.query(`
      SELECT g.*, t.name as template_name
      FROM games g
      LEFT JOIN game_templates t ON g.template_id = t.id
      WHERE g.id = ?
    `, [gameId]);

    if (gameRows.length === 0) {
      console.log(`❌ [Public Game] Juego ${gameId} no encontrado`);
      return res.status(404).json({ message: 'Juego no encontrado' });
    }

    const game = gameRows[0];
    console.log(`✅ [Public Game] Juego encontrado: ${game.title}`);

    // Obtener preguntas y respuestas
    const [questionsRows] = await pool.query(`
      SELECT q.*, GROUP_CONCAT(DISTINCT a.answer_text ORDER BY a.id SEPARATOR '|') as options,
             GROUP_CONCAT(DISTINCT CASE WHEN a.is_correct = 1 THEN a.answer_text END) as correct_answer_text
      FROM game_questions q
      LEFT JOIN game_answers a ON q.id = a.question_id
      WHERE q.game_id = ?
      GROUP BY q.id
      ORDER BY q.id
    `, [gameId]);

    // Formatear las preguntas para el frontend
    const questions = questionsRows.map((q, index) => {
      const options = q.options ? q.options.split('|') : [];
      const correctAnswerText = q.correct_answer_text;
      const correct_answer = options.indexOf(correctAnswerText);
      
      return {
        id: q.id,
        question: q.question_text,
        options: options,
        correct_answer: correct_answer >= 0 ? correct_answer : 0,
        image_url: q.image_url
      };
    });

    const gameData = {
      id: game.id,
      title: game.title,
      description: game.description,
      questions: questions,
      template: { name: game.template_name || 'Juego Multijugador' },
      styles: game.styles ? JSON.parse(game.styles) : {},
      layout: game.layout ? JSON.parse(game.layout) : {}
    };

    console.log(`📤 [Public Game] Enviando ${questions.length} preguntas`);
    res.json(gameData);

  } catch (err) {
    console.error('❌ [Public Game] Error:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// === FUNCIONALIDAD DE COMPARTIR JUEGOS ===

// @route   POST api/games/:id/share
// @desc    Crear enlace para compartir un juego (ver o ver/editar)
// @access  Private (solo el dueño del juego)
router.post('/:id/share', authMiddleware, async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user.id;
  const { permissionLevel } = req.body;

  // Validar permissionLevel
  if (!permissionLevel || !['view', 'edit'].includes(permissionLevel)) {
    return res.status(400).json({ msg: 'Nivel de permiso inválido. Debe ser "view" o "edit"' });
  }

  try {
    // Verificar que el usuario es el dueño del juego
    const [gameRows] = await pool.query('SELECT user_id FROM games WHERE id = ?', [gameId]);
    
    if (gameRows.length === 0) {
      return res.status(404).json({ msg: 'Juego no encontrado' });
    }
    
    if (gameRows[0].user_id !== userId) {
      return res.status(403).json({ msg: 'Solo el dueño del juego puede compartirlo' });
    }

    // Verificar si ya existe un enlace compartido para este juego con el mismo permiso
    const [existingShare] = await pool.query(
      'SELECT share_token FROM game_shares WHERE game_id = ? AND owner_id = ? AND permission_level = ?', 
      [gameId, userId, permissionLevel]
    );

    let shareToken;
    
    if (existingShare.length > 0) {
      // Usar el token existente
      shareToken = existingShare[0].share_token;
    } else {
      // Generar nuevo token único
      shareToken = require('crypto').randomBytes(32).toString('hex');
      
      // Insertar nuevo enlace compartido
      await pool.query(
        'INSERT INTO game_shares (game_id, owner_id, share_token, permission_level) VALUES (?, ?, ?, ?)',
        [gameId, userId, shareToken, permissionLevel]
      );
    }

    // Construir URL completa
    const shareUrl = `${req.protocol}://${req.get('host').replace('5003', '3001')}/shared/${shareToken}`;

    res.json({
      shareToken,
      shareUrl,
      permissionLevel
    });

  } catch (err) {
    console.error('Error al crear enlace compartido:', err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
});

// @route   GET api/games/shared/:token
// @desc    Acceder a un juego compartido mediante token
// @access  Private (requiere autenticación)
router.get('/shared/:token', authMiddleware, async (req, res) => {
  const shareToken = req.params.token;
  const currentUserId = req.user.id;

  try {
    // Buscar el enlace compartido
    const [shareRows] = await pool.query(`
      SELECT gs.*, g.title, g.description, g.user_id as owner_id, u.username as owner_name
      FROM game_shares gs
      JOIN games g ON gs.game_id = g.id
      JOIN users u ON gs.owner_id = u.id
      WHERE gs.share_token = ?
    `, [shareToken]);

    if (shareRows.length === 0) {
      return res.status(404).json({ msg: 'Enlace compartido no válido o expirado' });
    }

    const shareInfo = shareRows[0];
    const gameId = shareInfo.game_id;

    // Si el permiso es 'edit', agregar como colaborador (si no lo es ya)
    if (shareInfo.permission_level === 'edit' && currentUserId !== shareInfo.owner_id) {
      try {
        await pool.query(
          'INSERT IGNORE INTO game_collaborators (game_id, user_id, owner_id) VALUES (?, ?, ?)',
          [gameId, currentUserId, shareInfo.owner_id]
        );
      } catch (err) {
        console.warn('Error adding collaborator (might already exist):', err);
      }
    }

    // Obtener el juego completo con preguntas y respuestas
    const [gameResult] = await pool.query('SELECT id, title, description, template_id, styles, layout, is_public FROM games WHERE id = ?', [gameId]);
    
    if (gameResult.length === 0) {
      return res.status(404).json({ msg: 'Juego no encontrado' });
    }

    const game = gameResult[0];

    // Obtener preguntas y respuestas
    const [questionsRows] = await pool.query(`
      SELECT q.*, GROUP_CONCAT(DISTINCT a.answer_text ORDER BY a.id SEPARATOR '|') as options,
             GROUP_CONCAT(DISTINCT CASE WHEN a.is_correct = 1 THEN a.answer_text END) as correct_answer_text
      FROM game_questions q
      LEFT JOIN game_answers a ON q.id = a.question_id
      WHERE q.game_id = ?
      GROUP BY q.id
      ORDER BY q.order, q.id
    `, [gameId]);

    // Procesar preguntas
    const questions = questionsRows.map(q => ({
      id: q.id,
      question: q.question_text,
      imageUrl: q.image_url,
      options: q.options ? q.options.split('|') : [],
      correct_answer: q.correct_answer_text || '',
      order: q.order
    }));

    game.questions = questions;

    // Parsear styles y layout si existen
    try {
      if (game.styles && typeof game.styles === 'string') {
        game.styles = JSON.parse(game.styles);
      }
      if (game.layout && typeof game.layout === 'string') {
        game.layout = JSON.parse(game.layout);
      }
    } catch (err) {
      console.warn('Failed to parse styles/layout:', err);
    }

    res.json({
      game,
      shareInfo: {
        permissionLevel: shareInfo.permission_level,
        ownerName: shareInfo.owner_name,
        sharedAt: shareInfo.created_at,
        isOwner: currentUserId === shareInfo.owner_id
      },
      isShared: true,
      readOnly: shareInfo.permission_level === 'view'
    });

  } catch (err) {
    console.error('Error al acceder a juego compartido:', err);
    res.status(500).json({ msg: 'Error del servidor' });
  }
});

module.exports = router;