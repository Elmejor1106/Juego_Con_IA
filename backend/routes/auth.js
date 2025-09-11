
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  console.log('\n--- [POST /api/auth/register] --- ');
  const { email, password, username } = req.body;
  console.log('1. Datos recibidos:', { username, email, password: '[OCULTO]' });

  if (!email || !password || !username) {
    console.log('Error: Faltan campos.');
    return res.status(400).json({ msg: 'Por favor, introduce todos los campos' });
  }

  try {
    console.log('2. Verificando si el usuario ya existe...');
    const [existingUser] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
    console.log('3. Resultado de la verificación:', existingUser);

    if (existingUser.length > 0) {
      console.log('Error: El usuario ya existe.');
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    console.log('4. Hasheando la contraseña...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('5. Contraseña hasheada.');

    console.log('6. Insertando nuevo usuario en la base de datos...');
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, role, status) VALUES (?, ?, ?, \'user\', \'active\')',
      [username, email, hashedPassword]
    );
    console.log('7. Resultado de la inserción:', result);
    const userId = result.insertId;

    // Obtener el rol recién asignado (por defecto 'user')
    const [userRows] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    const userRole = userRows.length > 0 ? userRows[0].role : 'user';

    console.log(`8. Creando JWT para el usuario con ID: ${userId}, nombre: ${username}, rol: ${userRole}`);
    const payload = { user: { id: userId, username: username, role: userRole } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        console.log('9. JWT creado y enviado como respuesta.');
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error('--- ¡ERROR EN EL PROCESO DE REGISTRO! ---');
    console.error(err);
    res.status(500).send('Error del servidor (revisa la consola del backend)');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Por favor, introduce todos los campos' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username, // Añadido para que esté disponible en el frontend
        role: user.role,
        status: user.status
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error del servidor');
  }
});

// @route   POST api/auth/request-password-reset
// @desc    Request a password reset email
// @access  Public
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'Por favor, introduce un email' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Por seguridad, no revelamos si el usuario existe o no.
      return res.json({ msg: 'Si existe una cuenta con este email, se ha enviado un enlace para resetear la contraseña.' });
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const tokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [hashedToken, tokenExpiry, user.id]
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: '"Juego Rápido" <noreply@juegorapido.com>',
      to: user.email,
      subject: 'Reseteo de Contraseña',
      html: `
        <p>Has solicitado un reseteo de contraseña.</p>
        <p>Haz clic en este <a href="${resetUrl}">enlace</a> para establecer una nueva contraseña.</p>
        <p>Este enlace expirará en 1 hora.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ msg: 'Si existe una cuenta con este email, se ha enviado un enlace para resetear la contraseña.' });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// @route   POST api/auth/reset-password
// @desc    Reset a user's password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  console.log('\n--- [POST /api/auth/reset-password] --- ');
  console.log('1. Token recibido:', token);
  console.log('2. Nueva contraseña recibida (longitud):', newPassword.length);

  if (!token || !newPassword) {
    console.log('Error: Faltan datos.');
    return res.status(400).json({ msg: 'Faltan datos para el reseteo.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    console.log('3. Token hasheado para búsqueda:', hashedToken);

    const [users] = await pool.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
      [hashedToken]
    );

    if (users.length === 0) {
      console.log('Error: Token no encontrado o expirado.');
      return res.status(400).json({ msg: 'El token de reseteo es inválido o ha expirado.' });
    }

    const user = users[0];
    console.log('4. Usuario encontrado:', user.email);

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);
    console.log('5. Nueva contraseña hasheada:', newHashedPassword);

    await pool.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [newHashedPassword, user.id]
    );
    console.log('6. Base de datos actualizada para el usuario:', user.email);

    res.json({ msg: 'Tu contraseña ha sido actualizada exitosamente.' });

  } catch (err) {
    console.error('--- ¡ERROR EN EL PROCESO DE RESETEO! ---');
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

module.exports = router;
