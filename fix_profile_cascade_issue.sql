-- Script para corregir el problema de eliminación en cascada de perfiles de usuario
-- Este script cambia la restricción ON DELETE CASCADE a ON DELETE SET NULL para preservar los perfiles

-- IMPORTANTE: Ejecutar este script para solucionar el problema de perfiles que se borran

-- Paso 1: Eliminar la restricción existente
ALTER TABLE `user_profiles` DROP FOREIGN KEY `fk_user_profiles_user_id`;

-- Paso 2: Modificar la columna user_id para permitir NULL (temporalmente)
ALTER TABLE `user_profiles` MODIFY COLUMN `user_id` int(11) NULL;

-- Paso 3: Crear nueva restricción que NO elimine en cascada
ALTER TABLE `user_profiles` 
ADD CONSTRAINT `fk_user_profiles_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Paso 4: Agregar una nueva columna de control para manejar perfiles huérfanos
ALTER TABLE `user_profiles` 
ADD COLUMN `is_orphaned` BOOLEAN DEFAULT FALSE 
COMMENT 'Indica si el perfil pertenece a un usuario eliminado';

-- Paso 5: Crear un trigger para marcar perfiles huérfanos
DELIMITER $$
CREATE TRIGGER `mark_orphaned_profiles` 
AFTER UPDATE ON `users`
FOR EACH ROW
BEGIN
    -- Si el usuario es marcado como eliminado (status = 'deleted' o similar)
    -- O si se hace un soft delete, marcar el perfil como huérfano
    IF NEW.status = 'deleted' OR NEW.status = 'inactive' THEN
        UPDATE `user_profiles` 
        SET `is_orphaned` = TRUE, `updated_at` = NOW()
        WHERE `user_id` = NEW.id;
    ELSEIF OLD.status != 'active' AND NEW.status = 'active' THEN
        -- Si el usuario es reactivado, desmarcar como huérfano
        UPDATE `user_profiles` 
        SET `is_orphaned` = FALSE, `updated_at` = NOW()
        WHERE `user_id` = NEW.id;
    END IF;
END$$
DELIMITER ;

-- Paso 6: Crear índice para optimizar consultas con is_orphaned
CREATE INDEX `idx_user_profiles_orphaned` ON `user_profiles` (`is_orphaned`);

-- Paso 7: Marcar como huérfanos los perfiles de usuarios actualmente inactivos
UPDATE `user_profiles` 
SET `is_orphaned` = TRUE, `updated_at` = NOW()
WHERE `user_id` IN (
    SELECT `id` FROM `users` WHERE `status` != 'active'
);

-- Opcional: Consulta para verificar perfiles huérfanos
-- SELECT * FROM `user_profiles` WHERE `is_orphaned` = TRUE;

-- Opcional: Consulta para limpiar perfiles realmente huérfanos (user_id = NULL)
-- DELETE FROM `user_profiles` WHERE `user_id` IS NULL;