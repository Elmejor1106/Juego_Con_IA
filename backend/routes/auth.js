
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @route   POST api/auth/register
// @desc    Register a new user with email verification
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
    const [existingUser] = await pool.query('SELECT email, username FROM users WHERE email = ? OR username = ?', [email, username]);
    console.log('3. Resultado de la verificación:', existingUser);

    if (existingUser.length > 0) {
      const existing = existingUser[0];
      if (existing.email === email) {
        console.log('Error: El email ya existe.');
        return res.status(400).json({ msg: 'Ya existe una cuenta con este correo electrónico' });
      }
      if (existing.username === username) {
        console.log('Error: El username ya existe.');
        return res.status(400).json({ msg: 'Ya existe una cuenta con este nombre de usuario' });
      }
    }

    console.log('4. Hasheando la contraseña...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('5. Contraseña hasheada.');

    // Generar token de verificación
    console.log('6. Generando token de verificación...');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 3600000); // 24 horas

    console.log('7. Insertando nuevo usuario en la base de datos con verificación pendiente...');
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, role, email_verified, verification_token, verification_token_expires) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, 'user', false, hashedVerificationToken, tokenExpiry]
    );
    console.log('8. Usuario creado con ID:', result.insertId);

    // Configurar nodemailer
    console.log('9. Configurando email para verificación...');
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

    // Enviar correo de verificación
    // Detectar entorno para generar URL correcta
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'https://tu-dominio.com'
      : 'http://localhost:3001';
    
    const verificationUrl = `${baseUrl}/verify-email/${verificationToken}`;
    console.log('🔗 URL de verificación generada:', verificationUrl);
    
    const mailOptions = {
      from: '"Juego Rápido" <noreply@juegorapido.com>',
      to: email,
      subject: '🎮 Verificación de Cuenta - Juego Rápido',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 0; border-radius: 15px; overflow: hidden;">
          <div style="background: rgba(255, 255, 255, 0.95); margin: 20px; border-radius: 15px; padding: 40px; backdrop-filter: blur(10px);">
            <h1 style="color: #1e293b; text-align: center; margin-bottom: 30px; font-size: 28px;">🎮 ¡Bienvenido a Juego Rápido!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Hola <strong>${username}</strong>,
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              ¡Gracias por registrarte en nuestra plataforma! Para completar tu registro y acceder a todas las funcionalidades, necesitas verificar tu correo electrónico.
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);">
                ✅ Verificar mi Correo
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-top: 25px;">
              <strong>Importante:</strong> Este enlace expirará en 24 horas. Si no verificas tu correo en este tiempo, deberás registrarte nuevamente.
            </p>
            <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 8px;">
              <p style="color: #1e293b; font-size: 13px; line-height: 1.5; margin: 0; font-weight: 600;">
                🔒 <strong>Políticas de Seguridad</strong>
              </p>
              <p style="color: #475569; font-size: 12px; line-height: 1.4; margin: 8px 0 0 0;">
                • Tu información personal está protegida con encriptación de grado militar<br>
                • Nunca compartimos tus datos con terceros<br>
                • Este enlace es único y solo funciona una vez<br>
                • Nuestros servidores cumplen con estándares internacionales de seguridad
              </p>
            </div>
            <hr style="border: none; height: 1px; background: #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Si no te registraste en Juego Rápido, puedes ignorar este correo de forma segura.
            </p>
          </div>
        </div>
      `,
    };

    console.log('10. Enviando correo de verificación...');
    await transporter.sendMail(mailOptions);
    console.log('11. Correo de verificación enviado exitosamente.');

    // No enviar token JWT - el usuario debe verificar primero
    res.status(201).json({ 
      msg: 'Usuario registrado exitosamente. Por favor, revisa tu correo electrónico para verificar tu cuenta antes de iniciar sesión.',
      requiresVerification: true 
    });
    
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
  console.log('\n--- [POST /api/auth/login] --- ');
  console.log('1. Headers recibidos:', req.headers);
  console.log('2. Body recibido:', req.body);
  
  const { email, password } = req.body;
  console.log('3. Datos extraídos:', { email, password: password ? '[PRESENTE]' : '[AUSENTE]' });

  if (!email || !password) {
    console.log('❌ Error: Faltan campos requeridos');
    return res.status(400).json({ msg: 'Por favor, introduce todos los campos' });
  }

  try {
    console.log('4. Buscando usuario en la base de datos...');
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('5. Resultado de la búsqueda:', users.length > 0 ? 'Usuario encontrado' : 'Usuario no encontrado');
    
    if (users.length === 0) {
      console.log('❌ Error: Usuario no existe');
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const user = users[0];
    console.log('6. Verificando contraseña...');

    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log('7. Resultado de verificación de contraseña:', isMatch ? 'CORRECTA' : 'INCORRECTA');
    
    if (!isMatch) {
      console.log('❌ Error: Contraseña incorrecta');
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    // NUEVA VERIFICACIÓN: Comprobar si el correo está verificado
    console.log('8. Verificando estado de verificación de correo...');
    console.log('   - email_verified:', user.email_verified);
    
    if (!user.email_verified) {
      console.log('❌ Error: Correo no verificado');
      return res.status(403).json({ 
        msg: 'Tu correo electrónico no ha sido verificado. Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación.',
        requiresVerification: true 
      });
    }

    // VERIFICACIÓN DEL ESTADO DE LA CUENTA
    console.log('9. Verificando estado de la cuenta...');
    console.log('   - status:', user.status);
    
    if (user.status !== 'active') {
      console.log('❌ Error: Cuenta inactiva');
      return res.status(403).json({ 
        msg: 'Tu cuenta se encuentra inactiva debido a una violación de nuestras políticas de seguridad o términos de uso. Para más información o para solicitar la reactivación de tu cuenta, contacta a nuestro equipo de soporte.',
        accountInactive: true 
      });
    }

    console.log('10. Generando JWT...');
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
        if (err) {
          console.log('❌ Error generando JWT:', err);
          throw err;
        }
        console.log('✅ Login exitoso para usuario verificado:', user.username);
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

    const resetUrl = `http://localhost:3001/reset-password/${resetToken}`;
    const mailOptions = {
      from: '"Juego Rápido" <noreply@juegorapido.com>',
      to: user.email,
      subject: '🔐 Restablecimiento de Contraseña - Juego Rápido',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 0; border-radius: 15px; overflow: hidden;">
          <div style="background: rgba(255, 255, 255, 0.95); margin: 20px; border-radius: 15px; padding: 40px; backdrop-filter: blur(10px);">
            <h1 style="color: #1e293b; text-align: center; margin-bottom: 30px; font-size: 28px;">🔐 Restablecimiento de Contraseña</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Hola,
            </p>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Has solicitado restablecer tu contraseña en <strong>Juego Rápido</strong>. Si no fuiste tú, puedes ignorar este correo de forma segura.
            </p>
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.3);">
                🔑 Restablecer mi Contraseña
              </a>
            </div>
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0; border-radius: 8px;">
              <p style="color: #1e293b; font-size: 13px; line-height: 1.5; margin: 0; font-weight: 600;">
                ⚠️ <strong>Importante - Seguridad</strong>
              </p>
              <p style="color: #475569; font-size: 12px; line-height: 1.4; margin: 8px 0 0 0;">
                • Este enlace expirará en <strong>1 hora</strong><br>
                • Solo funciona una vez<br>
                • Si no solicitaste este cambio, ignora este correo<br>
                • Nunca compartas este enlace con nadie
              </p>
            </div>
            <hr style="border: none; height: 1px; background: #e2e8f0; margin: 30px 0;">
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
              <span style="color: #6366f1; word-break: break-all;">${resetUrl}</span>
            </p>
          </div>
        </div>
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

// @route   GET api/auth/verify-email/:token
// @desc    Verify user email with token
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  console.log('\n--- [GET /api/auth/verify-email] --- ');
  const { token } = req.params;
  console.log('1. Token de verificación recibido:', token ? '[PRESENTE]' : '[AUSENTE]');

  if (!token) {
    console.log('Error: No se proporcionó token de verificación');
    return res.status(400).json({ msg: 'Token de verificación requerido' });
  }

  try {
    console.log('2. Hasheando token para búsqueda en BD...');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    console.log('3. Buscando usuario con token de verificación...');
    const [users] = await pool.query(
      'SELECT id, username, email, email_verified, verification_token_expires FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
      [hashedToken]
    );

    if (users.length === 0) {
      console.log('Error: Token inválido o expirado');
      return res.status(400).json({ msg: 'Token de verificación inválido o expirado. Por favor, regístrate nuevamente.' });
    }

    const user = users[0];
    console.log('4. Usuario encontrado:', { id: user.id, email: user.email, verified: user.email_verified });

    if (user.email_verified) {
      console.log('Aviso: El correo ya está verificado');
      return res.status(200).json({ msg: 'Tu correo ya ha sido verificado. Puedes iniciar sesión.' });
    }

    console.log('5. Actualizando estado de verificación...');
    await pool.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [user.id]
    );
    console.log('6. Correo verificado exitosamente para:', user.email);

    // Redirect to a success page or return success message
    res.status(200).json({ 
      msg: '¡Correo verificado exitosamente! Ahora puedes iniciar sesión en tu cuenta.',
      verified: true 
    });

  } catch (err) {
    console.error('--- ¡ERROR EN LA VERIFICACIÓN DE CORREO! ---');
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

// @route   POST api/auth/refresh
// @desc    Refresh a valid JWT token
// @access  Private (requires valid token)
router.post('/refresh', async (req, res) => {
  console.log('\n--- [POST /api/auth/refresh] --- ');
  
  // Obtener el token de la cabecera de autorización
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Token mal formado' });
  }

  const token = tokenParts[1];

  try {
    // Verificar el token actual (incluso si está próximo a expirar)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('1. Token actual válido para usuario:', decoded.user.username);
    
    // Verificar que el usuario aún existe en la base de datos
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.user.id]);
    
    if (users.length === 0) {
      console.log('Error: Usuario no encontrado en la base de datos');
      return res.status(401).json({ msg: 'Usuario no válido' });
    }
    
    const user = users[0];
    
    // Crear un nuevo token con tiempo extendido
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 }, // Nueva hora completa
      (err, newToken) => {
        if (err) {
          console.error('Error creando nuevo token:', err);
          return res.status(500).json({ msg: 'Error del servidor' });
        }
        console.log('2. Nuevo token creado y enviado');
        res.json({ token: newToken });
      }
    );
    
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.log('Token expirado, no se puede renovar');
      return res.status(401).json({ msg: 'Token expirado, inicia sesión nuevamente' });
    }
    console.error('Error verificando token:', err);
    res.status(401).json({ msg: 'Token inválido' });
  }
});

module.exports = router;
