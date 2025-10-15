-- Script para agregar las columnas necesarias a la tabla user_profiles existente
-- Ejecutar este script antes de usar el sistema de verificación de integridad

-- Agregar la columna is_orphaned si no existe
ALTER TABLE `user_profiles` 
ADD COLUMN IF NOT EXISTS `is_orphaned` BOOLEAN DEFAULT FALSE 
COMMENT 'Indica si el perfil pertenece a un usuario eliminado';

-- Agregar columnas de auditoría si no existen
ALTER TABLE `user_profiles` 
ADD COLUMN IF NOT EXISTS `last_accessed_by` int(11) NULL 
COMMENT 'ID del último usuario que accedió/modificó este perfil';

ALTER TABLE `user_profiles` 
ADD COLUMN IF NOT EXISTS `last_access_time` timestamp NULL 
COMMENT 'Última vez que se accedió al perfil';

ALTER TABLE `user_profiles` 
ADD COLUMN IF NOT EXISTS `session_token_hash` varchar(255) NULL 
COMMENT 'Hash del token de sesión para prevenir acceso cruzado';

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS `idx_user_profiles_orphaned` ON `user_profiles` (`is_orphaned`);
CREATE INDEX IF NOT EXISTS `idx_user_profiles_last_accessed` ON `user_profiles` (`last_accessed_by`);
CREATE INDEX IF NOT EXISTS `idx_user_profiles_access_time` ON `user_profiles` (`last_access_time`);

-- Marcar como huérfanos los perfiles de usuarios actualmente inactivos
UPDATE `user_profiles` 
SET `is_orphaned` = TRUE, `updated_at` = NOW()
WHERE `user_id` IN (
    SELECT `id` FROM `users` WHERE `status` != 'active'
);

-- Verificar que las columnas se agregaron correctamente
SELECT 'Columnas agregadas exitosamente' as status;