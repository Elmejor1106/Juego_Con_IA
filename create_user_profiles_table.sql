-- Tabla de perfiles de usuario para almacenar información adicional
-- Este script debe ejecutarse después de la tabla `users` existente

CREATE TABLE `user_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL COMMENT 'Nombre real del usuario',
  `last_name` varchar(100) DEFAULT NULL COMMENT 'Apellido del usuario',
  `phone` varchar(20) DEFAULT NULL COMMENT 'Número de teléfono',
  `birth_date` date DEFAULT NULL COMMENT 'Fecha de nacimiento',
  `bio` text DEFAULT NULL COMMENT 'Biografía o descripción personal',
  `avatar_url` varchar(500) DEFAULT NULL COMMENT 'URL de la imagen de perfil',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_user_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla de perfiles extendidos para usuarios';

-- Índices adicionales para optimizar consultas
CREATE INDEX `idx_user_profiles_user_id` ON `user_profiles` (`user_id`);
CREATE INDEX `idx_user_profiles_updated_at` ON `user_profiles` (`updated_at`);

-- Insertar perfiles básicos para usuarios existentes (opcional)
-- Este insert creará perfiles vacíos para todos los usuarios que ya existen
INSERT INTO `user_profiles` (`user_id`, `created_at`, `updated_at`)
SELECT 
    `id`,
    NOW(),
    NOW()
FROM `users` 
WHERE `id` NOT IN (SELECT `user_id` FROM `user_profiles`);

-- Trigger para crear automáticamente un perfil cuando se crea un nuevo usuario
DELIMITER $$
CREATE TRIGGER `create_user_profile` 
AFTER INSERT ON `users`
FOR EACH ROW
BEGIN
    INSERT INTO `user_profiles` (`user_id`, `created_at`, `updated_at`)
    VALUES (NEW.id, NOW(), NOW());
END$$
DELIMITER ;