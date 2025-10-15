-- Tabla para gestionar enlaces compartidos de juegos
-- Funcionalidad completa: Ver y Ver/Editar

CREATE TABLE game_shares (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    owner_id INT NOT NULL,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    permission_level ENUM('view', 'edit') DEFAULT 'view',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices para optimizar consultas
    INDEX idx_game_shares_token (share_token),
    INDEX idx_game_shares_game_id (game_id),
    INDEX idx_game_shares_owner_id (owner_id)
);

-- Tabla para gestionar colaboraciones (usuarios con acceso de edición)
CREATE TABLE game_collaborators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    owner_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un usuario no puede ser colaborador del mismo juego dos veces
    UNIQUE KEY unique_collaboration (game_id, user_id),
    
    -- Claves foráneas
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Índices para optimizar consultas
    INDEX idx_collaborators_game_id (game_id),
    INDEX idx_collaborators_user_id (user_id),
    INDEX idx_collaborators_owner_id (owner_id)
);

-- Comentarios para documentación
ALTER TABLE game_shares COMMENT = 'Tabla para gestionar enlaces compartidos de juegos con diferentes niveles de permisos';
ALTER TABLE game_collaborators COMMENT = 'Tabla para gestionar colaboradores con permisos de edición en juegos';