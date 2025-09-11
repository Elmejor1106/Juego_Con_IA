const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

// Proteger todas las rutas de este archivo con autenticación y rol de admin
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

    try {
        const [result] = await pool.query("UPDATE users SET status = 'inactive' WHERE id = ?", [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }

        res.json({ msg: 'Usuario desactivado correctamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del servidor');
    }
});

module.exports = router;
