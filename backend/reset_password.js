// Script temporal para resetear la contraseña del usuario
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function resetUserPassword() {
  try {
    console.log('Iniciando reset de contraseña...');
    
    const email = 'comoavvioc2@gmail.com';
    const newPassword = '123456789';
    
    // Hashear la nueva contraseña
    console.log('Hasheando nueva contraseña...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('Hash generado:', hashedPassword);
    
    // Actualizar en la base de datos
    console.log('Actualizando en la base de datos...');
    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, email]
    );
    
    console.log('Resultado de la actualización:', result);
    
    if (result.affectedRows > 0) {
      console.log('✅ Contraseña actualizada exitosamente');
      
      // Verificar que funciona
      console.log('Verificando la nueva contraseña...');
      const [users] = await pool.query('SELECT password_hash FROM users WHERE email = ?', [email]);
      
      if (users.length > 0) {
        const isMatch = await bcrypt.compare(newPassword, users[0].password_hash);
        console.log('✅ Verificación:', isMatch ? 'EXITOSA' : 'FALLIDA');
      }
    } else {
      console.log('❌ No se encontró el usuario');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetUserPassword();