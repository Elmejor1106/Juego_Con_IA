const pool = require('./config/db');

// Script para verificar la integridad de los perfiles de usuario
// Ejecutar con: node profile-integrity-check.js

const checkProfileIntegrity = async () => {
  try {
    console.log('🔍 Iniciando verificación de integridad de perfiles...\n');

    // 1. Verificar perfiles huérfanos
    const [orphanedProfiles] = await pool.query(`
      SELECT up.id, up.user_id, up.is_orphaned, u.username, u.status
      FROM user_profiles up
      LEFT JOIN users u ON up.user_id = u.id
      WHERE up.is_orphaned = TRUE OR u.id IS NULL OR u.status != 'active'
    `);

    console.log(`📊 Perfiles huérfanos encontrados: ${orphanedProfiles.length}`);
    if (orphanedProfiles.length > 0) {
      console.table(orphanedProfiles);
    }

    // 2. Verificar perfiles con datos pero marcados como huérfanos
    const [dataInOrphaned] = await pool.query(`
      SELECT up.id, up.user_id, up.first_name, up.last_name, up.is_orphaned
      FROM user_profiles up
      WHERE up.is_orphaned = TRUE 
      AND (up.first_name IS NOT NULL OR up.last_name IS NOT NULL OR up.phone IS NOT NULL OR up.bio IS NOT NULL)
    `);

    console.log(`\n📋 Perfiles huérfanos con datos: ${dataInOrphaned.length}`);
    if (dataInOrphaned.length > 0) {
      console.table(dataInOrphaned);
    }

    // 3. Verificar usuarios activos sin perfil
    const [usersWithoutProfile] = await pool.query(`
      SELECT u.id, u.username, u.status
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.status = 'active' AND up.user_id IS NULL
    `);

    console.log(`\n👤 Usuarios activos sin perfil: ${usersWithoutProfile.length}`);
    if (usersWithoutProfile.length > 0) {
      console.table(usersWithoutProfile);
    }

    // 4. Verificar accesos cruzados recientes (si la tabla de auditoría existe)
    try {
      const [crossAccess] = await pool.query(`
        SELECT * FROM profile_access_conflicts
        WHERE access_status = 'CROSS_ACCESS'
        ORDER BY last_access_time DESC
        LIMIT 10
      `);

      console.log(`\n⚠️ Accesos cruzados detectados: ${crossAccess.length}`);
      if (crossAccess.length > 0) {
        console.table(crossAccess);
      }
    } catch (err) {
      console.log('\n📝 Tabla de auditoría no disponible (ejecutar profile_auditing_enhancement.sql primero)');
    }

    // 5. Estadísticas generales
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_profiles,
        SUM(CASE WHEN is_orphaned = TRUE THEN 1 ELSE 0 END) as orphaned_count,
        SUM(CASE WHEN is_orphaned = FALSE OR is_orphaned IS NULL THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN first_name IS NOT NULL OR last_name IS NOT NULL THEN 1 ELSE 0 END) as profiles_with_data
      FROM user_profiles
    `);

    console.log('\n📈 Estadísticas de perfiles:');
    console.table(stats);

    // 6. Perfiles modificados recientemente
    const [recentModified] = await pool.query(`
      SELECT up.id, up.user_id, u.username, up.updated_at, up.last_accessed_by, au.username as accessed_by
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      LEFT JOIN users au ON up.last_accessed_by = au.id
      WHERE up.updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY up.updated_at DESC
      LIMIT 20
    `);

    console.log(`\n🕒 Perfiles modificados en las últimas 24 horas: ${recentModified.length}`);
    if (recentModified.length > 0) {
      console.table(recentModified);
    }

    console.log('\n✅ Verificación de integridad completada.');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
};

// Función para reparar perfiles huérfanos automáticamente
const repairOrphanedProfiles = async () => {
  try {
    console.log('🔧 Iniciando reparación de perfiles huérfanos...\n');

    // Reactivar perfiles de usuarios que volvieron a estar activos
    const [reactivated] = await pool.query(`
      UPDATE user_profiles up
      JOIN users u ON up.user_id = u.id
      SET up.is_orphaned = FALSE, up.updated_at = NOW()
      WHERE up.is_orphaned = TRUE AND u.status = 'active'
    `);

    console.log(`✅ Perfiles reactivados: ${reactivated.affectedRows}`);

    // Crear perfiles para usuarios activos sin perfil
    const [created] = await pool.query(`
      INSERT INTO user_profiles (user_id, created_at, updated_at, is_orphaned)
      SELECT u.id, NOW(), NOW(), FALSE
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.status = 'active' AND up.user_id IS NULL
    `);

    console.log(`✅ Perfiles creados: ${created.affectedRows}`);

    console.log('\n🎉 Reparación completada.');

  } catch (error) {
    console.error('❌ Error durante la reparación:', error.message);
  }
};

// Ejecutar verificación
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--repair')) {
    await repairOrphanedProfiles();
  } else {
    await checkProfileIntegrity();
  }
  
  process.exit(0);
};

if (require.main === module) {
  main();
}

module.exports = { checkProfileIntegrity, repairOrphanedProfiles };