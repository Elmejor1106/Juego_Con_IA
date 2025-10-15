const pool = require('./config/db');

// Script para restaurar avatares perdidos basándose en las imágenes más recientes
// Ejecutar con: node restore-avatars.js

const restoreAvatars = async () => {
  try {
    console.log('🔧 Iniciando restauración de avatares...\n');

    // Obtener usuarios que no tienen avatar pero sí tienen imágenes subidas
    const [usersWithoutAvatars] = await pool.query(`
      SELECT DISTINCT
        u.id as user_id,
        u.username,
        (SELECT i.image_url 
         FROM images i 
         WHERE i.user_id = u.id 
         ORDER BY i.created_at DESC 
         LIMIT 1) as latest_image
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.status = 'active' 
      AND (up.avatar_url IS NULL OR up.avatar_url = '')
      AND EXISTS (SELECT 1 FROM images i WHERE i.user_id = u.id)
    `);

    console.log(`👤 Usuarios sin avatar pero con imágenes: ${usersWithoutAvatars.length}`);
    
    if (usersWithoutAvatars.length === 0) {
      console.log('✅ No hay avatares para restaurar');
      return;
    }

    console.table(usersWithoutAvatars);

    let restoredCount = 0;
    
    for (const user of usersWithoutAvatars) {
      if (user.latest_image) {
        try {
          await pool.query(`
            UPDATE user_profiles 
            SET avatar_url = ?, updated_at = NOW()
            WHERE user_id = ?
          `, [user.latest_image, user.user_id]);
          
          console.log(`✅ Avatar restaurado para ${user.username}: ${user.latest_image}`);
          restoredCount++;
        } catch (error) {
          console.error(`❌ Error restaurando avatar para ${user.username}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Restauración completada: ${restoredCount} avatares restaurados`);

  } catch (error) {
    console.error('❌ Error durante la restauración:', error.message);
  }
};

// Función para establecer avatar específico para un usuario
const setUserAvatar = async (userId, imageUrl) => {
  try {
    console.log(`🖼️ Estableciendo avatar para usuario ${userId}: ${imageUrl}`);

    // Verificar que la imagen existe
    const [images] = await pool.query('SELECT id FROM images WHERE image_url = ? AND user_id = ?', [imageUrl, userId]);
    
    if (images.length === 0) {
      throw new Error('La imagen no existe o no pertenece al usuario');
    }

    // Actualizar avatar
    const [result] = await pool.query(`
      UPDATE user_profiles 
      SET avatar_url = ?, updated_at = NOW()
      WHERE user_id = ?
    `, [imageUrl, userId]);

    if (result.affectedRows > 0) {
      console.log('✅ Avatar establecido correctamente');
    } else {
      throw new Error('No se pudo actualizar el perfil');
    }

  } catch (error) {
    console.error('❌ Error estableciendo avatar:', error.message);
  }
};

// Función principal
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args[0] === '--set' && args[1] && args[2]) {
    // Establecer avatar específico: node restore-avatars.js --set userId imageUrl
    await setUserAvatar(args[1], args[2]);
  } else {
    // Restaurar todos los avatares automáticamente
    await restoreAvatars();
  }
  
  process.exit(0);
};

if (require.main === module) {
  main();
}

module.exports = { restoreAvatars, setUserAvatar };