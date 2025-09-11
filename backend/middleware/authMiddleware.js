const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authMiddleware = async (req, res, next) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // En lugar de confiar en el token, obtenemos los datos frescos de la BD
    const [rows] = await pool.query('SELECT id, role, status FROM users WHERE id = ?', [decoded.user.id]);
    const user = rows[0];

    if (!user) {
        return res.status(401).json({ msg: 'Usuario no encontrado.' });
    }

    if (user.status !== 'active') {
        return res.status(403).json({ msg: 'Tu cuenta está inactiva. Contacta al administrador.' });
    }

    // Adjuntamos el usuario fresco (con id, role, status) al request
    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({ msg: 'El token no es válido' });
  }
};

const isAdmin = (req, res, next) => {
    // Este middleware debe correr DESPUÉS de authMiddleware
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ msg: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};

module.exports = { authMiddleware, isAdmin };