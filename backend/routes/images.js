const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');
const axios = require('axios');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// @route   POST /api/images/upload
// @desc    Sube una imagen y la asocia con el usuario
// @access  Private
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ningún archivo.' });
    }

    const userId = req.user.id;
    const imageUrl = `/uploads/${req.file.filename}`;
    const originalFilename = req.file.originalname;

    const query = 'INSERT INTO images (user_id, image_url, filename) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [userId, imageUrl, originalFilename]);

    res.status(201).json({
      success: true,
      message: 'Imagen subida con éxito',
      imageUrl: imageUrl,
      imageId: result.insertId
    });

  } catch (err) {
    console.error('Error en la ruta de subida de imagen:', err);
    res.status(500).json({ success: false, message: 'Error del servidor al procesar la imagen.' });
  }
});

// @route   GET /api/images/my-images
// @desc    Obtiene todas las imágenes del usuario autenticado
// @access  Private
router.get('/my-images', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = 'SELECT id, image_url FROM images WHERE user_id = ? ORDER BY created_at DESC';
    const [images] = await pool.query(query, [userId]);
    res.json(images);
  } catch (err) {
    console.error('Error al obtener las imágenes del usuario:', err);
    res.status(500).json({ success: false, message: 'Error del servidor al obtener las imágenes.' });
  }
});

// @route   DELETE /api/images/:id
// @desc    Elimina una imagen de un usuario
// @access  Private
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.user.id;

    const [imageResult] = await pool.query('SELECT * FROM images WHERE id = ? AND user_id = ?', [imageId, userId]);
    if (imageResult.length === 0) {
      return res.status(404).json({ success: false, message: 'Imagen no encontrada o no te pertenece.' });
    }

    const query = 'DELETE FROM images WHERE id = ? AND user_id = ?';
    await pool.query(query, [imageId, userId]);

    res.json({ success: true, message: 'Imagen eliminada correctamente.' });

  } catch (err) {
    console.error('Error al eliminar la imagen:', err);
    res.status(500).json({ success: false, message: 'Error del servidor al eliminar la imagen.' });
  }
});

// @route   POST /api/images/upload-from-url
// @desc    Descarga una imagen desde una URL, la guarda y la asocia con el usuario
// @access  Private
router.post('/upload-from-url', authMiddleware, async (req, res) => {
  const { url: imageUrl } = req.body;
  const userId = req.user.id;

  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'No se proporcionó ninguna URL.' });
  }

  try {
    // 1. Descargar la imagen
    const response = await axios({ url: imageUrl, responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // 2. Crear un nombre de archivo único
    // Extraer la extensión de la URL, manejando casos sin extensión o con parámetros
    let extension = path.extname(new URL(imageUrl).pathname);
    if (!extension) {
        const contentType = response.headers['content-type'];
        if (contentType && contentType.startsWith('image/')) {
            extension = '.' + contentType.split('/')[1];
        } else {
            extension = '.jpg'; // Usar un default si todo falla
        }
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `image-${uniqueSuffix}${extension}`;
    const localPath = path.join(__dirname, '../public/uploads', filename);

    // 3. Guardar el archivo en el servidor
    fs.writeFileSync(localPath, buffer);

    // 4. Guardar la referencia en la base de datos
    const finalImageUrl = `/uploads/${filename}`;
    const query = 'INSERT INTO images (user_id, image_url, filename) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [userId, finalImageUrl, filename]);

    // 5. Enviar la respuesta
    res.status(201).json({
      success: true,
      message: 'Imagen subida desde URL con éxito',
      imageUrl: finalImageUrl,
      imageId: result.insertId
    });

  } catch (error) {
    console.error('Error al descargar la imagen desde la URL:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la imagen desde la URL.' });
  }
});

module.exports = router;