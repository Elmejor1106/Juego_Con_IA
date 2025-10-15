const pool = require('./config/db');

// Script para verificar el estado de las imágenes de perfil (avatares)
// Ejecutar con: node avatar-check.js

const checkAvatarStatus = async () => {
  try {
    console.log('🖼️ Verificando estado de avatares de usuario...\n');

    // 1. Verificar usuarios con avatares
    const [usersWithAvatars] = await pool.query(`
      SELECT 
        u.id, u.username, u.status,
        up.avatar_url,
        up.updated_at as profile_updated,
        up.is_orphaned
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE up.avatar_url IS NOT NULL
      ORDER BY up.updated_at DESC
    `);

    console.log(`👤 Usuarios con avatar configurado: ${usersWithAvatars.length}`);
    if (usersWithAvatars.length > 0) {
      console.table(usersWithAvatars);
    }

    // 2. Verificar archivos de imagen existentes
    const [allImages] = await pool.query(`
      SELECT 
        i.id, i.user_id, i.image_url, i.filename, i.created_at,
        u.username, u.status
      FROM images i
      LEFT JOIN users u ON i.user_id = u.id
      ORDER BY i.created_at DESC
      LIMIT 20
    `);

    console.log(`\n📁 Imágenes subidas recientemente: ${allImages.length}`);
    if (allImages.length > 0) {
      console.table(allImages);
    }

    // 3. Verificar avatares que apuntan a imágenes inexistentes
    const [orphanedAvatars] = await pool.query(`
      SELECT 
        up.user_id, u.username, up.avatar_url,
        up.updated_at as profile_updated
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      LEFT JOIN images i ON up.avatar_url = i.image_url
      WHERE up.avatar_url IS NOT NULL 
      AND i.id IS NULL
      AND u.status = 'active'
    `);

    console.log(`\n⚠️ Avatares que apuntan a imágenes inexistentes: ${orphanedAvatars.length}`);
    if (orphanedAvatars.length > 0) {
      console.table(orphanedAvatars);
    }

    // 4. Verificar cambios recientes de avatar
    const [recentAvatarChanges] = await pool.query(`
      SELECT 
        up.user_id, u.username, up.avatar_url,
        up.updated_at, up.last_accessed_by, la.username as last_accessed_by_user
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      LEFT JOIN users la ON up.last_accessed_by = la.id
      WHERE up.updated_at > DATE_SUB(NOW(), INTERVAL 2 HOUR)
      ORDER BY up.updated_at DESC
    `);

    console.log(`\n🕒 Cambios de perfil en las últimas 2 horas: ${recentAvatarChanges.length}`);
    if (recentAvatarChanges.length > 0) {
      console.table(recentAvatarChanges);
    }

    // 5. Verificar integridad de rutas de archivo
    const fs = require('fs');
    const path = require('path');
    
    console.log('\n📂 Verificando existencia de archivos físicos...');
    let existingFiles = 0;
    let missingFiles = 0;
    
    for (const user of usersWithAvatars) {
      if (user.avatar_url) {
        const filePath = path.join(__dirname, 'public', user.avatar_url);
        try {
          if (fs.existsSync(filePath)) {
            existingFiles++;
          } else {
            missingFiles++;
            console.log(`❌ Archivo faltante: ${user.avatar_url} (Usuario: ${user.username})`);
          }
        } catch (error) {
          console.log(`⚠️ Error verificando archivo ${user.avatar_url}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Archivos existentes: ${existingFiles}`);
    console.log(`❌ Archivos faltantes: ${missingFiles}`);

    console.log('\n✅ Verificación de avatares completada.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
};

// Función para limpiar avatares rotos
const cleanBrokenAvatars = async () => {
  try {
    console.log('🧹 Limpiando avatares que apuntan a archivos inexistentes...\n');

    const [result] = await pool.query(`
      UPDATE user_profiles up
      LEFT JOIN images i ON up.avatar_url = i.image_url
      SET up.avatar_url = NULL, up.updated_at = NOW()
      WHERE up.avatar_url IS NOT NULL 
      AND i.id IS NULL
    `);

    console.log(`✅ Avatares limpiados: ${result.affectedRows}`);

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
  }
};

// Función principal
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--clean')) {
    await cleanBrokenAvatars();
  } else {
    await checkAvatarStatus();
  }
  
  process.exit(0);
};

if (require.main === module) {
  main();
}

module.exports = { checkAvatarStatus, cleanBrokenAvatars };