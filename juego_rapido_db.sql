-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 07-10-2025 a las 18:33:28
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `juego_rapido_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `games`
--

CREATE TABLE `games` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `cover_image_id` int(11) DEFAULT NULL,
  `styles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`styles`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `games`
--

INSERT INTO `games` (`id`, `user_id`, `template_id`, `title`, `description`, `is_public`, `created_at`, `updated_at`, `cover_image_id`, `styles`) VALUES
(1, 3, 1, 'Primer juego', 'Es un juego de inicio', 1, '2025-09-09 04:11:06', '2025-09-09 04:11:06', NULL, NULL),
(2, 3, 1, 'Un juego mas', 'mas', 0, '2025-09-09 04:48:24', '2025-09-09 04:48:24', NULL, NULL),
(3, 3, 2, 'czdx', 'cxzc', 1, '2025-09-09 04:55:25', '2025-09-09 04:55:25', NULL, NULL),
(4, 3, 1, 'uhkj', 'oyiguhij', 0, '2025-09-09 05:00:37', '2025-09-09 05:00:37', NULL, NULL),
(5, 3, 1, 'hkjlk', 'hnj', 0, '2025-09-09 05:02:09', '2025-09-09 05:02:09', NULL, NULL),
(6, 3, 1, 'Avances Tecnológicos', 'Pon a prueba tus conocimientos sobre las nuevas tecnologías con este divertido juego de preguntas y respuestas.', 0, '2025-09-11 00:43:48', '2025-09-11 00:43:48', NULL, NULL),
(12, 5, 1, 'Juego', '', 0, '2025-09-11 04:52:05', '2025-09-11 04:52:05', NULL, NULL),
(13, 5, 1, 'Adivina el Juego', 'Responde preguntas para adivinar el tipo de juego que estoy pensando.', 0, '2025-09-11 04:53:25', '2025-09-11 04:53:25', NULL, NULL),
(14, 3, 1, '...', 'klm', 0, '2025-09-11 05:06:52', '2025-09-11 05:06:52', NULL, NULL),
(16, 8, 1, 'Aventura Informática', 'Pon a prueba tus conocimientos de informática con este emocionante juego de preguntas y respuestas.', 0, '2025-09-15 03:17:56', '2025-09-15 03:17:56', NULL, NULL),
(17, 8, 1, 'Juego sobre informatíca', 'Un juego en Español con 2 preguntas.', 0, '2025-09-15 03:40:11', '2025-09-15 03:40:11', NULL, NULL),
(18, 7, 1, 'Juego sobre El sistema solar', 'Un juego en Español con 2 preguntas.', 0, '2025-09-17 00:28:44', '2025-09-17 00:28:44', NULL, NULL),
(19, 7, 1, 'Juego sobre El sistema solar', 'Un juego en Español con 3 preguntas.', 0, '2025-09-17 00:30:01', '2025-09-17 00:30:01', NULL, NULL),
(20, 7, 1, 'Juego sobre El sistema solar', 'Un juego en Español con 3 preguntas.', 0, '2025-09-17 02:27:10', '2025-09-17 02:27:10', NULL, NULL),
(22, 11, 1, 'Juego sobre El sistema solar', 'Un juego con 5 preguntas en Español.', 0, '2025-09-24 16:25:19', '2025-09-24 16:25:19', NULL, NULL),
(23, 11, 1, 'Juego Sobre El Sistema Solar', 'Un juego con 5 preguntas en Español.', 1, '2025-09-24 16:52:56', '2025-09-25 01:10:01', NULL, '{\"containerBg\":\"#1F2937\",\"questionText\":\"#F9FAFB\",\"answerBg\":\"#374151\",\"answerTextColor\":\"#F3F4F6\",\"buttonRadius\":24,\"timerBg\":\"#FBBF24\",\"timerTextColor\":\"#1F2937\",\"buttonShape\":\"rounded-lg\",\"imageBorder\":\"rounded-none\",\"name\":\"Oscuro\"}'),
(24, 11, 1, 'Juego', 'Un juego con 5 preguntas en Español.', 1, '2025-09-25 01:35:01', '2025-09-25 01:40:42', NULL, '{\"containerBg\":\"#1A1A1A\",\"questionText\":\"#E0E0E0\",\"answerBg\":\"#333333\",\"answerTextColor\":\"#A7F3D0\",\"buttonRadius\":24,\"timerBg\":\"#EC4899\",\"timerTextColor\":\"#1A1A1A\",\"name\":\"Neón\"}'),
(25, 11, 1, 'Juego sobre Electrónica', 'Un juego con 5 preguntas en Español.', 0, '2025-10-02 00:39:06', '2025-10-02 00:39:06', NULL, '{\"containerBg\":\"#ffffff\",\"questionText\":\"#1f2937\",\"answerBg\":\"#f3f4f6\",\"answerTextColor\":\"#1f2937\",\"buttonRadius\":8,\"timerBg\":\"#EF4444\",\"timerTextColor\":\"#FFFFFF\"}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `games_old`
--

CREATE TABLE `games_old` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL COMMENT 'El usuario que creó y posee la partida',
  `game_type` enum('standard','ai') NOT NULL COMMENT 'Distingue entre partidas normales y contra la IA',
  `game_state` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Almacena todo el estado del juego, como el tablero, puntajes, etc., en formato JSON' CHECK (json_valid(`game_state`)),
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Controla si la partida es visible para otros usuarios',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `game_answers`
--

CREATE TABLE `game_answers` (
  `id` int(11) NOT NULL,
  `question_id` int(11) NOT NULL,
  `answer_text` text NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `order` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `game_answers`
--

INSERT INTO `game_answers` (`id`, `question_id`, `answer_text`, `is_correct`, `order`) VALUES
(1, 1, 'Si', 1, 0),
(2, 1, 'No', 0, 1),
(3, 2, 'No', 1, 0),
(4, 2, 'si', 0, 1),
(5, 3, '5', 1, 0),
(6, 3, '2', 0, 1),
(7, 4, '4', 1, 0),
(8, 4, '8', 0, 1),
(9, 5, '2', 1, 0),
(10, 5, '3', 0, 1),
(11, 6, '4', 1, 0),
(12, 6, '5', 0, 1),
(13, 7, '5', 1, 0),
(14, 7, '21', 0, 1),
(15, 8, '9', 1, 0),
(16, 8, '45', 0, 1),
(17, 9, 'Inteligencia Artificial', 1, NULL),
(18, 9, 'Investigación Avanzada', 0, NULL),
(19, 9, 'Ingeniería Acústica', 0, NULL),
(20, 9, 'Integración Automatizada', 0, NULL),
(21, 10, 'Cascos de realidad virtual', 1, NULL),
(22, 10, 'Pantallas táctiles', 0, NULL),
(23, 10, 'Impresoras 3D', 0, NULL),
(24, 10, 'Robots de servicio', 0, NULL),
(25, 11, 'Una red de objetos físicos conectados a internet', 1, NULL),
(26, 11, 'Un sistema de almacenamiento en la nube', 0, NULL),
(27, 11, 'Un nuevo tipo de motor de búsqueda', 0, NULL),
(28, 11, 'Un software de edición de video', 0, NULL),
(29, 12, 'Para crear registros digitales seguros y transparentes', 1, NULL),
(30, 12, 'Para diseñar videojuegos', 0, NULL),
(31, 12, 'Para la creación de páginas web', 0, NULL),
(32, 12, 'Para el tratamiento de aguas residuales', 0, NULL),
(33, 13, 'Impresión 3D', 1, NULL),
(34, 13, 'Realidad aumentada', 0, NULL),
(35, 13, 'Big Data', 0, NULL),
(36, 13, 'Biotecnología', 0, NULL),
(37, 14, 'Grandes conjuntos de datos que necesitan ser procesados', 1, NULL),
(38, 14, 'Un nuevo lenguaje de programación', 0, NULL),
(39, 14, 'Un tipo de motor de búsqueda', 0, NULL),
(40, 14, 'Un sistema operativo para dispositivos móviles', 0, NULL),
(41, 15, 'Software de diseño asistido por computadora', 1, NULL),
(42, 15, 'Ingeniería genética', 0, NULL),
(43, 15, 'Terapias génicas', 0, NULL),
(44, 15, 'Clonación', 0, NULL),
(100, 32, '1', 1, 0),
(101, 32, '2', 0, 1),
(102, 33, 'Juegos de estrategia', 0, NULL),
(103, 33, 'Juegos de rol', 0, NULL),
(104, 33, 'Juegos de rompecabezas', 0, NULL),
(105, 33, 'Juegos de acción', 1, NULL),
(106, 34, 'Playstation', 0, NULL),
(107, 34, 'Xbox', 0, NULL),
(108, 34, 'Nintendo Switch', 1, NULL),
(109, 34, 'PC', 0, NULL),
(110, 35, 'Aventura', 1, NULL),
(111, 35, 'Deportes', 0, NULL),
(112, 35, 'Carreras', 0, NULL),
(113, 36, 'Menos de una hora', 0, NULL),
(114, 36, 'Entre 1 y 3 horas', 1, NULL),
(115, 36, 'Más de 3 horas', 0, NULL),
(116, 37, 'Solo', 0, NULL),
(117, 37, 'Con amigos', 1, NULL),
(118, 37, 'Tanto solo como con amigos', 0, NULL),
(119, 38, 'Primera persona', 0, NULL),
(120, 38, 'Tercera persona', 1, NULL),
(121, 38, 'No me importa', 0, NULL),
(122, 39, 'Compleja y llena de giros', 1, NULL),
(123, 39, 'Sencilla y lineal', 0, NULL),
(124, 39, 'No me importa', 0, NULL),
(125, 40, '5', 1, 0),
(126, 40, '1', 0, 1),
(155, 48, 'Unidad Central de Procesamiento', 1, NULL),
(156, 48, 'Unidad de Control de Procesamiento', 0, NULL),
(157, 48, 'Unidad Central de Potencia', 0, NULL),
(158, 48, 'Unidad de Calculo de Procesamiento', 0, NULL),
(159, 49, 'Disco Duro', 1, NULL),
(160, 49, 'Monitor', 0, NULL),
(161, 49, 'Teclado', 0, NULL),
(162, 49, 'Ratón', 0, NULL),
(163, 50, 'macOS', 1, NULL),
(164, 50, 'Windows', 0, NULL),
(165, 50, 'Linux', 0, NULL),
(166, 50, 'Android', 0, NULL),
(167, 51, 'JavaScript', 1, NULL),
(168, 51, 'C++', 0, NULL),
(169, 51, 'Python', 0, NULL),
(170, 51, 'Java', 0, NULL),
(171, 52, 'Un conjunto de instrucciones para resolver un problema', 1, NULL),
(172, 52, 'Un programa informático', 0, NULL),
(173, 52, 'Un lenguaje de programación', 0, NULL),
(174, 52, 'Un tipo de dato', 0, NULL),
(175, 53, 'Para proteger el equipo de virus informáticos', 1, NULL),
(176, 53, 'Para acelerar la velocidad del ordenador', 0, NULL),
(177, 53, 'Para crear copias de seguridad', 0, NULL),
(178, 53, 'Para gestionar la memoria RAM', 0, NULL),
(179, 54, 'Memoria de Acceso Aleatorio', 1, NULL),
(180, 54, 'Memoria de Alta Resolución', 0, NULL),
(181, 54, 'Memoria de Arranque Rápido', 0, NULL),
(182, 54, 'Memoria de Almacenamiento Remoto', 0, NULL),
(183, 55, 'World Wide Web.', 1, NULL),
(184, 55, 'Wide World Web.', 0, NULL),
(185, 55, 'World Web Wide.', 0, NULL),
(186, 55, 'Web World Wide.', 0, NULL),
(187, 56, 'La protección de sistemas, redes y datos contra el acceso no autorizado, uso, divulgación, interrupción y modificación.', 1, NULL),
(188, 56, 'El diseño de software.', 0, NULL),
(189, 56, 'El mantenimiento de hardware.', 0, NULL),
(190, 56, 'El desarrollo de videojuegos.', 0, NULL),
(191, 57, 'Marte', 0, NULL),
(192, 57, 'Venus', 1, NULL),
(193, 57, 'Mercurio', 0, NULL),
(194, 57, 'Tierra', 0, NULL),
(195, 58, 'Júpiter', 0, NULL),
(196, 58, 'Venus', 0, NULL),
(197, 58, 'Marte', 1, NULL),
(198, 58, 'Saturno', 0, NULL),
(199, 59, 'Marte', 0, NULL),
(200, 59, 'Venus', 1, NULL),
(201, 59, 'Mercurio', 0, NULL),
(202, 59, 'Tierra', 0, NULL),
(203, 60, 'Júpiter', 0, NULL),
(204, 60, 'Venus', 0, NULL),
(205, 60, 'Marte', 1, NULL),
(206, 60, 'Saturno', 0, NULL),
(207, 61, 'Tierra', 0, NULL),
(208, 61, 'Saturno', 0, NULL),
(209, 61, 'Júpiter', 1, NULL),
(210, 61, 'Neptuno', 0, NULL),
(211, 62, 'Marte', 0, NULL),
(212, 62, 'Venus', 1, NULL),
(213, 62, 'Tierra', 0, NULL),
(214, 62, 'Mercurio', 0, NULL),
(215, 63, 'Júpiter', 0, NULL),
(216, 63, 'Venus', 0, NULL),
(217, 63, 'Marte', 1, NULL),
(218, 63, 'Saturno', 0, NULL),
(219, 64, 'Tierra', 0, NULL),
(220, 64, 'Saturno', 0, NULL),
(221, 64, 'Júpiter', 1, NULL),
(222, 64, 'Neptuno', 0, NULL),
(803, 210, 'Marte', 0, NULL),
(804, 210, 'Tierra', 0, NULL),
(805, 210, 'Venus', 0, NULL),
(806, 210, 'Mercurio', 1, NULL),
(807, 211, 'Venus', 0, NULL),
(808, 211, 'Marte', 1, NULL),
(809, 211, 'Saturno', 0, NULL),
(810, 211, 'Júpiter', 0, NULL),
(811, 212, 'Neptuno', 0, NULL),
(812, 212, 'Saturno', 0, NULL),
(813, 212, 'Júpiter', 1, NULL),
(814, 212, 'Tierra', 0, NULL),
(815, 213, 'Dióxido de carbono', 0, NULL),
(816, 213, 'Hidrógeno y helio', 1, NULL),
(817, 213, 'Agua y hielo', 0, NULL),
(818, 213, 'Roca y metal', 0, NULL),
(819, 214, 'Venus', 0, NULL),
(820, 214, 'Júpiter', 0, NULL),
(821, 214, 'Marte', 0, NULL),
(822, 214, 'Saturno', 1, NULL),
(2343, 595, 'Saturno', 1, NULL),
(2344, 595, 'Venus', 0, NULL),
(2345, 595, 'Júpiter', 0, NULL),
(2346, 595, 'Marte', 0, NULL),
(2347, 596, 'Ganímedes', 1, NULL),
(2348, 596, 'Calisto', 0, NULL),
(2349, 596, 'Europa', 0, NULL),
(2350, 596, 'Titán', 0, NULL),
(2351, 597, 'Venus', 1, NULL),
(2352, 597, 'Tierra', 0, NULL),
(2353, 597, 'Mercurio', 0, NULL),
(2354, 597, 'Marte', 0, NULL),
(2355, 598, 'Marte', 1, NULL),
(2356, 598, 'Saturno', 0, NULL),
(2357, 598, 'Júpiter', 0, NULL),
(2358, 598, 'Venus', 0, NULL),
(2359, 599, 'Marte', 0, NULL),
(2360, 599, 'Tierra', 0, NULL),
(2361, 599, 'Júpiter', 0, NULL),
(2362, 599, 'Plutón', 1, NULL),
(2883, 730, 'Diodo', 0, NULL),
(2884, 730, 'Resistor', 0, NULL),
(2885, 730, 'Transistor', 1, NULL),
(2886, 730, 'Capacitor', 0, NULL),
(2887, 731, 'Amperio', 0, NULL),
(2888, 731, 'Ohmio', 1, NULL),
(2889, 731, 'Voltio', 0, NULL),
(2890, 731, 'Watt', 0, NULL),
(2891, 732, 'Almacenar energía eléctrica', 1, NULL),
(2892, 732, 'Rectificar la corriente', 0, NULL),
(2893, 732, 'Amplificar la señal', 0, NULL),
(2894, 732, 'Regular el voltaje', 0, NULL),
(2895, 733, 'Corriente alterna (CA)', 0, NULL),
(2896, 733, 'Corriente pulsátil', 0, NULL),
(2897, 733, 'Corriente trifásica', 0, NULL),
(2898, 733, 'Corriente directa (CC)', 1, NULL),
(2899, 734, 'Diodo', 0, NULL),
(2900, 734, 'Motor eléctrico', 1, NULL),
(2901, 734, 'Resistencia', 0, NULL),
(2902, 734, 'Transformador', 0, NULL),
(2923, 740, 'Voltio (V)', 0, NULL),
(2924, 740, 'Amperio (A)', 0, NULL),
(2925, 740, 'Vatio (W)', 0, NULL),
(2926, 740, 'Ohmio (Ω)', 1, NULL),
(2927, 741, 'Condensador', 1, NULL),
(2928, 741, 'Transistor', 0, NULL),
(2929, 741, 'Resistencia', 0, NULL),
(2930, 741, 'Inductor', 0, NULL),
(2931, 742, 'V = I * R', 1, NULL),
(2932, 742, 'V = I / R', 0, NULL),
(2933, 742, 'R = V * I', 0, NULL),
(2934, 742, 'I = V * R', 0, NULL),
(2935, 743, 'Potenciómetro', 0, NULL),
(2936, 743, 'Diodo', 1, NULL),
(2937, 743, 'Fusible', 0, NULL),
(2938, 743, 'Relé', 0, NULL),
(2939, 744, 'Dispositivo de Emisión Lógica', 0, NULL),
(2940, 744, 'Diodo Emisor de Luz', 1, NULL),
(2941, 744, 'Detector de Luz Eléctrica', 0, NULL),
(2942, 744, 'Limitador de Energía Digital', 0, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `game_plays`
--

CREATE TABLE `game_plays` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `played_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `game_plays`
--

INSERT INTO `game_plays` (`id`, `game_id`, `user_id`, `played_at`) VALUES
(3, 3, 3, '2025-09-11 02:01:49'),
(4, 3, 3, '2025-09-11 02:01:58'),
(5, 1, 3, '2025-09-11 02:02:05'),
(10, 13, 5, '2025-09-11 04:53:29'),
(11, 14, 3, '2025-09-11 05:06:55'),
(13, 16, 8, '2025-09-15 03:18:01'),
(14, 17, 8, '2025-09-15 03:40:19'),
(15, 18, 7, '2025-09-17 00:28:52'),
(16, 19, 7, '2025-09-17 00:30:08'),
(17, 20, 7, '2025-09-17 02:27:14'),
(20, 23, 11, '2025-09-24 23:16:12'),
(21, 23, 11, '2025-09-25 00:52:27'),
(22, 23, 11, '2025-09-25 01:10:07'),
(23, 23, 11, '2025-09-25 01:16:17'),
(24, 23, 11, '2025-09-25 01:20:23'),
(25, 23, 11, '2025-09-25 01:28:29'),
(26, 23, 11, '2025-09-25 01:28:51'),
(27, 23, 11, '2025-09-25 01:33:02'),
(28, 24, 11, '2025-09-25 01:41:45'),
(29, 24, 11, '2025-10-01 23:43:54');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `game_questions`
--

CREATE TABLE `game_questions` (
  `id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `question_text` text NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `order` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `game_questions`
--

INSERT INTO `game_questions` (`id`, `game_id`, `question_text`, `image_url`, `order`) VALUES
(1, 1, 'Es el cielo azul', NULL, 0),
(2, 1, 'La gorra especial', NULL, 1),
(3, 2, '1+4', NULL, 0),
(4, 2, '4+4', NULL, 1),
(5, 4, '1+1', NULL, 0),
(6, 4, '2+2', NULL, 1),
(7, 5, '1+4', NULL, 0),
(8, 5, '4+5', NULL, 1),
(9, 6, '¿Qué significa la sigla IA?', NULL, NULL),
(10, 6, '¿Cuál de las siguientes tecnologías se considera una forma de realidad virtual?', NULL, NULL),
(11, 6, '¿Qué es el Internet de las Cosas (IoT)?', NULL, NULL),
(12, 6, '¿Para qué se utiliza la tecnología blockchain?', NULL, NULL),
(13, 6, '¿Qué tecnología permite la impresión en 3 dimensiones?', NULL, NULL),
(14, 6, '¿Qué es el Big Data?', NULL, NULL),
(15, 6, '¿Cuál de estas opciones NO es un ejemplo de biotecnología?', NULL, NULL),
(32, 12, 'Juego 1', NULL, 0),
(33, 13, '¿Qué tipo de juego te gusta más?', NULL, NULL),
(34, 13, '¿Cuál es tu consola favorita?', NULL, NULL),
(35, 13, '¿Qué género de juegos prefieres?', NULL, NULL),
(36, 13, '¿Cuánto tiempo sueles jugar al día?', NULL, NULL),
(37, 13, '¿Juegas solo o con amigos?', NULL, NULL),
(38, 13, '¿Prefieres juegos en primera o tercera persona?', NULL, NULL),
(39, 13, '¿Qué tipo de historia prefieres en los juegos?', NULL, NULL),
(40, 14, 'Hola', NULL, 0),
(48, 16, '¿Qué significa CPU?', NULL, NULL),
(49, 16, '¿Cuál de las siguientes es una unidad de almacenamiento?', NULL, NULL),
(50, 16, '¿Qué sistema operativo es desarrollado por Apple?', NULL, NULL),
(51, 16, '¿Qué lenguaje de programación se utiliza para desarrollar aplicaciones web?', NULL, NULL),
(52, 16, '¿Qué es un algoritmo?', NULL, NULL),
(53, 16, '¿Para qué sirve el software antivirus?', NULL, NULL),
(54, 16, '¿Qué significa RAM?', NULL, NULL),
(55, 17, '¿Qué significa WWW?', NULL, NULL),
(56, 17, '¿Qué es la ciberseguridad?', NULL, NULL),
(57, 18, '¿Cuál es el planeta más cercano al Sol?', NULL, NULL),
(58, 18, '¿Qué planeta es conocido como el \'planeta rojo\'?', NULL, NULL),
(59, 19, '¿Cuál es el planeta más cercano al Sol?', NULL, NULL),
(60, 19, '¿Qué planeta es conocido como el \'planeta rojo\'?', NULL, NULL),
(61, 19, '¿Cuál es el planeta más grande del sistema solar?', NULL, NULL),
(62, 20, '¿Cuál es el planeta más cercano al Sol?', NULL, NULL),
(63, 20, '¿Qué planeta es conocido como el \'planeta rojo\'?', NULL, NULL),
(64, 20, '¿Cuál es el planeta más grande del sistema solar?', NULL, NULL),
(210, 22, '¿Cuál es el planeta más cercano al Sol?', '/uploads/image-1758686880648-492446870.jpg', NULL),
(211, 22, '¿Qué planeta es conocido como el \'planeta rojo\'?', NULL, NULL),
(212, 22, '¿Cuál es el planeta más grande del sistema solar?', NULL, NULL),
(213, 22, '¿De qué está compuesto principalmente el Sol?', NULL, NULL),
(214, 22, '¿Qué planeta tiene anillos visibles desde la Tierra?', NULL, NULL),
(595, 23, '¿Qué planeta tiene anillos prominentes hechos de hielo y roca?', '/uploads/image-1758686887405-896668428.jpg', NULL),
(596, 23, '¿Cuál es el mayor satélite natural del sistema solar?', '/uploads/image-1758732797720-247305393.png', NULL),
(597, 23, '¿Cuál es el planeta más cercano al Sol?', '/uploads/image-1758728491754-648087727.png', NULL),
(598, 23, '¿Qué planeta es conocido como el \'planeta rojo\'?', '/uploads/image-1758732791427-13000785.png', NULL),
(599, 23, '¿Cuál de estos cuerpos celestes NO es un planeta?', '/uploads/image-1758686880648-492446870.jpg', NULL),
(730, 24, '¿Cuál de los siguientes componentes electrónicos amplifica señales eléctricas?', '/uploads/image-1758686880648-492446870.jpg', NULL),
(731, 24, '¿Qué unidad se utiliza para medir la resistencia eléctrica?', '/uploads/image-1758732797720-247305393.png', NULL),
(732, 24, '¿Cuál es la función principal de un capacitor?', '/uploads/image-1758686880648-492446870.jpg', NULL),
(733, 24, '¿Qué tipo de corriente fluye en una dirección constante?', '/uploads/image-1758728491754-648087727.png', NULL),
(734, 24, '¿Cuál de los siguientes dispositivos electrónicos convierte la energía eléctrica en energía mecánica?', '/uploads/image-1758686887405-896668428.jpg', NULL),
(740, 25, '¿Cuál es la unidad de medida de la resistencia eléctrica en el Sistema Internacional?', NULL, NULL),
(741, 25, '¿Qué componente electrónico está diseñado específicamente para almacenar energía en un campo eléctrico?', NULL, NULL),
(742, 25, 'Según la Ley de Ohm, ¿cuál es la fórmula correcta que relaciona el voltaje (V), la corriente (I) y la resistencia (R)?', NULL, NULL),
(743, 25, '¿Qué componente semiconductor permite que la corriente fluya predominantemente en una sola dirección?', NULL, NULL),
(744, 25, '¿Qué significa el acrónimo \'LED\' en el contexto de la electrónica?', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `game_templates`
--

CREATE TABLE `game_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `structure` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`structure`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Volcado de datos para la tabla `game_templates`
--

INSERT INTO `game_templates` (`id`, `name`, `description`, `structure`) VALUES
(1, 'Cuestionario', 'Un juego clásico de preguntas y respuestas.', '{\"has_questions\": true, \"has_board\": false}'),
(2, 'Tablero Virtual', 'Un juego de tablero con casillas y fichas.', '{\"has_questions\": false, \"has_board\": true}');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `images`
--

CREATE TABLE `images` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `filename` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `images`
--

INSERT INTO `images` (`id`, `user_id`, `image_url`, `filename`, `created_at`) VALUES
(6, 7, '/uploads/image-1758648525638-203904045.png', 'DiseÃ±o sin tÃ­tulo (3).png', '2025-09-23 17:28:45'),
(7, 7, '/uploads/image-1758648612289-572445033.png', 'EP-B120_a-1500x1500-removebg-preview.png', '2025-09-23 17:30:12'),
(9, 7, '/uploads/image-1758678557531-68028532.png', 'BASU120-AZ-removebg-preview.png', '2025-09-24 01:49:17'),
(12, 7, '/uploads/image-1758679362558-137375877.png', 'BASU120-AZ-removebg-preview.png', '2025-09-24 02:02:42'),
(14, 7, '/uploads/image-1758679807108-616706976.jpg', 'caricatura-familia-fondo-blanco_873925-20556.jpg', '2025-09-24 02:10:07'),
(15, 7, '/uploads/image-1758679812695-890335419.jpg', '60ca1367096856455581537138313585.jpg', '2025-09-24 02:10:12'),
(16, 7, '/uploads/image-1758683852246-996781376.png', 'Poster.png', '2025-09-24 03:17:32'),
(17, 7, '/uploads/image-1758686379301-387644229.png', 'cascara_platano-removebg-preview.png', '2025-09-24 03:59:39'),
(18, 11, '/uploads/image-1758686880648-492446870.jpg', '60ca1367096856455581537138313585.jpg', '2025-09-24 04:08:00'),
(19, 11, '/uploads/image-1758686887405-896668428.jpg', 'caricatura-familia-fondo-blanco_873925-20556.jpg', '2025-09-24 04:08:07'),
(20, 11, '/uploads/image-1758728491754-648087727.png', 'DiseÃ±o sin tÃ­tulo (3).png', '2025-09-24 15:41:31'),
(21, 11, '/uploads/image-1758732791427-13000785.png', 'caja_carton-removebg-preview.png', '2025-09-24 16:53:11'),
(22, 11, '/uploads/image-1758732797720-247305393.png', 'botella_plastico-removebg-preview.png', '2025-09-24 16:53:17');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL,
  `reporter_id` int(11) DEFAULT NULL COMMENT 'El usuario que genera el reporte. Puede ser NULL si es un reporte del sistema.',
  `report_type` varchar(100) NOT NULL COMMENT 'Categoría del reporte, ej: "bug", "user_misconduct"',
  `description` text NOT NULL COMMENT 'Descripción detallada del reporte',
  `status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open' COMMENT 'Estado del reporte para seguimiento',
  `resolved_by` int(11) DEFAULT NULL COMMENT 'El admin que resolvió el reporte',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Contraseña siempre hasheada (ej. con bcrypt)',
  `role` enum('user','admin') NOT NULL DEFAULT 'user' COMMENT 'Rol para control de acceso',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `status`, `created_at`, `reset_token`, `reset_token_expires`) VALUES
(3, 'Juan ', 'juandavidduranmalaver@gmail.com', '$2b$10$VDxLhlobi5WZxGK7nb7dE.5LFDtmlz5IRih.Sf.HpaELsEEyCoH8K', 'admin', 'active', '2025-09-08 02:11:32', NULL, NULL),
(4, 'Juan Da', 'juanduranwhatsapp@gmail.com', '$2b$10$L6UmchrD0TpihMBoQ72wNe7NaqOoBn8rpx6A9SrW2.l2KfBL9cl4m', 'user', 'active', '2025-09-09 04:49:12', NULL, NULL),
(5, 'David', 'David@gmail.com', '$2b$10$5M/lggze5h3YSj1jXmxbt.1R5su53eUuaYMuimk/nazlMoBWynlcC', 'user', 'active', '2025-09-11 01:12:51', NULL, NULL),
(7, 'comoavvioc913@gmail.com', 'comoavvioc9@gmail.com', '$2b$10$NzdLVmP/RgvZtYC0MJ9rvOG8psIIMtOAmgxxGIFqLnMMSLPXl2ZDu', 'user', 'active', '2025-09-15 02:45:45', NULL, NULL),
(8, 'Alexis Jaimes', 'comoavvioc13@gmail.com', '$2b$10$v/F8MBhtM3HfF67huAnWnOcPjUtV33PaZmZAAn3sze7gPpSGPW2jS', 'user', 'active', '2025-09-15 02:46:29', NULL, NULL),
(11, 'comoavvioc2@gmail.com', 'comoavvioc2@gmail.com', '$2b$10$ym4A7hjUy54zLhLMsuolTOaBaNI3QXhthUl23/Dy/i29kCh8Brwh.', 'admin', 'active', '2025-09-24 04:07:40', NULL, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `games`
--
ALTER TABLE `games`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `template_id` (`template_id`),
  ADD KEY `fk_game_cover_image` (`cover_image_id`);

--
-- Indices de la tabla `games_old`
--
ALTER TABLE `games_old`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `game_answers`
--
ALTER TABLE `game_answers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `question_id` (`question_id`);

--
-- Indices de la tabla `game_plays`
--
ALTER TABLE `game_plays`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `game_questions`
--
ALTER TABLE `game_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `game_id` (`game_id`);

--
-- Indices de la tabla `game_templates`
--
ALTER TABLE `game_templates`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `images`
--
ALTER TABLE `images`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `image_url` (`image_url`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `resolved_by` (`resolved_by`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `games`
--
ALTER TABLE `games`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `games_old`
--
ALTER TABLE `games_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `game_answers`
--
ALTER TABLE `game_answers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2943;

--
-- AUTO_INCREMENT de la tabla `game_plays`
--
ALTER TABLE `game_plays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `game_questions`
--
ALTER TABLE `game_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=745;

--
-- AUTO_INCREMENT de la tabla `game_templates`
--
ALTER TABLE `game_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `images`
--
ALTER TABLE `images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `games`
--
ALTER TABLE `games`
  ADD CONSTRAINT `fk_game_cover_image` FOREIGN KEY (`cover_image_id`) REFERENCES `images` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `games_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `games_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `game_templates` (`id`);

--
-- Filtros para la tabla `games_old`
--
ALTER TABLE `games_old`
  ADD CONSTRAINT `games_old_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `game_answers`
--
ALTER TABLE `game_answers`
  ADD CONSTRAINT `game_answers_ibfk_1` FOREIGN KEY (`question_id`) REFERENCES `game_questions` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `game_plays`
--
ALTER TABLE `game_plays`
  ADD CONSTRAINT `game_plays_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `game_plays_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `game_questions`
--
ALTER TABLE `game_questions`
  ADD CONSTRAINT `game_questions_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `images`
--
ALTER TABLE `images`
  ADD CONSTRAINT `images_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rankings`
--

CREATE TABLE `rankings` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

--
-- Índices para tabla `rankings`
--
ALTER TABLE `rankings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `game_id` (`game_id`),
  ADD KEY `idx_game_score` (`game_id`, `percentage` DESC, `score` DESC, `created_at` ASC);

--
-- AUTO_INCREMENT de la tabla `rankings`
--
ALTER TABLE `rankings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Filtros para la tabla `rankings`
--
ALTER TABLE `rankings`
  ADD CONSTRAINT `rankings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rankings_ibfk_2` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`) ON DELETE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
