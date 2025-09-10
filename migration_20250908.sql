-- SQL Migration Script for Game Templates Feature
-- Date: 2025-09-08

-- 1. Rename the existing `games` table for backup
ALTER TABLE games RENAME TO games_old;

-- 2. Create the new `games` table
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    template_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create the `game_templates` table
CREATE TABLE game_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    structure JSON
);

-- 4. Add the foreign key constraint to the `games` table
ALTER TABLE games
ADD FOREIGN KEY (template_id) REFERENCES game_templates(id);

-- 5. Create the `game_questions` table
CREATE TABLE game_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    question_text TEXT NOT NULL,
    image_url VARCHAR(255),
    `order` INT,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- 6. Create the `game_answers` table
CREATE TABLE game_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    `order` INT,
    FOREIGN KEY (question_id) REFERENCES game_questions(id) ON DELETE CASCADE
);

-- 7. Insert initial templates into `game_templates`
INSERT INTO game_templates (name, description, structure) VALUES
('Cuestionario', 'Un juego clásico de preguntas y respuestas.', '{"has_questions": true, "has_board": false}'),
('Tablero Virtual', 'Un juego de tablero con casillas y fichas.', '{"has_questions": false, "has_board": true}');

-- Note: Data migration from `games_old` is not included in this script.
-- The old game data remains in the `games_old` table if you need to access it later.

