const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Obtener el token de la cabecera de autorización
  const authHeader = req.header('Authorization');

  // Verificar si la cabecera existe
  if (!authHeader) {
    return res.status(401).json({ msg: 'No hay token, autorización denegada' });
  }

  // Verificar si el token tiene el formato correcto (Bearer <token>)
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ msg: 'Token mal formado' });
  }

  const token = tokenParts[1];

  // Verificar el token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Añadir el usuario decodificado (del payload del token) al objeto request
    req.user = decoded.user;
    next(); // Pasar al siguiente middleware o a la ruta
  } catch (err) {
    res.status(401).json({ msg: 'El token no es válido' });
  }
};

module.exports = authMiddleware;
