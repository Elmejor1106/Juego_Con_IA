const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Función para generar hash de sesión basado en token JWT
const generateSessionHash = (token, userId) => {
  if (!token || !userId) return null;
  return crypto.createHash('sha256').update(`${token}_${userId}_${Date.now()}`).digest('hex').substring(0, 32);
};

// Función para validar acceso al perfil
const validateProfileAccess = (requestingUserId, profileUserId, userRole) => {
  // El usuario puede acceder a su propio perfil o admin puede acceder a cualquiera
  return requestingUserId.toString() === profileUserId.toString() || userRole === 'admin';
};

// Rutas de perfil de usuario (requieren autenticación pero no admin)
// @route   GET /api/users/:id/profile
// @desc    Obtener perfil de un usuario específico
// @access  Authenticated (el usuario puede ver su propio perfil o admin puede ver cualquiera)
router.get('/:id/profile', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const requestingUserId = req.user.id;
  const token = req.header('Authorization')?.split(' ')[1];
  
  console.log(`🔍 [GET Profile] Usuario ${requestingUserId} solicita perfil de usuario ${userId}`);
  
  // Verificar que el usuario puede acceder a este perfil
  if (!validateProfileAccess(requestingUserId, userId, req.user.role)) {
    console.log(`❌ [GET Profile] Acceso denegado: Usuario ${requestingUserId} no puede acceder al perfil ${userId}`);
    return res.status(403).json({ msg: 'No tienes permiso para acceder a este perfil' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Verificar primero que el usuario objetivo existe y está activo
    const [users] = await connection.query(
      'SELECT id, status, username FROM users WHERE id = ? FOR UPDATE', 
      [userId]
    );
    
    if (users.length === 0) {
      await connection.rollback();
      console.log(`❌ [GET Profile] Usuario objetivo ${userId} no encontrado`);
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    const targetUser = users[0];
    if (targetUser.status !== 'active') {
      await connection.rollback();
      console.log(`❌ [GET Profile] Usuario objetivo ${userId} está inactivo`);
      return res.status(403).json({ msg: 'El usuario está inactivo' });
    }

    // Generar hash de sesión
    const sessionHash = generateSessionHash(token, requestingUserId);

    const [profiles] = await connection.query(`
      SELECT 
        up.id,
        up.user_id,
        up.first_name,
        up.last_name,
        up.phone,
        up.birth_date,
        up.bio,
        up.avatar_url,
        up.created_at,
        up.updated_at,
        up.is_orphaned,
        up.last_accessed_by,
        up.last_access_time
      FROM user_profiles up 
      WHERE up.user_id = ? AND (up.is_orphaned = FALSE OR up.is_orphaned IS NULL)
    `, [userId]);

    let profile;
    
    if (profiles.length === 0) {
      console.log(`📝 [GET Profile] Creando perfil vacío para usuario ${userId}`);
      // Si no existe perfil, crear uno vacío de forma segura
      const [insertResult] = await connection.query(
        `INSERT INTO user_profiles 
         (user_id, created_at, updated_at, is_orphaned, last_accessed_by, last_access_time, session_token_hash) 
         VALUES (?, NOW(), NOW(), FALSE, ?, NOW(), ?)`,
        [userId, requestingUserId, sessionHash]
      );
      
      profile = {
        id: insertResult.insertId,
        user_id: userId,
        first_name: null,
        last_name: null,
        phone: null,
        birth_date: null,
        bio: null,
        avatar_url: null,
        is_orphaned: false
      };
    } else {
      profile = profiles[0];
      
      // Actualizar información de acceso
      await connection.query(
        `UPDATE user_profiles 
         SET last_accessed_by = ?, last_access_time = NOW(), session_token_hash = ?
         WHERE id = ?`,
        [requestingUserId, sessionHash, profile.id]
      );
      
      console.log(`✅ [GET Profile] Perfil ${profile.id} accedido por usuario ${requestingUserId}`);
    }

    await connection.commit();
    
    // Eliminar campos internos antes de enviar respuesta
    delete profile.last_accessed_by;
    delete profile.last_access_time;
    
    res.json(profile);
    
  } catch (err) {
    await connection.rollback();
    console.error(`❌ [GET Profile] Error al obtener perfil de usuario ${userId}:`, err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  } finally {
    connection.release();
  }
});

// @route   PUT /api/users/:id/profile
// @desc    Actualizar perfil de un usuario
// @access  Authenticated (el usuario puede actualizar su propio perfil o admin puede actualizar cualquiera)
router.put('/:id/profile', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const requestingUserId = req.user.id;
  const { first_name, last_name, phone, birth_date, bio, avatar_url } = req.body;
  const token = req.header('Authorization')?.split(' ')[1];
  
  console.log(`🔄 [PUT Profile] Usuario ${requestingUserId} actualiza perfil de usuario ${userId}`);
  
  // Verificar que el usuario puede editar este perfil
  if (!validateProfileAccess(requestingUserId, userId, req.user.role)) {
    console.log(`❌ [PUT Profile] Acceso denegado: Usuario ${requestingUserId} no puede editar perfil ${userId}`);
    return res.status(403).json({ msg: 'No tienes permiso para editar este perfil' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Verificar que el usuario objetivo existe y está activo
    const [users] = await connection.query(
      'SELECT id, status, username FROM users WHERE id = ? FOR UPDATE', 
      [userId]
    );
    
    if (users.length === 0) {
      await connection.rollback();
      console.log(`❌ [PUT Profile] Usuario objetivo ${userId} no encontrado`);
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }
    
    const targetUser = users[0];
    if (targetUser.status !== 'active') {
      await connection.rollback();
      console.log(`❌ [PUT Profile] Usuario objetivo ${userId} está inactivo`);
      return res.status(403).json({ msg: 'No se puede actualizar el perfil de un usuario inactivo' });
    }

    // Generar hash de sesión
    const sessionHash = generateSessionHash(token, requestingUserId);

    // Verificar si ya existe un perfil (excluyendo huérfanos y verificando ownership)
    const [existingProfiles] = await connection.query(
      `SELECT id, user_id, last_accessed_by, session_token_hash,
              first_name, last_name, phone, birth_date, bio, avatar_url
       FROM user_profiles 
       WHERE user_id = ? AND (is_orphaned = FALSE OR is_orphaned IS NULL)
       FOR UPDATE`, 
      [userId]
    );
    
    if (existingProfiles.length === 0) {
      console.log(`📝 [PUT Profile] Creando nuevo perfil para usuario ${userId}`);
      // Crear nuevo perfil
      await connection.query(`
        INSERT INTO user_profiles 
        (user_id, first_name, last_name, phone, birth_date, bio, avatar_url, 
         created_at, updated_at, is_orphaned, last_accessed_by, last_access_time, session_token_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), FALSE, ?, NOW(), ?)
      `, [userId, first_name, last_name, phone, birth_date, bio, avatar_url, requestingUserId, sessionHash]);
    } else {
      const existingProfile = existingProfiles[0];
      
      // Verificar integridad de la sesión para prevenir modificaciones cruzadas
      if (existingProfile.last_accessed_by && 
          existingProfile.last_accessed_by !== requestingUserId && 
          req.user.role !== 'admin') {
        await connection.rollback();
        console.log(`⚠️ [PUT Profile] Posible acceso cruzado detectado en perfil ${existingProfile.id}`);
        return res.status(409).json({ 
          msg: 'Conflicto de sesión detectado. Por favor, recarga la página e intenta nuevamente.' 
        });
      }
      
      console.log(`✏️ [PUT Profile] Actualizando perfil existente ${existingProfile.id} para usuario ${userId}`);
      
      // Construir campos a actualizar solo con los que se proporcionan
      const fieldsToUpdate = {};
      if (first_name !== undefined) fieldsToUpdate.first_name = first_name;
      if (last_name !== undefined) fieldsToUpdate.last_name = last_name;
      if (phone !== undefined) fieldsToUpdate.phone = phone;
      if (birth_date !== undefined) fieldsToUpdate.birth_date = birth_date;
      if (bio !== undefined) fieldsToUpdate.bio = bio;
      if (avatar_url !== undefined) fieldsToUpdate.avatar_url = avatar_url;
      
      // Siempre actualizar campos de control
      fieldsToUpdate.updated_at = new Date();
      fieldsToUpdate.is_orphaned = false;
      fieldsToUpdate.last_accessed_by = requestingUserId;
      fieldsToUpdate.last_access_time = new Date();
      fieldsToUpdate.session_token_hash = sessionHash;
      
      // Construir query dinámico
      const updateFields = Object.keys(fieldsToUpdate);
      const updateValues = Object.values(fieldsToUpdate);
      const setClause = updateFields.map(field => `${field} = ?`).join(', ');
      
      await connection.query(`
        UPDATE user_profiles 
        SET ${setClause}
        WHERE user_id = ? AND id = ?
      `, [...updateValues, userId, existingProfile.id]);
      
      console.log(`✅ [PUT Profile] Campos actualizados:`, Object.keys(fieldsToUpdate));
    }

    await connection.commit();
    console.log(`✅ [PUT Profile] Perfil actualizado exitosamente para usuario ${userId} por ${requestingUserId}`);
    res.json({ msg: 'Perfil actualizado correctamente' });
    
  } catch (err) {
    await connection.rollback();
    console.error(`❌ [PUT Profile] Error al actualizar perfil de usuario ${userId}:`, err.message);
    res.status(500).json({ msg: 'Error del servidor' });
  } finally {
    connection.release();
  }
});

// Proteger las rutas administrativas con autenticación y rol de admin
router.use(authMiddleware, isAdmin);

// @route   GET /api/users
// @desc    Obtener todos los usuarios
// @access  Admin
router.get('/', async (req, res) => {
  console.log('--- [GET /api/users] --- Recibida petición para obtener todos los usuarios.');
  console.log('Usuario que realiza la petición (desde middleware):', req.user);
  try {
    const [users] = await pool.query('SELECT id, username, email, role, status, created_at FROM users ORDER BY created_at DESC');
    console.log(`Se encontraron ${users.length} usuarios en la base de datos.`);
    res.json(users);
  } catch (err) {
    console.error('Error al consultar la base de datos:', err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   POST /api/users
// @desc    Crear un nuevo usuario (por un admin)
// @access  Admin
router.post('/', async (req, res) => {
  const { username, email, password, role = 'user', status = 'active' } = req.body;

  // Validaciones básicas
  if (!username || !email || !password) {
    return res.status(400).json({ msg: 'Por favor, incluye username, email y password.' });
  }

  try {
    // Verificar si el usuario ya existe
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ msg: 'El email o username ya está en uso.' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insertar en la base de datos
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, password_hash, role, status]
    );

    const newUser = {
      id: result.insertId,
      username,
      email,
      role,
      status
    };

    res.status(201).json(newUser);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   PUT /api/users/:id
// @desc    Actualizar un usuario
// @access  Admin
router.put('/:id', async (req, res) => {
  const { username, email, role, status } = req.body;
  const userId = req.params.id;

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    // Construir objeto con los campos a actualizar
    const updateFields = {};
    if (username) updateFields.username = username;
    if (email) updateFields.email = email;
    if (role) updateFields.role = role;
    if (status) updateFields.status = status;

    if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ msg: 'No se proporcionaron campos para actualizar.' });
    }

    await pool.query('UPDATE users SET ? WHERE id = ?', [updateFields, userId]);

    res.json({ msg: 'Usuario actualizado correctamente' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   DELETE /api/users/:id
// @desc    Desactivar un usuario (soft delete)
// @access  Admin
router.delete('/:id', async (req, res) => {
    const userId = req.params.id;

    // Prevenir que un admin se desactive a sí mismo
    if (req.user.id.toString() === userId) {
        return res.status(400).json({ msg: 'No puedes desactivarte a ti mismo.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        // Verificar que el usuario existe
        const [userCheck] = await connection.query(
            'SELECT id, status FROM users WHERE id = ? FOR UPDATE', 
            [userId]
        );

        if (userCheck.length === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Actualizar status del usuario a inactive
        const [result] = await connection.query(
            "UPDATE users SET status = 'inactive' WHERE id = ?", 
            [userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        // Marcar el perfil como huérfano de forma explícita (por si el trigger falla)
        await connection.query(
            "UPDATE user_profiles SET is_orphaned = TRUE, updated_at = NOW() WHERE user_id = ?",
            [userId]
        );

        await connection.commit();
        res.json({ msg: 'Usuario desactivado correctamente' });
        
    } catch (err) {
        await connection.rollback();
        console.error('Error al desactivar usuario:', err.message);
        res.status(500).send('Error del servidor');
    } finally {
        connection.release();
    }
});

module.exports = router;
