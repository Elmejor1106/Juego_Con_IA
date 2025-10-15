-- Script adicional para agregar más protección y logging a los perfiles de usuario
-- Este script debe ejecutarse DESPUÉS del fix_profile_cascade_issue.sql

-- Agregar columna de auditoría para rastrear cambios
ALTER TABLE `user_profiles` 
ADD COLUMN `last_accessed_by` int(11) NULL COMMENT 'ID del último usuario que accedió/modificó este perfil',
ADD COLUMN `last_access_time` timestamp NULL COMMENT 'Última vez que se accedió al perfil',
ADD COLUMN `session_token_hash` varchar(255) NULL COMMENT 'Hash del token de sesión para prevenir acceso cruzado';

-- Crear tabla de auditoría para perfiles
CREATE TABLE `user_profiles_audit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `user_id` int(11) NULL,
  `action` enum('CREATE','UPDATE','DELETE','ACCESS') NOT NULL,
  `performed_by` int(11) NULL COMMENT 'ID del usuario que realizó la acción',
  `session_info` text NULL COMMENT 'Información de la sesión',
  `changes` json NULL COMMENT 'Cambios realizados',
  `ip_address` varchar(45) NULL,
  `user_agent` text NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_profile_id` (`profile_id`),
  KEY `idx_audit_user_id` (`user_id`),
  KEY `idx_audit_performed_by` (`performed_by`),
  KEY `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Auditoría de cambios en perfiles de usuario';

-- Trigger para auditar accesos de lectura (cuando se actualiza last_access_time)
DELIMITER $$
CREATE TRIGGER `audit_profile_access` 
AFTER UPDATE ON `user_profiles`
FOR EACH ROW
BEGIN
    -- Solo auditar si cambió last_access_time (indica lectura)
    IF OLD.last_access_time != NEW.last_access_time OR OLD.last_access_time IS NULL THEN
        INSERT INTO `user_profiles_audit` 
        (profile_id, user_id, action, performed_by, session_info, created_at)
        VALUES 
        (NEW.id, NEW.user_id, 'ACCESS', NEW.last_accessed_by, 
         CONCAT('Session hash: ', COALESCE(NEW.session_token_hash, 'NULL')), NOW());
    END IF;
    
    -- Auditar cambios en datos del perfil
    IF OLD.first_name != NEW.first_name OR OLD.last_name != NEW.last_name OR 
       OLD.phone != NEW.phone OR OLD.birth_date != NEW.birth_date OR 
       OLD.bio != NEW.bio OR OLD.avatar_url != NEW.avatar_url THEN
        INSERT INTO `user_profiles_audit` 
        (profile_id, user_id, action, performed_by, changes, created_at)
        VALUES 
        (NEW.id, NEW.user_id, 'UPDATE', NEW.last_accessed_by,
         JSON_OBJECT(
             'old_first_name', OLD.first_name, 'new_first_name', NEW.first_name,
             'old_last_name', OLD.last_name, 'new_last_name', NEW.last_name,
             'old_phone', OLD.phone, 'new_phone', NEW.phone,
             'old_birth_date', OLD.birth_date, 'new_birth_date', NEW.birth_date,
             'old_bio', OLD.bio, 'new_bio', NEW.bio,
             'old_avatar_url', OLD.avatar_url, 'new_avatar_url', NEW.avatar_url
         ), NOW());
    END IF;
END$$
DELIMITER ;

-- Trigger para auditar creación de perfiles
DELIMITER $$
CREATE TRIGGER `audit_profile_creation` 
AFTER INSERT ON `user_profiles`
FOR EACH ROW
BEGIN
    INSERT INTO `user_profiles_audit` 
    (profile_id, user_id, action, performed_by, session_info, created_at)
    VALUES 
    (NEW.id, NEW.user_id, 'CREATE', NEW.last_accessed_by,
     CONCAT('Session hash: ', COALESCE(NEW.session_token_hash, 'NULL')), NOW());
END$$
DELIMITER ;

-- Función para limpiar registros de auditoría antiguos (opcional, ejecutar mensualmente)
-- DELETE FROM `user_profiles_audit` WHERE created_at < DATE_SUB(NOW(), INTERVAL 3 MONTH);

-- Vista para detectar posibles problemas de concurrencia
CREATE VIEW `profile_access_conflicts` AS
SELECT 
    up.user_id,
    u.username,
    up.last_accessed_by,
    accessed_user.username as accessed_by_username,
    up.last_access_time,
    up.session_token_hash,
    CASE 
        WHEN up.user_id != up.last_accessed_by THEN 'CROSS_ACCESS'
        WHEN up.is_orphaned = TRUE THEN 'ORPHANED'
        ELSE 'NORMAL'
    END as access_status
FROM user_profiles up
LEFT JOIN users u ON up.user_id = u.id
LEFT JOIN users accessed_user ON up.last_accessed_by = accessed_user.id
WHERE up.user_id != up.last_accessed_by 
   OR up.is_orphaned = TRUE
   OR up.last_access_time > DATE_SUB(NOW(), INTERVAL 1 HOUR);

-- Consulta para verificar integridad de perfiles
-- SELECT * FROM profile_access_conflicts;

-- Consulta para ver auditoría reciente
-- SELECT * FROM user_profiles_audit ORDER BY created_at DESC LIMIT 50;