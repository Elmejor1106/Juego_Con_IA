// Script de prueba para verificar el manejo de usuarios inactivos
const axios = require('axios');

const testInactiveUser = async () => {
  try {
    console.log('🧪 Probando login con usuario inactivo...');
    
    // Simular login con usuario inactivo
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'usuario_inactivo@test.com', // Cambia por un email de usuario inactivo real
      password: 'password123'
    });
    
    console.log('❌ No debería llegar aquí - usuario inactivo logrado exitosamente');
    console.log(response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('✅ Error esperado capturado:');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.msg);
      console.log('Account Inactive Flag:', error.response.data.accountInactive);
      
      if (error.response.status === 403 && error.response.data.accountInactive) {
        console.log('🎉 ¡Prueba exitosa! El sistema está bloqueando usuarios inactivos correctamente.');
      } else {
        console.log('⚠️ El comportamiento no es el esperado.');
      }
    } else {
      console.error('Error de conexión:', error.message);
    }
  }
};

// Ejecutar solo si se llama directamente
if (require.main === module) {
  testInactiveUser();
}

module.exports = { testInactiveUser };