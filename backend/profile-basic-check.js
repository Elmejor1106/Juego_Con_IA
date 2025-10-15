const pool = require('./config/db');

// Script simplificado para verificar la integridad de los perfiles de usuario
// Funciona con la estructura básica de la tabla user_profiles

const checkBasicProfileIntegrity = async () => {
  try {
    console.log('🔍 Iniciando verificación básica de integridad de perfiles...\n');

    // 1. Verificar estructura de la tabla
    console.log('📋 Verificando estructura de la tabla...');
    const [tableStructure] = await pool.query("DESCRIBE user_profiles");
    const columnNames = tableStructure.map(col => col.Field);
    console.log('Columnas disponibles:', columnNames.join(', '));

    const hasOrphanedColumn = columnNames.includes('is_orphaned');
    const hasAuditColumns = columnNames.includes('last_accessed_by');

    // 2. Verificar perfiles de usuarios activos
    const [activeUserProfiles] = await pool.query(`
      SELECT u.id as user_id, u.username, u.status, 
             up.id as profile_id, up.first_name, up.last_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.status = 'active'
      ORDER BY u.id
    `);

    const usersWithoutProfile = activeUserProfiles.filter(row => !row.profile_id);
    const usersWithProfile = activeUserProfiles.filter(row => row.profile_id);

    console.log(`\n👤 Usuarios activos: ${activeUserProfiles.length}`);
    console.log(`✅ Con perfil: ${usersWithProfile.length}`);
    console.log(`❌ Sin perfil: ${usersWithoutProfile.length}`);

    if (usersWithoutProfile.length > 0) {
      console.log('\n📋 Usuarios sin perfil:');
      console.table(usersWithoutProfile.map(u => ({
        user_id: u.user_id,
        username: u.username,
        status: u.status
      })));
    }

    // 3. Verificar perfiles huérfanos (si la columna existe)
    if (hasOrphanedColumn) {
      const [orphanedProfiles] = await pool.query(`
        SELECT up.id, up.user_id, up.is_orphaned, u.username, u.status
        FROM user_profiles up
        LEFT JOIN users u ON up.user_id = u.id
        WHERE up.is_orphaned = TRUE OR u.id IS NULL OR u.status != 'active'
      `);

      console.log(`\n🗂️ Perfiles huérfanos: ${orphanedProfiles.length}`);
      if (orphanedProfiles.length > 0) {
        console.table(orphanedProfiles);
      }
    } else {
      // Verificar perfiles sin usuario asociado o con usuario inactivo
      const [problematicProfiles] = await pool.query(`
        SELECT up.id, up.user_id, u.username, u.status
        FROM user_profiles up
        LEFT JOIN users u ON up.user_id = u.id
        WHERE u.id IS NULL OR u.status != 'active'
      `);

      console.log(`\n⚠️ Perfiles problemáticos (sin usuario o usuario inactivo): ${problematicProfiles.length}`);
      if (problematicProfiles.length > 0) {
        console.table(problematicProfiles);
      }
    }

    // 4. Estadísticas generales
    const [totalStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_active_users,
        COUNT(DISTINCT up.id) as total_profiles,
        COUNT(DISTINCT CASE WHEN up.first_name IS NOT NULL OR up.last_name IS NOT NULL THEN up.id END) as profiles_with_data
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.status = 'active'
    `);

    console.log('\n📊 Estadísticas generales:');
    console.table(totalStats);

    // 5. Perfiles modificados recientemente
    const [recentModified] = await pool.query(`
      SELECT up.id, up.user_id, u.username, up.updated_at
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.updated_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY up.updated_at DESC
      LIMIT 10
    `);

    console.log(`\n🕒 Perfiles modificados en las últimas 24 horas: ${recentModified.length}`);
    if (recentModified.length > 0) {
      console.table(recentModified);
    }

    console.log('\n✅ Verificación básica completada.');

    // Sugerencias
    if (!hasOrphanedColumn) {
      console.log('\n💡 Sugerencia: Ejecuta add_profile_columns.sql para habilitar funciones avanzadas');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  }
};

// Función para crear perfiles faltantes
const createMissingProfiles = async () => {
  try {
    console.log('🔧 Creando perfiles faltantes...\n');

    const [result] = await pool.query(`
      INSERT INTO user_profiles (user_id, created_at, updated_at)
      SELECT u.id, NOW(), NOW()
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.status = 'active' AND up.user_id IS NULL
    `);

    console.log(`✅ Perfiles creados: ${result.affectedRows}`);

  } catch (error) {
    console.error('❌ Error creando perfiles:', error.message);
  }
};

// Función principal
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-missing')) {
    await createMissingProfiles();
  } else {
    await checkBasicProfileIntegrity();
  }
  
  process.exit(0);
};

if (require.main === module) {
  main();
}

module.exports = { checkBasicProfileIntegrity, createMissingProfiles };