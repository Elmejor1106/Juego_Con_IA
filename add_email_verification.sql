-- Script para agregar verificación de correo electrónico
-- Este script agrega las columnas necesarias sin afectar datos existentes

USE juego_rapido_db;

-- Agregar columnas para verificación de correo
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE COMMENT 'Indica si el correo ha sido verificado',
ADD COLUMN verification_token VARCHAR(255) DEFAULT NULL COMMENT 'Token para verificación de correo',
ADD COLUMN verification_token_expires DATETIME DEFAULT NULL COMMENT 'Fecha de expiración del token de verificación';

-- Marcar como verificados todos los usuarios existentes para no afectar funcionalidad
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL OR email_verified = FALSE;

-- Verificar los cambios
SELECT id, username, email, email_verified, verification_token FROM users;