-- Script para crear un usuario de prueba inactivo
-- Este script debe ejecutarse en la base de datos para probar la funcionalidad

-- Insertar usuario de prueba inactivo
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`, `status`, `email_verified`) 
VALUES (
  'test_inactive_user', 
  'usuario_inactivo@test.com', 
  '$2a$10$abcdefghijklmnopqrstuvwxyz123456789',  -- Hash de ejemplo (password: "test123")
  'user', 
  'inactive',
  TRUE
) ON DUPLICATE KEY UPDATE 
  `status` = 'inactive',
  `updated_at` = CURRENT_TIMESTAMP;

-- Verificar que el usuario fue creado/actualizado
SELECT id, username, email, role, status, email_verified, created_at 
FROM `users` 
WHERE email = 'usuario_inactivo@test.com';

-- Para reactivar el usuario después de las pruebas (opcional):
-- UPDATE `users` SET `status` = 'active' WHERE email = 'usuario_inactivo@test.com';