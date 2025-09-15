-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-09-2025 a las 06:37:56
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `artenity`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias_obra`
--

CREATE TABLE `categorias_obra` (
  `id_categoria` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias_obra`
--

INSERT INTO `categorias_obra` (`id_categoria`, `nombre`, `descripcion`) VALUES
(1, 'Pintura', 'Obras creadas con pigmentos sobre una superficie.'),
(2, 'Escultura', 'Arte tridimensional realizado en piedra, metal, madera u otros materiales.'),
(3, 'Dibujo', 'Técnica artística basada en líneas y trazos.'),
(4, 'Grabado', 'Reproducción de imágenes mediante matrices entintadas.'),
(5, 'Fotografía', 'Captura de imágenes con cámara.'),
(6, 'Cine', 'Arte audiovisual mediante secuencias fílmicas.'),
(7, 'Arquitectura', 'Diseño y construcción de estructuras con valor estético.'),
(8, 'Diseño', 'Creación visual funcional (gráfico, industrial, de moda, etc.).'),
(9, 'Teatro', 'Representación dramática en vivo.'),
(10, 'Danza', 'Expresión artística mediante el movimiento corporal.'),
(11, 'Ópera', 'Arte escénico que une música y canto lírico.'),
(12, 'Ballet', 'Danza clásica de alto rigor técnico.'),
(13, 'Circo', 'Espectáculos con acrobacia, magia, humor y más.'),
(14, 'Mímica', 'Expresión escénica basada en gestos y silencios.'),
(15, 'Música clásica', 'Composiciones académicas de tradición europea.'),
(16, 'Jazz', 'Género musical con énfasis en la improvisación.'),
(17, 'Rock', 'Género musical contemporáneo con guitarras y percusión.'),
(18, 'Pop', 'Música popular contemporánea de fácil acceso.'),
(19, 'Folclórica', 'Música tradicional de culturas populares.'),
(20, 'Electrónica', 'Música generada o manipulada digitalmente.'),
(21, 'Poesía', 'Composición literaria que expresa belleza o sentimiento.'),
(22, 'Narrativa', 'Relatos en forma de cuento o novela.'),
(23, 'Drama', 'Textos teatrales con carga emocional y conflicto.'),
(24, 'Ensayo', 'Texto argumentativo breve sobre un tema.'),
(25, 'Arte digital', 'Obras creadas usando medios digitales.'),
(26, 'Arte interactivo', 'Obras que requieren la participación del espectador.'),
(27, 'Arte de nuevos medios', 'Creaciones basadas en tecnología emergente.'),
(28, 'Animación', 'Imágenes en movimiento generadas por técnicas gráficas.'),
(29, 'Videojuegos', 'Medio interactivo con narrativa y diseño artístico.'),
(30, 'Artesanía', 'Producción manual con identidad cultural.'),
(31, 'Cerámica', 'Objetos artísticos modelados en arcilla.'),
(32, 'Textiles', 'Creaciones con tela, hilos y técnicas manuales.'),
(33, 'Joyería', 'Diseño artístico de adornos y accesorios.'),
(34, 'Orfebrería', 'Trabajo artístico en metales preciosos.'),
(35, 'Música y danza folclóricas', 'Expresiones musicales y coreográficas tradicionales.');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `colecciones_arte`
--

CREATE TABLE `colecciones_arte` (
  `id_coleccion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `colecciones_arte`
--

INSERT INTO `colecciones_arte` (`id_coleccion`, `id_usuario`, `nombre`, `descripcion`, `fecha_creacion`) VALUES
(1, 1, 'Favoritos del mes', 'Obras destacadas del mes', '2025-01-15 08:00:00'),
(2, 2, 'Inspiración natural', 'Obras con paisajes y naturaleza', '2025-01-15 08:10:00'),
(3, 3, 'Escultura top', 'Esculturas que me inspiran', '2025-01-15 08:20:00'),
(4, 4, 'Mis ilustraciones', 'Colección personal de ilustraciones', '2025-01-15 08:30:00'),
(5, 5, 'Técnica mixta', 'Mezcla de estilos y técnicas', '2025-01-15 08:40:00'),
(6, 6, 'Acuarelas suaves', 'Obras en acuarela con tonos suaves', '2025-01-15 08:50:00'),
(7, 7, 'Arte digital', 'Obras realizadas en digital', '2025-01-15 09:00:00'),
(8, 8, 'Tinta & papel', 'Dibujos en tinta', '2025-01-15 09:10:00'),
(9, 9, 'Collage creativo', 'Recortes e ideas en papel', '2025-01-15 09:20:00'),
(10, 10, 'Murales favoritos', 'Pinturas en muros urbanos', '2025-01-15 09:30:00'),
(11, 11, 'Colores vivos', 'Obras con colores fuertes y brillantes', '2025-01-15 09:40:00'),
(12, 12, 'Sombras y luces', 'Estudio de contrastes', '2025-01-15 09:50:00'),
(13, 13, 'Clásicos modernos', 'Obras de arte moderno que me encantan', '2025-01-15 10:00:00'),
(14, 14, 'Bocetos', 'Dibujos y esbozos iniciales', '2025-01-15 10:10:00'),
(15, 15, 'Arte político', 'Obras con mensajes sociales', '2025-01-15 10:20:00'),
(16, 16, 'Retratos', 'Rostros humanos expresivos', '2025-01-15 10:30:00'),
(17, 17, 'Animales', 'Obras de fauna real e imaginaria', '2025-01-15 10:40:00'),
(18, 18, 'Obras compartidas', 'Obras que otros me recomendaron', '2025-01-15 10:50:00'),
(19, 19, 'Estilo pop', 'Colores y estilo de cultura pop', '2025-01-15 11:00:00'),
(20, 20, 'Escenarios urbanos', 'Arte sobre la ciudad', '2025-01-15 11:10:00'),
(21, 21, 'Detalles pequeños', 'Miniaturas y detalles finos', '2025-01-15 11:20:00'),
(22, 22, 'Rostros famosos', 'Personajes conocidos en el arte', '2025-01-15 11:30:00'),
(23, 23, 'Fotografía artística', 'Imágenes con mirada artística', '2025-01-15 11:40:00'),
(24, 24, 'Mi historia', 'Obras que me representan', '2025-01-15 11:50:00'),
(25, 25, 'Composición digital', 'Ediciones y montajes creativos', '2025-01-15 12:00:00'),
(26, 26, 'Infancia', 'Obras sobre la niñez y juego', '2025-01-15 12:10:00'),
(27, 27, 'Arte visual 2025', 'Lo mejor del arte de este año', '2025-01-15 12:20:00'),
(28, 28, 'Estilo libre', 'Obras sin categoría definida', '2025-01-15 12:30:00'),
(29, 29, 'Proyecto final', 'Obras para mi portafolio', '2025-01-15 12:40:00'),
(30, 30, 'Simbolismo', 'Obras con gran carga simbólica', '2025-01-15 12:50:00'),
(31, 1, 'Inspiración Visual', 'Obras que me inspiran a diario', '2025-08-24 12:50:42'),
(32, 2, 'Mis Favoritas', 'Colección de mis obras favoritas', '2025-08-24 12:50:42'),
(33, 3, 'Pinturas al óleo', 'Pinturas seleccionadas al óleo', '2025-08-24 12:50:42'),
(34, 4, 'Galería Urbana', 'Arte callejero y urbano', '2025-08-24 12:50:42'),
(35, 5, 'Realismo Mágico', 'Obras con estilo surrealista y mágico', '2025-08-24 12:50:42'),
(36, 6, 'Sombras y Luces', 'Estudio de contraste en obras', '2025-08-24 12:50:42'),
(37, 7, 'Naturaleza Viva', 'Pinturas y fotos de la naturaleza', '2025-08-24 12:50:42'),
(38, 8, 'Digital World', 'Arte hecho con herramientas digitales', '2025-08-24 12:50:42'),
(39, 9, 'Expresionismo', 'Obras con estilo expresionista', '2025-08-24 12:50:42'),
(40, 10, 'Tinta Negra', 'Dibujos en tinta monocromática', '2025-08-24 12:50:42'),
(41, 11, 'Arte Geométrico', 'Formas abstractas y geométricas', '2025-08-24 12:50:42'),
(42, 12, 'Impresionismo', 'Pinceladas libres y colores vivos', '2025-08-24 12:50:42'),
(43, 13, 'Retratos', 'Colección de retratos de artistas emergentes', '2025-08-24 12:50:42'),
(44, 14, 'Mis composiciones', 'Obras propias guardadas', '2025-08-24 12:50:42'),
(45, 15, 'Arte Literario', 'Obras que nacen de la literatura', '2025-08-24 12:50:42'),
(46, 16, 'El Color Azul', 'Obras dominadas por el color azul', '2025-08-24 12:50:42'),
(47, 17, 'Minimalismo', 'Colección de arte minimalista', '2025-08-24 12:50:42'),
(48, 18, 'Mis bocetos', 'Bocetos iniciales e ideas crudas', '2025-08-24 12:50:42'),
(49, 19, 'Sombras del alma', 'Colección con emociones oscuras', '2025-08-24 12:50:42'),
(50, 20, 'Arte Experimental', 'Obras fuera de lo convencional', '2025-08-24 12:50:42'),
(51, 21, 'Poesía Visual', 'Obras que mezclan palabra e imagen', '2025-08-24 12:50:42'),
(52, 22, 'Cultura Pop', 'Obras influenciadas por la cultura popular', '2025-08-24 12:50:42'),
(53, 23, 'Mujeres en el Arte', 'Obras hechas por y sobre mujeres', '2025-08-24 12:50:42'),
(54, 24, 'Monocromos', 'Obras en una sola tonalidad', '2025-08-24 12:50:42'),
(55, 25, 'Simbolismo', 'Colección cargada de símbolos y metáforas', '2025-08-24 12:50:42'),
(56, 26, 'Viajes y paisajes', 'Obras inspiradas en viajes', '2025-08-24 12:50:42'),
(57, 27, 'Arte latinoamericano', 'Obras de autores latinos', '2025-08-24 12:50:42'),
(58, 28, 'Infantil y colorido', 'Obras alegres y para todas las edades', '2025-08-24 12:50:42'),
(59, 29, 'Misterio y oscuridad', 'Obras en estilo gótico y oscuro', '2025-08-24 12:50:42'),
(60, 30, 'Fragmentos de mí', 'Obras con las que me identifico', '2025-08-24 12:50:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `colecciones_obras`
--

CREATE TABLE `colecciones_obras` (
  `id` int(11) NOT NULL,
  `id_coleccion` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `colecciones_obras`
--

INSERT INTO `colecciones_obras` (`id`, `id_coleccion`, `id_publicacion`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 2, 3),
(4, 2, 4),
(5, 3, 5),
(6, 3, 6),
(7, 4, 7),
(8, 4, 8),
(9, 5, 9),
(10, 5, 10),
(11, 6, 11),
(12, 6, 12),
(13, 7, 13),
(14, 7, 14),
(15, 8, 15),
(16, 8, 16),
(17, 9, 17),
(18, 9, 18),
(19, 10, 19),
(20, 10, 20),
(21, 11, 21),
(22, 11, 22),
(23, 12, 23),
(24, 12, 24),
(25, 13, 25),
(26, 13, 26),
(27, 14, 27),
(28, 14, 28),
(29, 15, 29),
(30, 15, 30);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios_obra`
--

CREATE TABLE `comentarios_obra` (
  `id_comentario` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_comentario` datetime DEFAULT current_timestamp(),
  `id_comentario_padre` int(11) DEFAULT NULL,
  `tipo_reaccion` enum('ninguna','me gusta','me encanta','wow') DEFAULT 'ninguna',
  `estado` enum('visible','oculto','reportado') DEFAULT 'visible',
  `es_editado` tinyint(1) DEFAULT 0,
  `numero_reportes` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `comentarios_obra`
--

INSERT INTO `comentarios_obra` (`id_comentario`, `id_usuario`, `id_publicacion`, `contenido`, `fecha_comentario`, `id_comentario_padre`, `tipo_reaccion`, `estado`, `es_editado`, `numero_reportes`) VALUES
(1, 2, 1, 'Me encanta el paisaje', '2025-01-12 08:00:00', NULL, 'me gusta', 'visible', 0, 0),
(2, 3, 1, 'Los colores son muy vivos', '2025-01-12 08:10:00', NULL, 'me encanta', 'visible', 0, 0),
(3, 4, 2, 'Gran técnica en la escultura', '2025-01-12 08:15:00', NULL, 'wow', 'visible', 0, 0),
(4, 5, 3, 'La luz está perfectamente capturada', '2025-01-12 08:20:00', NULL, 'me gusta', 'visible', 0, 0),
(5, 6, 4, 'Muy buen uso de herramientas digitales', '2025-01-12 08:30:00', NULL, 'me encanta', 'visible', 0, 0),
(6, 7, 5, 'Inspirador diseño', '2025-01-12 08:40:00', NULL, 'wow', 'visible', 0, 0),
(7, 8, 6, '¡Quiero ver más ilustraciones!', '2025-01-12 08:50:00', NULL, 'me gusta', 'visible', 0, 0),
(8, 9, 7, 'Los tonos son perfectos', '2025-01-12 09:00:00', NULL, 'me encanta', 'visible', 0, 0),
(9, 10, 8, 'La línea es precisa y expresiva', '2025-01-12 09:10:00', NULL, 'wow', 'visible', 0, 0),
(10, 11, 9, 'Hermoso trabajo de collage', '2025-01-12 09:20:00', NULL, 'me gusta', 'visible', 0, 0),
(11, 12, 10, '¡Ese mural tiene mucho impacto!', '2025-01-12 09:30:00', NULL, 'me encanta', 'visible', 0, 0),
(12, 13, 11, 'Vibrante y con actitud', '2025-01-12 09:40:00', NULL, 'wow', 'visible', 0, 0),
(13, 14, 12, 'Una abstracción que comunica', '2025-01-12 09:50:00', NULL, 'me gusta', 'visible', 0, 0),
(14, 15, 13, 'Muy realista, casi parece una foto', '2025-01-12 10:00:00', NULL, 'me encanta', 'visible', 0, 0),
(15, 16, 14, 'Conceptualmente poderoso', '2025-01-12 10:10:00', NULL, 'wow', 'visible', 0, 0),
(16, 17, 15, 'Buen retrato, transmite emoción', '2025-01-12 10:20:00', NULL, 'me gusta', 'visible', 0, 0),
(17, 18, 16, 'Hermosa acuarela', '2025-01-12 10:30:00', NULL, 'me encanta', 'visible', 0, 0),
(18, 19, 17, '¿Dónde fue esta performance?', '2025-01-12 10:40:00', NULL, 'wow', 'visible', 0, 0),
(19, 20, 18, 'Colores muy llamativos', '2025-01-12 10:50:00', NULL, 'me gusta', 'visible', 0, 0),
(20, 21, 19, 'Buen mensaje social', '2025-01-12 11:00:00', NULL, 'me encanta', 'visible', 0, 0),
(21, 22, 20, 'Sonido envolvente', '2025-01-12 11:10:00', NULL, 'wow', 'visible', 0, 0),
(22, 23, 21, 'Elegante caligrafía', '2025-01-12 11:20:00', NULL, 'me gusta', 'visible', 0, 0),
(23, 24, 22, '¡Increíble tejido!', '2025-01-12 11:30:00', NULL, 'me encanta', 'visible', 0, 0),
(24, 25, 23, 'Me gusta el diseño de la app', '2025-01-12 11:40:00', NULL, 'wow', 'visible', 0, 0),
(25, 26, 24, 'Muy interesante uso cultural', '2025-01-12 11:50:00', NULL, 'me gusta', 'visible', 0, 0),
(26, 27, 25, 'Buena composición', '2025-01-12 12:00:00', NULL, 'me encanta', 'visible', 0, 0),
(27, 28, 26, 'Impactante mensaje', '2025-01-12 12:10:00', NULL, 'wow', 'visible', 0, 0),
(28, 29, 27, 'Me gusta el diseño', '2025-01-12 12:20:00', NULL, 'me gusta', 'visible', 0, 0),
(29, 30, 28, 'Textura muy bien lograda', '2025-01-12 12:30:00', NULL, 'me encanta', 'visible', 0, 0),
(30, 1, 1, 'Gracias por compartir', '2025-01-12 12:40:00', 1, 'me gusta', 'visible', 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `configuracion_usuario`
--

CREATE TABLE `configuracion_usuario` (
  `id_configuracion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `modo_oscuro` tinyint(1) DEFAULT 0,
  `tamaño_fuente` enum('pequeño','mediano','grande') DEFAULT 'mediano',
  `alto_contraste` tinyint(1) DEFAULT 0,
  `idioma_preferido` varchar(50) DEFAULT 'español',
  `privacidad_perfil` enum('publico','privado','solo_amigos') DEFAULT 'publico',
  `recibir_notificaciones` tinyint(1) DEFAULT 1,
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `configuracion_usuario`
--

INSERT INTO `configuracion_usuario` (`id_configuracion`, `id_usuario`, `modo_oscuro`, `tamaño_fuente`, `alto_contraste`, `idioma_preferido`, `privacidad_perfil`, `recibir_notificaciones`, `fecha_actualizacion`) VALUES
(1, 1, 1, 'mediano', 0, 'español', 'publico', 1, '2025-08-24 12:50:42'),
(2, 2, 0, 'grande', 1, 'inglés', 'privado', 1, '2025-08-24 12:50:42'),
(3, 3, 1, 'pequeño', 0, 'portugués', 'solo_amigos', 0, '2025-08-24 12:50:42'),
(4, 4, 0, 'mediano', 0, 'español', 'publico', 1, '2025-08-24 12:50:42'),
(5, 5, 1, 'grande', 1, 'francés', 'privado', 0, '2025-08-24 12:50:42'),
(6, 6, 1, 'mediano', 0, 'alemán', 'solo_amigos', 1, '2025-08-24 12:50:42'),
(7, 7, 0, 'pequeño', 1, 'español', 'publico', 1, '2025-08-24 12:50:42'),
(8, 8, 1, 'grande', 0, 'italiano', 'privado', 1, '2025-08-24 12:50:42'),
(9, 9, 0, 'mediano', 0, 'español', 'solo_amigos', 0, '2025-08-24 12:50:42'),
(10, 10, 1, 'pequeño', 1, 'español', 'publico', 1, '2025-08-24 12:50:42'),
(11, 11, 1, 'mediano', 0, 'japonés', 'privado', 0, '2025-08-24 12:50:42'),
(12, 12, 0, 'grande', 1, 'español', 'solo_amigos', 1, '2025-08-24 12:50:42'),
(13, 13, 1, 'mediano', 1, 'coreano', 'publico', 1, '2025-08-24 12:50:42'),
(14, 14, 0, 'pequeño', 0, 'español', 'privado', 1, '2025-08-24 12:50:42'),
(15, 15, 1, 'grande', 1, 'inglés', 'solo_amigos', 0, '2025-08-24 12:50:42'),
(16, 16, 0, 'mediano', 0, 'español', 'publico', 1, '2025-08-24 12:50:42'),
(17, 17, 1, 'pequeño', 1, 'francés', 'privado', 1, '2025-08-24 12:50:42'),
(18, 18, 1, 'grande', 0, 'español', 'solo_amigos', 1, '2025-08-24 12:50:42'),
(19, 19, 0, 'mediano', 1, 'alemán', 'publico', 0, '2025-08-24 12:50:42'),
(20, 20, 1, 'pequeño', 0, 'español', 'privado', 1, '2025-08-24 12:50:42'),
(21, 21, 0, 'grande', 1, 'italiano', 'solo_amigos', 1, '2025-08-24 12:50:42'),
(22, 22, 1, 'mediano', 1, 'portugués', 'publico', 1, '2025-08-24 12:50:42'),
(23, 23, 0, 'pequeño', 0, 'español', 'privado', 0, '2025-08-24 12:50:42'),
(24, 24, 1, 'grande', 1, 'español', 'solo_amigos', 1, '2025-08-24 12:50:42'),
(25, 25, 0, 'mediano', 0, 'español', 'publico', 1, '2025-08-24 12:50:42'),
(26, 26, 1, 'pequeño', 1, 'inglés', 'privado', 1, '2025-08-24 12:50:42'),
(27, 27, 0, 'grande', 0, 'francés', 'solo_amigos', 0, '2025-08-24 12:50:42'),
(28, 28, 1, 'mediano', 1, 'español', 'publico', 1, '2025-08-24 12:50:42'),
(29, 29, 0, 'pequeño', 0, 'alemán', 'privado', 1, '2025-08-24 12:50:42'),
(30, 30, 1, 'grande', 1, 'español', 'solo_amigos', 1, '2025-08-24 12:50:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `galeria_arte`
--

CREATE TABLE `galeria_arte` (
  `id_galeria` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `tipo` enum('destacada','nueva','popular','recomendada') DEFAULT 'nueva',
  `fecha_agregado` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `galeria_arte`
--

INSERT INTO `galeria_arte` (`id_galeria`, `id_publicacion`, `tipo`, `fecha_agregado`) VALUES
(1, 1, 'destacada', '2025-01-18 08:00:00'),
(2, 2, 'nueva', '2025-01-18 08:05:00'),
(3, 3, 'popular', '2025-01-18 08:10:00'),
(4, 4, 'recomendada', '2025-01-18 08:15:00'),
(5, 5, 'destacada', '2025-01-18 08:20:00'),
(6, 6, 'nueva', '2025-01-18 08:25:00'),
(7, 7, 'popular', '2025-01-18 08:30:00'),
(8, 8, 'recomendada', '2025-01-18 08:35:00'),
(9, 9, 'destacada', '2025-01-18 08:40:00'),
(10, 10, 'nueva', '2025-01-18 08:45:00'),
(11, 11, 'popular', '2025-01-18 08:50:00'),
(12, 12, 'recomendada', '2025-01-18 08:55:00'),
(13, 13, 'destacada', '2025-01-18 09:00:00'),
(14, 14, 'nueva', '2025-01-18 09:05:00'),
(15, 15, 'popular', '2025-01-18 09:10:00'),
(16, 16, 'recomendada', '2025-01-18 09:15:00'),
(17, 17, 'destacada', '2025-01-18 09:20:00'),
(18, 18, 'nueva', '2025-01-18 09:25:00'),
(19, 19, 'popular', '2025-01-18 09:30:00'),
(20, 20, 'recomendada', '2025-01-18 09:35:00'),
(21, 21, 'destacada', '2025-01-18 09:40:00'),
(22, 22, 'nueva', '2025-01-18 09:45:00'),
(23, 23, 'popular', '2025-01-18 09:50:00'),
(24, 24, 'recomendada', '2025-01-18 09:55:00'),
(25, 25, 'destacada', '2025-01-18 10:00:00'),
(26, 26, 'nueva', '2025-01-18 10:05:00'),
(27, 27, 'popular', '2025-01-18 10:10:00'),
(28, 28, 'recomendada', '2025-01-18 10:15:00'),
(29, 29, 'destacada', '2025-01-18 10:20:00'),
(30, 30, 'nueva', '2025-01-18 10:25:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `guardados_obra`
--

CREATE TABLE `guardados_obra` (
  `id_guardado` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `fecha_guardado` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `guardados_obra`
--

INSERT INTO `guardados_obra` (`id_guardado`, `id_usuario`, `id_publicacion`, `fecha_guardado`) VALUES
(1, 1, 5, '2025-08-24 12:50:42'),
(2, 2, 8, '2025-08-24 12:50:42'),
(3, 3, 3, '2025-08-24 12:50:42'),
(4, 4, 12, '2025-08-24 12:50:42'),
(5, 5, 1, '2025-08-24 12:50:42'),
(6, 6, 6, '2025-08-24 12:50:42'),
(7, 7, 2, '2025-08-24 12:50:42'),
(8, 8, 4, '2025-08-24 12:50:42'),
(9, 9, 9, '2025-08-24 12:50:42'),
(10, 10, 7, '2025-08-24 12:50:42'),
(11, 11, 10, '2025-08-24 12:50:42'),
(12, 12, 11, '2025-08-24 12:50:42'),
(13, 13, 13, '2025-08-24 12:50:42'),
(14, 14, 14, '2025-08-24 12:50:42'),
(15, 15, 15, '2025-08-24 12:50:42'),
(16, 16, 16, '2025-08-24 12:50:42'),
(17, 17, 17, '2025-08-24 12:50:42'),
(18, 18, 18, '2025-08-24 12:50:42'),
(19, 19, 19, '2025-08-24 12:50:42'),
(20, 20, 20, '2025-08-24 12:50:42'),
(21, 21, 21, '2025-08-24 12:50:42'),
(22, 22, 22, '2025-08-24 12:50:42'),
(23, 23, 23, '2025-08-24 12:50:42'),
(24, 24, 24, '2025-08-24 12:50:42'),
(25, 25, 25, '2025-08-24 12:50:42'),
(26, 26, 26, '2025-08-24 12:50:42'),
(27, 27, 27, '2025-08-24 12:50:42'),
(28, 28, 28, '2025-08-24 12:50:42'),
(29, 29, 29, '2025-08-24 12:50:42'),
(30, 30, 30, '2025-08-24 12:50:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_interacciones_obra`
--

CREATE TABLE `historial_interacciones_obra` (
  `id_historial` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(255) DEFAULT NULL,
  `fecha_accion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `historial_interacciones_obra`
--

INSERT INTO `historial_interacciones_obra` (`id_historial`, `id_publicacion`, `id_usuario`, `accion`, `fecha_accion`) VALUES
(1, 1, 2, 'Comentario', '2025-01-12 13:00:00'),
(2, 2, 3, 'Like', '2025-01-12 13:05:00'),
(3, 3, 4, 'Comentario', '2025-01-12 13:10:00'),
(4, 4, 5, 'Guardado', '2025-01-12 13:15:00'),
(5, 5, 6, 'Compartido', '2025-01-12 13:20:00'),
(6, 6, 7, 'Like', '2025-01-12 13:25:00'),
(7, 7, 8, 'Comentario', '2025-01-12 13:30:00'),
(8, 8, 9, 'Reporte', '2025-01-12 13:35:00'),
(9, 9, 10, 'Editado', '2025-01-12 13:40:00'),
(10, 10, 11, 'Comentario', '2025-01-12 13:45:00'),
(11, 11, 12, 'Like', '2025-01-12 13:50:00'),
(12, 12, 13, 'Guardado', '2025-01-12 13:55:00'),
(13, 13, 14, 'Comentario', '2025-01-12 14:00:00'),
(14, 14, 15, 'Like', '2025-01-12 14:05:00'),
(15, 15, 16, 'Guardado', '2025-01-12 14:10:00'),
(16, 16, 17, 'Reporte', '2025-01-12 14:15:00'),
(17, 17, 18, 'Comentario', '2025-01-12 14:20:00'),
(18, 18, 19, 'Like', '2025-01-12 14:25:00'),
(19, 19, 20, 'Comentario', '2025-01-12 14:30:00'),
(20, 20, 21, 'Guardado', '2025-01-12 14:35:00'),
(21, 21, 22, 'Comentario', '2025-01-12 14:40:00'),
(22, 22, 23, 'Like', '2025-01-12 14:45:00'),
(23, 23, 24, 'Comentario', '2025-01-12 14:50:00'),
(24, 24, 25, 'Compartido', '2025-01-12 14:55:00'),
(25, 25, 26, 'Comentario', '2025-01-12 15:00:00'),
(26, 26, 27, 'Like', '2025-01-12 15:05:00'),
(27, 27, 28, 'Guardado', '2025-01-12 15:10:00'),
(28, 28, 29, 'Reporte', '2025-01-12 15:15:00'),
(29, 29, 30, 'Comentario', '2025-01-12 15:20:00'),
(30, 30, 1, 'Like', '2025-01-12 15:25:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `likes_obra`
--

CREATE TABLE `likes_obra` (
  `id_like` int(11) NOT NULL,
  `id_publicacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `tipo_reaccion` varchar(20) DEFAULT NULL,
  `fecha_like` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `likes_obra`
--

INSERT INTO `likes_obra` (`id_like`, `id_publicacion`, `id_usuario`, `tipo_reaccion`, `fecha_like`) VALUES
(1, 1, 2, 'me gusta', '2025-01-11 08:00:00'),
(2, 2, 3, 'me encanta', '2025-01-11 08:10:00'),
(3, 3, 4, 'wow', '2025-01-11 08:20:00'),
(4, 4, 5, 'me gusta', '2025-01-11 08:30:00'),
(5, 5, 6, 'me encanta', '2025-01-11 08:40:00'),
(6, 6, 7, 'wow', '2025-01-11 08:50:00'),
(7, 7, 8, 'me gusta', '2025-01-11 09:00:00'),
(8, 8, 9, 'me encanta', '2025-01-11 09:10:00'),
(9, 9, 10, 'wow', '2025-01-11 09:20:00'),
(10, 10, 11, 'me gusta', '2025-01-11 09:30:00'),
(11, 11, 12, 'me encanta', '2025-01-11 09:40:00'),
(12, 12, 13, 'wow', '2025-01-11 09:50:00'),
(13, 13, 14, 'me gusta', '2025-01-11 10:00:00'),
(14, 14, 15, 'me encanta', '2025-01-11 10:10:00'),
(15, 15, 16, 'wow', '2025-01-11 10:20:00'),
(16, 16, 17, 'me gusta', '2025-01-11 10:30:00'),
(17, 17, 18, 'me encanta', '2025-01-11 10:40:00'),
(18, 18, 19, 'wow', '2025-01-11 10:50:00'),
(19, 19, 20, 'me gusta', '2025-01-11 11:00:00'),
(20, 20, 21, 'me encanta', '2025-01-11 11:10:00'),
(21, 21, 22, 'wow', '2025-01-11 11:20:00'),
(22, 22, 23, 'me gusta', '2025-01-11 11:30:00'),
(23, 23, 24, 'me encanta', '2025-01-11 11:40:00'),
(24, 24, 25, 'wow', '2025-01-11 11:50:00'),
(25, 25, 26, 'me gusta', '2025-01-11 12:00:00'),
(26, 26, 27, 'me encanta', '2025-01-11 12:10:00'),
(27, 27, 28, 'wow', '2025-01-11 12:20:00'),
(28, 28, 29, 'me gusta', '2025-01-11 12:30:00'),
(29, 29, 30, 'me encanta', '2025-01-11 12:40:00'),
(30, 30, 1, 'wow', '2025-01-11 12:50:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_privados`
--

CREATE TABLE `mensajes_privados` (
  `id_mensaje` int(11) NOT NULL,
  `id_emisor` int(11) NOT NULL,
  `id_receptor` int(11) NOT NULL,
  `contenido` text DEFAULT NULL,
  `fecha_envio` datetime DEFAULT current_timestamp(),
  `leido` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `mensajes_privados`
--

INSERT INTO `mensajes_privados` (`id_mensaje`, `id_emisor`, `id_receptor`, `contenido`, `fecha_envio`, `leido`) VALUES
(1, 1, 2, 'Hola, ¿cómo estás?', '2025-01-08 10:00:00', 0),
(2, 2, 1, 'Bien, ¿y tú?', '2025-01-08 10:01:00', 1),
(3, 3, 4, '¿Te gustó mi nueva obra?', '2025-01-08 11:30:00', 0),
(4, 4, 3, 'Sí, está increíble.', '2025-01-08 11:45:00', 1),
(5, 5, 6, '¿Vas a participar en el taller?', '2025-01-08 12:00:00', 0),
(6, 6, 5, 'Claro que sí.', '2025-01-08 12:05:00', 1),
(7, 7, 8, 'Hola, ¿aceptas colaboraciones?', '2025-01-08 13:00:00', 0),
(8, 8, 7, 'Sí, mándame una propuesta.', '2025-01-08 13:05:00', 1),
(9, 9, 10, 'Te seguí, me encanta tu arte.', '2025-01-08 14:00:00', 0),
(10, 10, 9, 'Gracias por el apoyo.', '2025-01-08 14:05:00', 1),
(11, 11, 12, '¿Puedo usar tu imagen como referencia?', '2025-01-08 15:00:00', 0),
(12, 12, 11, 'Sí, con créditos por favor.', '2025-01-08 15:05:00', 1),
(13, 13, 14, 'Nos vemos en el evento.', '2025-01-08 16:00:00', 0),
(14, 14, 13, '¡Claro! Allá estaré.', '2025-01-08 16:10:00', 1),
(15, 15, 16, 'Tengo una consulta técnica.', '2025-01-08 17:00:00', 0),
(16, 16, 15, 'Te ayudo con gusto.', '2025-01-08 17:05:00', 1),
(17, 17, 18, '¿Te gustaría colaborar?', '2025-01-08 18:00:00', 0),
(18, 18, 17, 'Sí, ¿qué tienes en mente?', '2025-01-08 18:10:00', 1),
(19, 19, 20, 'Te mandé mi portafolio.', '2025-01-08 19:00:00', 0),
(20, 20, 19, 'Lo reviso esta noche.', '2025-01-08 19:10:00', 1),
(21, 21, 22, 'Tu estilo me inspiró.', '2025-01-08 20:00:00', 0),
(22, 22, 21, '¡Qué emoción leer eso!', '2025-01-08 20:05:00', 1),
(23, 23, 24, 'Vamos al taller juntos.', '2025-01-08 21:00:00', 0),
(24, 24, 23, 'Sí, nos vemos allá.', '2025-01-08 21:10:00', 1),
(25, 25, 26, 'Gracias por seguirme.', '2025-01-08 22:00:00', 0),
(26, 26, 25, '¡Con gusto!', '2025-01-08 22:10:00', 1),
(27, 27, 28, 'Revisé tu blog, muy interesante.', '2025-01-08 23:00:00', 0),
(28, 28, 27, 'Gracias, lo actualizo cada semana.', '2025-01-08 23:10:00', 1),
(29, 29, 30, '¿Qué piensas de mi obra?', '2025-01-09 00:00:00', 0),
(30, 30, 29, 'Tiene mucha fuerza visual.', '2025-01-09 00:10:00', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id_notificacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `mensaje` text DEFAULT NULL,
  `leido` tinyint(1) DEFAULT 0,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id_notificacion`, `id_usuario`, `mensaje`, `leido`, `fecha`) VALUES
(1, 1, 'Tu perfil fue visitado por otro usuario.', 0, '2025-01-08 09:00:00'),
(2, 2, 'Tu publicación recibió una nueva reacción.', 1, '2025-01-09 10:15:00'),
(3, 3, 'Has sido mencionado en un comentario.', 0, '2025-01-10 11:30:00'),
(4, 4, 'Tu obra fue destacada en la galería.', 1, '2025-01-11 12:45:00'),
(5, 5, 'Nueva solicitud de seguimiento.', 0, '2025-01-12 14:00:00'),
(6, 6, 'Tu contraseña ha sido cambiada.', 1, '2025-01-13 15:15:00'),
(7, 7, 'Alguien ha comentado en tu obra.', 0, '2025-01-14 16:30:00'),
(8, 8, 'Tu cuenta ha sido verificada.', 1, '2025-01-15 17:45:00'),
(9, 9, 'Publicación reportada eliminada.', 1, '2025-01-16 19:00:00'),
(10, 10, 'Nuevo taller disponible.', 0, '2025-01-17 20:15:00'),
(11, 11, 'Recibiste un mensaje privado.', 0, '2025-01-18 21:30:00'),
(12, 12, 'Tu perfil fue actualizado.', 1, '2025-01-19 22:45:00'),
(13, 13, 'Un amigo se unió a Artenity.', 0, '2025-01-20 23:59:00'),
(14, 14, 'Has sido bloqueado por otro usuario.', 1, '2025-01-21 08:00:00'),
(15, 15, 'Tu contenido fue valorado positivamente.', 0, '2025-01-22 09:30:00'),
(16, 16, 'Tienes nuevos seguidores.', 1, '2025-01-23 10:45:00'),
(17, 17, 'Tu configuración ha sido cambiada.', 1, '2025-01-24 12:00:00'),
(18, 18, 'Un administrador respondió tu reporte.', 1, '2025-01-25 13:15:00'),
(19, 19, 'Tu mensaje fue leído.', 1, '2025-01-26 14:30:00'),
(20, 20, 'Actualización de términos y condiciones.', 0, '2025-01-27 15:45:00'),
(21, 21, 'Recibiste una invitación a comunidad.', 0, '2025-01-28 17:00:00'),
(22, 22, 'Un taller al que te inscribiste comienza pronto.', 0, '2025-01-29 18:15:00'),
(23, 23, 'Tu obra fue agregada a una colección.', 1, '2025-01-30 19:30:00'),
(24, 24, 'Tienes nuevos mensajes pendientes.', 0, '2025-01-31 21:00:00'),
(25, 25, 'El usuario que bloqueaste cambió su nombre.', 1, '2025-02-01 22:10:00'),
(26, 26, 'Tu cuenta fue visitada desde un nuevo dispositivo.', 0, '2025-02-02 08:20:00'),
(27, 27, 'Has recibido una recomendación.', 1, '2025-02-03 09:35:00'),
(28, 28, 'Tu reacción ha sido respondida.', 0, '2025-02-04 10:50:00'),
(29, 29, 'Se ha actualizado tu categoría de arte preferido.', 1, '2025-02-05 12:05:00'),
(30, 30, 'El administrador publicó una noticia importante.', 0, '2025-02-06 13:20:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perfiles`
--

CREATE TABLE `perfiles` (
  `id_perfil` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `biografia` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `perfiles`
--

INSERT INTO `perfiles` (`id_perfil`, `id_usuario`, `descripcion`, `foto_perfil`, `biografia`) VALUES
(1, 1, 'Artista digital apasionado.', 'foto1.jpg', 'Explorador del color y la forma.'),
(2, 2, 'Dibujante y escritor.', 'foto2.jpg', 'Apasionado por la narrativa gráfica.'),
(3, 3, 'Pintor abstracto.', 'foto3.jpg', 'Uso la pintura para expresar emociones.'),
(4, 4, 'Escultora contemporánea.', 'foto4.jpg', 'Transformo ideas en volúmenes.'),
(5, 5, 'Ilustrador infantil.', 'foto5.jpg', 'Doy vida a personajes mágicos.'),
(6, 6, 'Diseñador gráfico.', 'foto6.jpg', 'Fusiono arte y comunicación.'),
(7, 7, 'Creador multimedia.', 'foto7.jpg', 'Arte en movimiento y sonido.'),
(8, 8, 'Artista urbano.', 'foto8.jpg', 'Las calles son mi lienzo.'),
(9, 9, 'Poeta visual.', 'foto9.jpg', 'Versos y visuales.'),
(10, 10, 'Fotógrafa documental.', 'foto10.jpg', 'Historias reales a través del lente.'),
(11, 11, 'Pintora realista.', 'foto11.jpg', 'Capturo detalles con precisión.'),
(12, 12, 'Muralista.', 'foto12.jpg', 'Colores en gran formato.'),
(13, 13, 'Diseñador de modas.', 'foto13.jpg', 'La tela como expresión artística.'),
(14, 14, 'Dibujante manga.', 'foto14.jpg', 'Historias japonesas con mi estilo.'),
(15, 15, 'Artista conceptual.', 'foto15.jpg', 'Ideas transformadas en obras.'),
(16, 16, 'Animadora 2D.', 'foto16.jpg', 'Dibujo que cobra vida.'),
(17, 17, 'Calígrafa.', 'foto17.jpg', 'El arte de las letras.'),
(18, 18, 'Escultor de metal.', 'foto18.jpg', 'Fusiono hierro y creatividad.'),
(19, 19, 'Ilustradora de cuentos.', 'foto19.jpg', 'Imágenes para soñar.'),
(20, 20, 'Artista experimental.', 'foto20.jpg', 'Exploro sin límites.'),
(21, 21, 'Tatuador artístico.', 'foto21.jpg', 'Piel como lienzo.'),
(22, 22, 'Diseñadora UX/UI.', 'foto22.jpg', 'Experiencias visuales funcionales.'),
(23, 23, 'Artista digital.', 'foto23.jpg', 'Tecnología y arte como uno solo.'),
(24, 24, 'Ilustrador político.', 'foto24.jpg', 'Dibujo para reflexionar.'),
(25, 25, 'Diseñadora de joyas.', 'foto25.jpg', 'Arte en pequeño formato.'),
(26, 26, 'Escultora de cerámica.', 'foto26.jpg', 'Barro y manos, combinación perfecta.'),
(27, 27, 'Acuarelista.', 'foto27.jpg', 'Colores que fluyen.'),
(28, 28, 'Retratista.', 'foto28.jpg', 'Capturo la esencia humana.'),
(29, 29, 'Videoartista.', 'foto29.jpg', 'Narrativas en movimiento.'),
(30, 30, 'Creadora de instalaciones.', 'foto30.jpg', 'Espacios transformados en arte.'),
(31, 1, 'Artista visual apasionada por los paisajes', 'foto1.jpg', 'Me inspiro en la naturaleza'),
(32, 2, 'Escultor con experiencia en mármol y bronce', 'foto2.jpg', 'Exploro las formas y el volumen'),
(33, 3, 'Fotógrafa urbana', 'foto3.jpg', 'Capturo instantes únicos en la ciudad'),
(34, 4, 'Músico y guitarrista clásico', 'foto4.jpg', 'La música es el lenguaje universal'),
(35, 5, 'Bailarina de danza contemporánea', 'foto5.jpg', 'Expreso emociones a través del movimiento'),
(36, 6, 'Poeta romántico', 'foto6.jpg', 'Escribo versos sobre el amor y la vida'),
(37, 7, 'Actriz de teatro independiente', 'foto7.jpg', 'El escenario es mi hogar'),
(38, 8, 'Cineasta en formación', 'foto8.jpg', 'Creo historias con imágenes'),
(39, 9, 'Diseñador gráfico', 'foto9.jpg', 'Diseño con propósito e innovación'),
(40, 10, 'Ilustradora digital', 'foto10.jpg', 'Exploro mundos de fantasía en mis ilustraciones');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preferencias_arte`
--

CREATE TABLE `preferencias_arte` (
  `id_preferencia` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `preferencias_arte`
--

INSERT INTO `preferencias_arte` (`id_preferencia`, `id_usuario`, `categoria`) VALUES
(1, 1, 'Pintura'),
(2, 2, 'Escultura'),
(3, 3, 'Dibujo'),
(4, 4, 'Fotografía'),
(5, 5, 'Arte digital'),
(6, 6, 'Instalación'),
(7, 7, 'Arte urbano'),
(8, 8, 'Caligrafía'),
(9, 9, 'Performance'),
(10, 10, 'Literatura visual'),
(11, 11, 'Tatuaje'),
(12, 12, 'Diseño gráfico'),
(13, 13, 'Cine experimental'),
(14, 14, 'Ilustración'),
(15, 15, 'Collage'),
(16, 16, 'Videoarte'),
(17, 17, 'Acuarela'),
(18, 18, 'Graffiti'),
(19, 19, 'Arte conceptual'),
(20, 20, 'Animación 2D'),
(21, 21, 'Arte textil'),
(22, 22, 'Arte sonoro'),
(23, 23, 'Diseño UX/UI'),
(24, 24, 'Arte indígena'),
(25, 25, 'Arte abstracto'),
(26, 26, 'Arte político'),
(27, 27, 'Diseño de modas'),
(28, 28, 'Cerámica'),
(29, 29, 'Arte interactivo'),
(30, 30, 'Arquitectura artística'),
(31, 1, 'Impresionismo'),
(32, 2, 'Escultura clásica'),
(33, 3, 'Fotografía urbana'),
(34, 4, 'Música instrumental'),
(35, 5, 'Danza contemporánea'),
(36, 6, 'Poesía romántica'),
(37, 7, 'Teatro experimental'),
(38, 8, 'Cine independiente'),
(39, 9, 'Diseño industrial'),
(40, 10, 'Ilustración digital');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicaciones_obra`
--

CREATE TABLE `publicaciones_obra` (
  `id_publicacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_categoria` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `contenido` text DEFAULT NULL,
  `fecha_publicacion` datetime DEFAULT current_timestamp(),
  `estado` varchar(20) DEFAULT 'publicado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `publicaciones_obra`
--

INSERT INTO `publicaciones_obra` (`id_publicacion`, `id_usuario`, `id_categoria`, `titulo`, `descripcion`, `contenido`, `fecha_publicacion`, `estado`) VALUES
(1, 1, 1, 'Cima nevada', 'Montañas iluminadas por el amanecer', 'contenido2.jpg', '2025-01-11 08:00:00', 'publicado'),
(2, 1, 1, 'Bruma matinal', 'Paisaje con neblina sutil', 'contenido3.jpg', '2025-01-12 08:00:00', 'publicado'),
(3, 2, 2, 'Eco de metal', 'Escultura circular en bronce', 'escultura2.png', '2025-01-12 08:05:00', 'publicado'),
(4, 2, 2, 'Forma ascendente', 'Torre abstracta pulida', 'escultura3.png', '2025-01-12 08:10:00', 'publicado'),
(5, 2, 2, 'Equilibrio imposible', 'Piezas suspendidas en armonía', 'escultura4.png', '2025-01-13 08:10:00', 'publicado'),
(6, 3, 3, 'Sombras cruzadas', 'Contraste intenso de luces', 'foto2.jpg', '2025-01-11 08:15:00', 'publicado'),
(7, 3, 3, 'Mirada oculta', 'Retrato en sombra parcial', 'foto3.jpg', '2025-01-12 08:15:00', 'publicado'),
(8, 3, 3, 'Reflejo del alma', 'Captura espontánea emocional', 'foto4.jpg', '2025-01-13 08:15:00', 'publicado'),
(9, 3, 3, 'Camino vacío', 'Fotografía urbana solitaria', 'foto5.jpg', '2025-01-14 08:15:00', 'publicado'),
(10, 4, 4, 'Pixelarte', 'Diseño con píxeles expresivos', 'digital2.png', '2025-01-11 08:20:00', 'publicado'),
(11, 4, 4, 'Sinapsis digital', 'Conexiones neuronales estilizadas', 'digital3.png', '2025-01-12 08:20:00', 'publicado'),
(12, 4, 4, 'Espejo binario', 'Doble figura virtual', 'digital4.png', '2025-01-13 08:20:00', 'publicado'),
(13, 4, 4, 'Paisaje sintético', 'Naturaleza renderizada', 'digital5.png', '2025-01-14 08:20:00', 'publicado'),
(14, 4, 4, 'Energía vectorial', 'Composición basada en líneas de fuerza', 'digital6.png', '2025-01-15 08:20:00', 'publicado'),
(15, 5, 5, 'Poster vibrante', 'Colores saturados con mensaje directo', 'diseño2.pdf', '2025-01-11 08:30:00', 'publicado'),
(16, 5, 5, 'Diseño poético', 'Frase tipográfica minimalista', 'diseño3.pdf', '2025-01-12 08:30:00', 'publicado'),
(17, 5, 5, 'Cartel político', 'Diseño con impacto social', 'diseño4.pdf', '2025-01-13 08:30:00', 'publicado'),
(18, 5, 5, 'Póster retro', 'Inspiración en los años 80', 'diseño5.pdf', '2025-01-14 08:30:00', 'publicado'),
(19, 5, 5, 'Cultura visual', 'Diseño que representa tradiciones', 'diseño6.pdf', '2025-01-15 08:30:00', 'publicado'),
(20, 5, 5, 'Gráfica rebelde', 'Tipografía y color para protestar', 'diseño7.pdf', '2025-01-16 08:30:00', 'publicado'),
(21, 6, 6, 'Personaje fantástico', 'Ilustración de criatura mágica', 'ilustracion1.jpg', '2025-01-10 08:40:00', 'publicado'),
(22, 7, 7, 'Río en acuarela', 'Representación de un paisaje acuático', 'acuarela1.jpg', '2025-01-10 08:50:00', 'publicado'),
(23, 8, 8, 'Flor en tinta', 'Dibujo monocromo de flor', 'tinta1.jpg', '2025-01-10 09:00:00', 'publicado'),
(24, 9, 9, 'Recortes de ideas', 'Collage con papel reciclado', 'collage1.jpg', '2025-01-10 09:10:00', 'publicado'),
(25, 10, 10, 'Mural urbano', 'Pintura mural en barrio histórico', 'mural1.jpg', '2025-01-10 09:20:00', 'publicado'),
(26, 11, 11, 'Graffiti neón', 'Arte callejero con aerosol', 'graffiti1.jpg', '2025-01-10 09:30:00', 'publicado'),
(27, 12, 12, 'Rostro fragmentado', 'Obra abstracta con figuras', 'abstracto1.png', '2025-01-10 09:40:00', 'publicado'),
(28, 13, 13, 'Mesa con frutas', 'Naturaleza muerta realista', 'realista1.jpg', '2025-01-10 09:50:00', 'publicado'),
(29, 14, 14, 'La idea pesa más', 'Conceptualización sobre el arte moderno', 'conceptual1.docx', '2025-01-10 10:00:00', 'publicado'),
(30, 15, 15, 'Retrato de madre', 'Dibujo a lápiz', 'retrato1.jpg', '2025-01-10 10:10:00', 'publicado'),
(31, 16, 16, 'Valle al atardecer', 'Acuarela sobre lienzo', 'acuarela2.jpg', '2025-01-10 10:20:00', 'publicado'),
(32, 17, 17, 'Más allá del cuerpo', 'Performance documentada', 'performance1.mp4', '2025-01-10 10:30:00', 'publicado'),
(33, 18, 18, 'Furia urbana', 'Graffiti expresionista', 'graffiti2.jpg', '2025-01-10 10:40:00', 'publicado'),
(34, 19, 19, 'Crítica invisible', 'Arte político en formato mural', 'politico1.jpg', '2025-01-10 10:50:00', 'publicado'),
(35, 20, 20, 'Instalación sonora', 'Grabaciones ambientales y montaje', 'sonido1.mp3', '2025-01-10 11:00:00', 'publicado'),
(36, 21, 21, 'Tipografía con alma', 'Ejercicio caligráfico artístico', 'caligrafia1.jpg', '2025-01-10 11:10:00', 'publicado'),
(37, 22, 22, 'Sueño de hilos', 'Tejido de autor', 'textil1.jpg', '2025-01-10 11:20:00', 'publicado'),
(38, 23, 23, 'Paisaje UX/UI', 'Prototipo visual para app artística', 'ux1.figma', '2025-01-10 11:30:00', 'publicado'),
(39, 24, 24, 'Máscara ancestral', 'Arte inspirado en culturas indígenas', 'indigena1.jpg', '2025-01-10 11:40:00', 'publicado'),
(40, 25, 25, 'Laberinto de formas', 'Acrílico sobre lienzo', 'abstracto2.jpg', '2025-01-10 11:50:00', 'publicado'),
(41, 26, 26, 'Mensaje escondido', 'Graffiti político', 'grafico3.jpg', '2025-01-10 12:00:00', 'publicado'),
(42, 27, 31, 'Moda conceptual', 'Diseño de vestuario experimental', 'moda1.png', '2025-01-10 12:10:00', 'publicado'),
(43, 27, 32, 'Texturas del futuro', 'Exploración textil con materiales no convencionales', 'moda2.png', '2025-01-11 12:10:00', 'publicado'),
(44, 27, 33, 'Vestir la emoción', 'Diseño que expresa estados de ánimo', 'moda3.png', '2025-01-12 12:10:00', 'publicado'),
(45, 27, 34, 'Ruptura de forma', 'Vestuario que desafía la silueta tradicional', 'moda4.png', '2025-01-13 12:10:00', 'publicado'),
(46, 27, 35, 'Diseño efímero', 'Moda creada con materiales biodegradables', 'moda5.png', '2025-01-14 12:10:00', 'publicado'),
(47, 27, 33, 'Identidad portátil', 'Prenda que refleja la cultura del usuario', 'moda6.png', '2025-01-15 12:10:00', 'publicado'),
(48, 27, 32, 'Volumen poético', 'Juego escultórico con telas voluminosas', 'moda7.png', '2025-01-16 12:10:00', 'publicado'),
(49, 27, 34, 'Silencio visual', 'Diseño monocromo con carga conceptual', 'moda8.png', '2025-01-17 12:10:00', 'publicado'),
(50, 28, 28, 'Taza con textura', 'Cerámica artística vidriada', 'ceramica1.jpg', '2025-01-10 12:20:00', 'publicado'),
(51, 29, 19, 'Espacio blanco', 'Instalación minimalista', 'instalacion1.jpg', '2025-01-10 12:30:00', 'publicado'),
(52, 29, 20, 'Estructura etérea', 'Construcción con materiales translúcidos', 'instalacion2.jpg', '2025-01-11 09:00:00', 'publicado'),
(53, 29, 21, 'Sombras que hablan', 'Juego de luces y formas en el espacio', 'instalacion3.jpg', '2025-01-12 11:15:00', 'publicado'),
(54, 29, 22, 'Fragmentos del silencio', 'Objetos suspendidos en equilibrio', 'instalacion4.jpg', '2025-01-13 16:30:00', 'publicado'),
(55, 29, 23, 'Vacío habitado', 'Minimalismo que estimula la reflexión', 'instalacion5.jpg', '2025-01-14 14:10:00', 'publicado'),
(56, 29, 24, 'Luz filtrada', 'Instalación con telas translúcidas', 'instalacion6.jpg', '2025-01-15 10:25:00', 'publicado'),
(57, 29, 25, 'Materia poética', 'Instalación inspirada en versos visuales', 'instalacion7.jpg', '2025-01-16 11:45:00', 'publicado'),
(58, 29, 26, 'Narrativa espacial', 'Relato tridimensional con objetos', 'instalacion8.jpg', '2025-01-17 13:20:00', 'publicado'),
(59, 29, 27, 'Drama suspendido', 'Tensión emocional en materiales visuales', 'instalacion9.jpg', '2025-01-18 15:10:00', 'publicado'),
(60, 29, 28, 'Reflexión crítica', 'Instalación en forma de ensayo visual', 'instalacion10.jpg', '2025-01-19 09:35:00', 'publicado'),
(61, 29, 29, 'Interfaz sensorial', 'Experiencia interactiva con el entorno', 'instalacion11.jpg', '2025-01-20 14:00:00', 'publicado'),
(62, 29, 30, 'Presencia digital', 'Obra construida en entornos virtuales', 'instalacion12.jpg', '2025-01-21 10:50:00', 'publicado'),
(63, 30, 1, 'Ritmo visual', 'Diseño gráfico en movimiento', 'movimiento1.gif', '2025-01-10 12:40:00', 'publicado'),
(64, 30, 2, 'Color en acción', 'Exploración cromática animada', 'movimiento2.gif', '2025-01-12 09:15:00', 'publicado'),
(65, 30, 3, 'Tipografía viva', 'Letras que se mueven con estilo', 'movimiento3.gif', '2025-01-15 17:20:00', 'publicado'),
(66, 30, 4, 'Formas dinámicas', 'Transformación visual continua', 'movimiento4.gif', '2025-01-18 14:45:00', 'publicado'),
(67, 30, 5, 'Pulso visual', 'El ritmo en el diseño gráfico animado', 'movimiento5.gif', '2025-01-20 11:30:00', 'publicado'),
(68, 30, 6, 'Movimiento tipográfico', 'Composición cinética de palabras', 'movimiento6.gif', '2025-01-22 16:10:00', 'publicado'),
(69, 30, 7, 'Diseño fluido', 'Animaciones suaves y envolventes', 'movimiento7.gif', '2025-01-25 10:00:00', 'publicado'),
(70, 30, 8, 'Secuencia visual', 'Narrativa gráfica animada', 'movimiento8.gif', '2025-01-27 08:55:00', 'publicado'),
(71, 30, 9, 'Ritmo geométrico', 'Figuras en armonía cinética', 'movimiento9.gif', '2025-01-29 13:50:00', 'publicado'),
(72, 30, 10, 'Estilo en transición', 'Diseño que cambia con elegancia', 'movimiento10.gif', '2025-01-31 18:05:00', 'publicado'),
(73, 30, 11, 'Teatralidad gráfica', 'Composición escénica en movimiento', 'movimiento12.gif', '2025-02-01 12:00:00', 'publicado'),
(74, 30, 12, 'Danza visual', 'Movimiento corporal estilizado', 'movimiento13.gif', '2025-02-02 08:30:00', 'publicado'),
(75, 30, 13, 'Ópera visual', 'Narrativa lírica en animación', 'movimiento14.gif', '2025-02-03 13:15:00', 'publicado'),
(76, 30, 14, 'Ballet gráfico', 'Animación con elegancia clásica', 'movimiento15.gif', '2025-02-04 16:45:00', 'publicado'),
(77, 30, 15, 'Circo animado', 'Color y destreza en forma visual', 'movimiento16.gif', '2025-02-05 10:10:00', 'publicado'),
(78, 30, 16, 'Mímica digital', 'Gestos animados sin palabras', 'movimiento17.gif', '2025-02-06 11:20:00', 'publicado'),
(79, 30, 17, 'Melodía visual', 'Sincronización con música clásica', 'movimiento18.gif', '2025-02-07 09:55:00', 'publicado'),
(80, 30, 18, 'Ilusión de movimiento', 'Efectos ópticos animados', 'movimiento11.gif', '2025-02-02 15:25:00', 'publicado'),
(81, 1, 1, 'Atardecer en óleo', 'Pintura al óleo inspirada en un atardecer', 'Contenido de la obra 1', '2025-08-24 13:07:21', 'publicado'),
(82, 2, 2, 'Escultura de mármol', 'Escultura en mármol blanco', 'Contenido de la obra 2', '2025-08-24 13:07:21', 'publicado'),
(83, 3, 3, 'Retrato fotográfico', 'Fotografía en blanco y negro', 'Contenido de la obra 3', '2025-08-24 13:07:21', 'publicado'),
(84, 4, 4, 'Canción de guitarra', 'Composición musical instrumental', 'Contenido de la obra 4', '2025-08-24 13:07:21', 'publicado'),
(85, 5, 5, 'Coreografía urbana', 'Danza contemporánea', 'Contenido de la obra 5', '2025-08-24 13:07:21', 'publicado'),
(86, 6, 8, 'Poema romántico', 'Versos sobre el amor y la nostalgia', 'Contenido de la obra 6', '2025-08-24 13:07:21', 'publicado'),
(87, 7, 6, 'Obra teatral breve', 'Guion y actuación de corta duración', 'Contenido de la obra 7', '2025-08-24 13:07:21', 'publicado'),
(88, 8, 7, 'Corto cinematográfico', 'Producción audiovisual independiente', 'Contenido de la obra 8', '2025-08-24 13:07:21', 'publicado'),
(89, 9, 9, 'Diseño 3D arquitectónico', 'Modelo en 3D de una casa moderna', 'Contenido de la obra 9', '2025-08-24 13:07:21', 'publicado'),
(90, 10, 10, 'Ilustración digital fantástica', 'Arte digital con temática fantástica', 'Contenido de la obra 10', '2025-08-24 13:07:21', 'publicado');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_actividad`
--

CREATE TABLE `registro_actividad` (
  `id_actividad` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(255) DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `registro_actividad`
--

INSERT INTO `registro_actividad` (`id_actividad`, `id_usuario`, `accion`, `fecha`) VALUES
(1, 1, 'Inicio de sesión', '2025-01-08 05:05:31'),
(2, 2, 'Edición de perfil', '2025-01-09 11:43:12'),
(3, 3, 'Publicación de obra', '2025-01-10 08:23:44'),
(4, 4, 'Comentario en obra', '2025-01-11 14:01:09'),
(5, 5, 'Cierre de sesión', '2025-01-12 17:45:22'),
(6, 6, 'Cambio de contraseña', '2025-01-13 20:33:15'),
(7, 7, 'Exploración de galería', '2025-01-14 10:10:05'),
(8, 8, 'Guardado de obra', '2025-01-15 09:09:45'),
(9, 9, 'Reacción a publicación', '2025-01-16 18:30:21'),
(10, 10, 'Edición de configuración', '2025-01-17 06:55:11'),
(11, 11, 'Inicio de sesión', '2025-01-18 12:25:03'),
(12, 12, 'Eliminación de comentario', '2025-01-19 16:14:37'),
(13, 13, 'Publicación en blog', '2025-01-20 19:00:00'),
(14, 14, 'Visualización de perfil', '2025-01-21 21:30:14'),
(15, 15, 'Reinicio de contraseña', '2025-01-22 23:10:45'),
(16, 16, 'Suscripción a taller', '2025-01-23 13:14:28'),
(17, 17, 'Inicio de sesión', '2025-01-24 08:48:36'),
(18, 18, 'Cambio de idioma', '2025-01-25 10:20:52'),
(19, 19, 'Edición de biografía', '2025-01-26 11:15:09'),
(20, 20, 'Reacción a comentario', '2025-01-27 13:33:17'),
(21, 21, 'Guardado de obra', '2025-01-28 17:45:25'),
(22, 22, 'Envío de mensaje privado', '2025-01-29 19:19:00'),
(23, 23, 'Exploración de comunidades', '2025-01-30 15:40:08'),
(24, 24, 'Cambio de foto de perfil', '2025-02-01 07:08:47'),
(25, 25, 'Edición de obra', '2025-02-02 09:15:20'),
(26, 26, 'Comentario en obra', '2025-02-03 20:32:45'),
(27, 27, 'Bloqueo de usuario', '2025-02-04 18:17:12'),
(28, 28, 'Denuncia de contenido', '2025-02-05 16:05:30'),
(29, 29, 'Publicación de obra', '2025-02-06 14:59:01'),
(30, 30, 'Inicio de sesión', '2025-02-07 06:25:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_contenido`
--

CREATE TABLE `reportes_contenido` (
  `id_reporte` int(11) NOT NULL,
  `id_usuario_reportado` int(11) NOT NULL,
  `id_usuario_reportante` int(11) NOT NULL,
  `tipo_contenido` varchar(50) DEFAULT NULL,
  `id_contenido` int(11) DEFAULT NULL,
  `motivo` text DEFAULT NULL,
  `evidencia` text DEFAULT NULL,
  `estado` enum('pendiente','resuelto') DEFAULT 'pendiente',
  `fecha_reporte` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `reportes_contenido`
--

INSERT INTO `reportes_contenido` (`id_reporte`, `id_usuario_reportado`, `id_usuario_reportante`, `tipo_contenido`, `id_contenido`, `motivo`, `evidencia`, `estado`, `fecha_reporte`) VALUES
(1, 2, 1, 'comentario', 1, 'Lenguaje ofensivo', 'captura1.png', 'pendiente', '2025-01-16 08:00:00'),
(2, 3, 2, 'publicacion', 5, 'Contenido inapropiado', 'captura2.png', 'pendiente', '2025-01-16 08:05:00'),
(3, 4, 3, 'comentario', 2, 'Spam', 'captura3.png', 'pendiente', '2025-01-16 08:10:00'),
(4, 5, 4, 'publicacion', 6, 'Incita al odio', 'captura4.png', 'pendiente', '2025-01-16 08:15:00'),
(5, 6, 5, 'comentario', 3, 'Contenido ofensivo', 'captura5.png', 'pendiente', '2025-01-16 08:20:00'),
(6, 7, 6, 'publicacion', 7, 'Desinformación', 'captura6.png', 'pendiente', '2025-01-16 08:25:00'),
(7, 8, 7, 'comentario', 4, 'Violencia explícita', 'captura7.png', 'pendiente', '2025-01-16 08:30:00'),
(8, 9, 8, 'publicacion', 8, 'Robo de contenido', 'captura8.png', 'pendiente', '2025-01-16 08:35:00'),
(9, 10, 9, 'comentario', 5, 'Incita al acoso', 'captura9.png', 'pendiente', '2025-01-16 08:40:00'),
(10, 11, 10, 'publicacion', 9, 'Contenido racista', 'captura10.png', 'pendiente', '2025-01-16 08:45:00'),
(11, 12, 11, 'comentario', 6, 'Lenguaje vulgar', 'captura11.png', 'pendiente', '2025-01-16 08:50:00'),
(12, 13, 12, 'publicacion', 10, 'Sin créditos al autor', 'captura12.png', 'pendiente', '2025-01-16 08:55:00'),
(13, 14, 13, 'comentario', 7, 'Contenido engañoso', 'captura13.png', 'pendiente', '2025-01-16 09:00:00'),
(14, 15, 14, 'publicacion', 11, 'Publicación repetida', 'captura14.png', 'pendiente', '2025-01-16 09:05:00'),
(15, 16, 15, 'comentario', 8, 'Bullying', 'captura15.png', 'pendiente', '2025-01-16 09:10:00'),
(16, 17, 16, 'publicacion', 12, 'Violación de derechos', 'captura16.png', 'pendiente', '2025-01-16 09:15:00'),
(17, 18, 17, 'comentario', 9, 'Discriminación', 'captura17.png', 'pendiente', '2025-01-16 09:20:00'),
(18, 19, 18, 'publicacion', 13, 'Incitación a violencia', 'captura18.png', 'pendiente', '2025-01-16 09:25:00'),
(19, 20, 19, 'comentario', 10, 'Falsa identidad', 'captura19.png', 'pendiente', '2025-01-16 09:30:00'),
(20, 21, 20, 'publicacion', 14, 'Contenido explícito', 'captura20.png', 'pendiente', '2025-01-16 09:35:00'),
(21, 22, 21, 'comentario', 11, 'Troll', 'captura21.png', 'pendiente', '2025-01-16 09:40:00'),
(22, 23, 22, 'publicacion', 15, 'Robo de idea', 'captura22.png', 'pendiente', '2025-01-16 09:45:00'),
(23, 24, 23, 'comentario', 12, 'Contenido perturbador', 'captura23.png', 'pendiente', '2025-01-16 09:50:00'),
(24, 25, 24, 'publicacion', 16, 'Publicidad sin permiso', 'captura24.png', 'pendiente', '2025-01-16 09:55:00'),
(25, 26, 25, 'comentario', 13, 'Lenguaje ofensivo', 'captura25.png', 'pendiente', '2025-01-16 10:00:00'),
(26, 27, 26, 'publicacion', 17, 'Violencia gráfica', 'captura26.png', 'pendiente', '2025-01-16 10:05:00'),
(27, 28, 27, 'comentario', 14, 'Spam', 'captura27.png', 'pendiente', '2025-01-16 10:10:00'),
(28, 29, 28, 'publicacion', 18, 'Contenido repetido', 'captura28.png', 'pendiente', '2025-01-16 10:15:00'),
(29, 30, 29, 'comentario', 15, 'Comentario ofensivo', 'captura29.png', 'pendiente', '2025-01-16 10:20:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seguidores_usuario`
--

CREATE TABLE `seguidores_usuario` (
  `id_seguimiento` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_seguidor` int(11) NOT NULL,
  `fecha_seguimiento` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `seguidores_usuario`
--

INSERT INTO `seguidores_usuario` (`id_seguimiento`, `id_usuario`, `id_seguidor`, `fecha_seguimiento`) VALUES
(1, 2, 1, '2025-01-10 08:00:00'),
(2, 3, 1, '2025-01-10 08:10:00'),
(3, 4, 2, '2025-01-10 08:15:00'),
(4, 5, 2, '2025-01-10 08:20:00'),
(5, 6, 3, '2025-01-10 08:30:00'),
(6, 7, 3, '2025-01-10 08:35:00'),
(7, 8, 4, '2025-01-10 08:45:00'),
(8, 9, 5, '2025-01-10 08:50:00'),
(9, 10, 6, '2025-01-10 09:00:00'),
(10, 11, 7, '2025-01-10 09:05:00'),
(11, 12, 8, '2025-01-10 09:10:00'),
(12, 13, 9, '2025-01-10 09:15:00'),
(13, 14, 10, '2025-01-10 09:20:00'),
(14, 15, 11, '2025-01-10 09:30:00'),
(15, 16, 12, '2025-01-10 09:35:00'),
(16, 17, 13, '2025-01-10 09:40:00'),
(17, 18, 14, '2025-01-10 09:45:00'),
(18, 19, 15, '2025-01-10 10:00:00'),
(19, 20, 16, '2025-01-10 10:10:00'),
(20, 21, 17, '2025-01-10 10:20:00'),
(21, 22, 18, '2025-01-10 10:30:00'),
(22, 23, 19, '2025-01-10 10:40:00'),
(23, 24, 21, '2025-01-10 10:50:00'),
(24, 25, 14, '2025-01-10 11:00:00'),
(25, 26, 12, '2025-01-10 11:10:00'),
(26, 27, 10, '2025-01-10 11:20:00'),
(27, 28, 20, '2025-01-10 11:30:00'),
(28, 29, 24, '2025-01-10 11:40:00'),
(29, 30, 29, '2025-01-10 11:55:00'),
(30, 30, 10, '2025-01-10 11:55:00'),
(31, 30, 28, '2025-01-10 11:55:00'),
(32, 30, 1, '2025-01-10 08:00:00'),
(33, 30, 2, '2025-01-10 08:01:00'),
(34, 30, 3, '2025-01-10 08:02:00'),
(35, 30, 4, '2025-01-10 08:03:00'),
(36, 30, 5, '2025-01-10 08:04:00'),
(37, 30, 6, '2025-01-10 08:05:00'),
(38, 30, 7, '2025-01-10 08:06:00'),
(39, 30, 8, '2025-01-10 08:07:00'),
(40, 30, 9, '2025-01-10 08:08:00'),
(41, 30, 10, '2025-01-10 08:09:00'),
(42, 30, 11, '2025-01-10 08:10:00'),
(43, 30, 12, '2025-01-10 08:11:00'),
(44, 30, 13, '2025-01-10 08:12:00'),
(45, 30, 14, '2025-01-10 08:13:00'),
(46, 30, 15, '2025-01-10 08:14:00'),
(47, 30, 16, '2025-01-10 08:15:00'),
(48, 30, 17, '2025-01-10 08:16:00'),
(49, 30, 18, '2025-01-10 08:17:00'),
(50, 30, 19, '2025-01-10 08:18:00'),
(51, 30, 20, '2025-01-10 08:19:00'),
(52, 29, 1, '2025-01-10 08:20:00'),
(53, 29, 2, '2025-01-10 08:21:00'),
(54, 29, 3, '2025-01-10 08:22:00'),
(55, 29, 4, '2025-01-10 08:23:00'),
(56, 29, 5, '2025-01-10 08:24:00'),
(57, 29, 6, '2025-01-10 08:25:00'),
(58, 29, 7, '2025-01-10 08:26:00'),
(59, 29, 8, '2025-01-10 08:27:00'),
(60, 29, 9, '2025-01-10 08:28:00'),
(61, 29, 10, '2025-01-10 08:29:00'),
(62, 29, 11, '2025-01-10 08:30:00'),
(63, 29, 12, '2025-01-10 08:31:00'),
(64, 29, 13, '2025-01-10 08:32:00'),
(65, 29, 14, '2025-01-10 08:33:00'),
(66, 29, 15, '2025-01-10 08:34:00'),
(67, 29, 16, '2025-01-10 08:35:00'),
(68, 29, 17, '2025-01-10 08:36:00'),
(69, 29, 18, '2025-01-10 08:37:00'),
(70, 28, 1, '2025-01-10 08:38:00'),
(71, 28, 2, '2025-01-10 08:39:00'),
(72, 28, 3, '2025-01-10 08:40:00'),
(73, 28, 4, '2025-01-10 08:41:00'),
(74, 28, 5, '2025-01-10 08:42:00'),
(75, 28, 6, '2025-01-10 08:43:00'),
(76, 28, 7, '2025-01-10 08:44:00'),
(77, 28, 8, '2025-01-10 08:45:00'),
(78, 28, 9, '2025-01-10 08:46:00'),
(79, 28, 10, '2025-01-10 08:47:00'),
(80, 28, 11, '2025-01-10 08:48:00'),
(81, 28, 12, '2025-01-10 08:49:00'),
(82, 28, 13, '2025-01-10 08:50:00'),
(83, 28, 14, '2025-01-10 08:51:00'),
(84, 28, 15, '2025-01-10 08:52:00'),
(85, 28, 16, '2025-01-10 08:53:00'),
(86, 27, 1, '2025-01-10 08:54:00'),
(87, 27, 2, '2025-01-10 08:55:00'),
(88, 27, 3, '2025-01-10 08:56:00'),
(89, 27, 4, '2025-01-10 08:57:00'),
(90, 27, 5, '2025-01-10 08:58:00'),
(91, 27, 6, '2025-01-10 08:59:00'),
(92, 27, 7, '2025-01-10 09:00:00'),
(93, 27, 8, '2025-01-10 09:01:00'),
(94, 27, 9, '2025-01-10 09:02:00'),
(95, 27, 10, '2025-01-10 09:03:00'),
(96, 27, 11, '2025-01-10 09:04:00'),
(97, 27, 12, '2025-01-10 09:05:00'),
(98, 27, 13, '2025-01-10 09:06:00'),
(99, 27, 14, '2025-01-10 09:07:00'),
(100, 26, 1, '2025-01-10 09:08:00'),
(101, 26, 2, '2025-01-10 09:09:00'),
(102, 26, 3, '2025-01-10 09:10:00'),
(103, 26, 4, '2025-01-10 09:11:00'),
(104, 26, 5, '2025-01-10 09:12:00'),
(105, 26, 6, '2025-01-10 09:13:00'),
(106, 26, 7, '2025-01-10 09:14:00'),
(107, 26, 8, '2025-01-10 09:15:00'),
(108, 26, 9, '2025-01-10 09:16:00'),
(109, 26, 10, '2025-01-10 09:17:00'),
(110, 26, 11, '2025-01-10 09:18:00'),
(111, 26, 12, '2025-01-10 09:19:00'),
(112, 25, 1, '2025-01-10 09:20:00'),
(113, 25, 2, '2025-01-10 09:21:00'),
(114, 25, 3, '2025-01-10 09:22:00'),
(115, 25, 4, '2025-01-10 09:23:00'),
(116, 25, 5, '2025-01-10 09:24:00'),
(117, 25, 6, '2025-01-10 09:25:00'),
(118, 25, 7, '2025-01-10 09:26:00'),
(119, 25, 8, '2025-01-10 09:27:00'),
(120, 25, 9, '2025-01-10 09:28:00'),
(121, 25, 10, '2025-01-10 09:29:00'),
(122, 24, 1, '2025-01-10 09:30:00'),
(123, 24, 2, '2025-01-10 09:31:00'),
(124, 24, 3, '2025-01-10 09:32:00'),
(125, 24, 4, '2025-01-10 09:33:00'),
(126, 24, 5, '2025-01-10 09:34:00'),
(127, 24, 6, '2025-01-10 09:35:00'),
(128, 24, 7, '2025-01-10 09:36:00'),
(129, 24, 8, '2025-01-10 09:37:00'),
(130, 23, 1, '2025-01-10 09:38:00'),
(131, 23, 2, '2025-01-10 09:39:00'),
(132, 23, 3, '2025-01-10 09:40:00'),
(133, 23, 4, '2025-01-10 09:41:00'),
(134, 23, 5, '2025-01-10 09:42:00'),
(135, 23, 6, '2025-01-10 09:43:00'),
(136, 22, 1, '2025-01-10 09:44:00'),
(137, 22, 2, '2025-01-10 09:45:00'),
(138, 22, 3, '2025-01-10 09:46:00'),
(139, 22, 4, '2025-01-10 09:47:00'),
(140, 21, 1, '2025-01-10 09:48:00'),
(141, 21, 2, '2025-01-10 09:49:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seguimiento_usuario`
--

CREATE TABLE `seguimiento_usuario` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `accion` varchar(255) DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `fecha` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `seguimiento_usuario`
--

INSERT INTO `seguimiento_usuario` (`id`, `id_usuario`, `accion`, `detalle`, `fecha`) VALUES
(1, 1, 'Inicio de sesión', 'Accedió desde Chrome', '2025-01-05 08:00:00'),
(2, 2, 'Edición de perfil', 'Actualizó biografía', '2025-01-05 09:00:00'),
(3, 3, 'Creación de obra', 'Publicó una pintura digital', '2025-01-05 10:00:00'),
(4, 4, 'Comentario', 'Comentó en la obra #15', '2025-01-05 11:00:00'),
(5, 5, 'Reacción', 'Le dio \"me encanta\" a una obra', '2025-01-05 12:00:00'),
(6, 6, 'Guardado de obra', 'Guardó la obra #23', '2025-01-05 13:00:00'),
(7, 7, 'Cambio de idioma', 'Cambió a inglés', '2025-01-05 14:00:00'),
(8, 8, 'Mensaje privado', 'Envío a usuario #12', '2025-01-05 15:00:00'),
(9, 9, 'Modificación de configuración', 'Activó modo oscuro', '2025-01-05 16:00:00'),
(10, 10, 'Inicio de sesión', 'Accedió desde Firefox', '2025-01-05 17:00:00'),
(11, 11, 'Publicación en blog', 'Creó un nuevo artículo', '2025-01-05 18:00:00'),
(12, 12, 'Edición de obra', 'Cambió el título de la obra #8', '2025-01-05 19:00:00'),
(13, 13, 'Creación de colección', 'Colección \"Mis favoritos\"', '2025-01-05 20:00:00'),
(14, 14, 'Edición de configuración', 'Tamaño de fuente a grande', '2025-01-05 21:00:00'),
(15, 15, 'Reacción', 'Le dio \"wow\" a un comentario', '2025-01-05 22:00:00'),
(16, 16, 'Inicio de sesión', 'Desde dispositivo móvil', '2025-01-06 08:10:00'),
(17, 17, 'Eliminación de obra', 'Obra #19 eliminada', '2025-01-06 08:20:00'),
(18, 18, 'Suscripción a taller', 'Inscrito en taller de acuarela', '2025-01-06 08:30:00'),
(19, 19, 'Cambio de contraseña', 'Por seguridad', '2025-01-06 08:40:00'),
(20, 20, 'Comentario', 'Respondió a comentario #25', '2025-01-06 08:50:00'),
(21, 21, 'Bloqueo de usuario', 'Bloqueó al usuario #17', '2025-01-06 09:00:00'),
(22, 22, 'Desbloqueo de usuario', 'Desbloqueó al usuario #17', '2025-01-06 09:10:00'),
(23, 23, 'Reporte de contenido', 'Reportó la obra #9', '2025-01-06 09:20:00'),
(24, 24, 'Visualización de perfil', 'Vio perfil del usuario #14', '2025-01-06 09:30:00'),
(25, 25, 'Cambio de privacidad', 'Perfil a \"solo_amigos\"', '2025-01-06 09:40:00'),
(26, 26, 'Cambio de foto de perfil', 'Nueva imagen subida', '2025-01-06 09:50:00'),
(27, 27, 'Cambio de preferencia', 'Ahora prefiere escultura', '2025-01-06 10:00:00'),
(28, 28, 'Desbloqueo', 'Desbloqueó usuario #10', '2025-01-06 10:10:00'),
(29, 29, 'Inicio de sesión', 'Desde IP desconocida', '2025-01-06 10:20:00'),
(30, 30, 'Cambio de idioma', 'Cambió a portugués', '2025-01-06 10:30:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes_amistad`
--

CREATE TABLE `solicitudes_amistad` (
  `id` int(11) NOT NULL,
  `usuario_id_origen` int(11) NOT NULL,
  `usuario_id_destino` int(11) NOT NULL,
  `estado` enum('pendiente','aceptada','rechazada') DEFAULT 'pendiente',
  `fecha_envio` datetime NOT NULL,
  `fecha_aceptacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `correo_electronico` varchar(100) NOT NULL,
  `contrasena` varchar(255) DEFAULT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` varchar(20) DEFAULT NULL,
  `tipo_arte_preferido` varchar(100) DEFAULT NULL,
  `telefono` varchar(50) NOT NULL,
  `nombre_usuario` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `nombre`, `apellido`, `correo_electronico`, `contrasena`, `fecha_nacimiento`, `genero`, `tipo_arte_preferido`, `telefono`, `nombre_usuario`) VALUES
(1, 'Adelaida Arregui ', 'Anglada', 'user1@correo.com', 'nVQdhWXb^2E)', '1989-08-19', 'Otro', 'Danza', '+34 741 783 162', 'ozuna el real'),
(2, 'Faustino Vallejo ', 'Real', 'user2@correo.com', 'pLqHtVn#7aFX', '1987-10-12', 'Masculino', 'Teatro', '+34 607 215 905', 'nose'),
(3, 'Ignacio Figueroa Gomariz', '', 'user3@correo.com', 'byGuAFm*3uLn', '1979-06-21', 'Masculino', 'Música', '+34 625 349 764', 'sida\r\n'),
(4, 'Sebastián Almagro Vico', '', 'user4@correo.com', 'Vh*qfY$UJ2j1', '1988-07-01', 'Masculino', 'Pintura', '+34 612 137 508', ''),
(5, 'Aurelia Utrera Castañón', '', 'user5@correo.com', 'NL8suYgx+Fj%', '1971-12-30', 'Femenino', 'Literatura', '+34 686 733 265', ''),
(6, 'Bartolomé Gallego Torrente', '', 'user6@correo.com', 'E&M4dWY!kPKc', '1982-02-24', 'Masculino', 'Danza', '+34 688 415 310', ''),
(7, 'Álvaro Ibáñez Martos', '', 'user7@correo.com', 'ZX2F%bt8qae#', '1986-05-06', 'Masculino', 'Teatro', '+34 639 938 370', ''),
(8, 'Gabriela Collado Lara', '', 'user8@correo.com', '2Tvg+!hC5Vje', '1984-11-13', 'Femenino', 'Pintura', '+34 642 748 855', ''),
(9, 'Bautista Velasco Montalt', '', 'user9@correo.com', 'mK9AKnH@P47Y', '1976-04-10', 'Masculino', 'Música', '+34 690 825 418', 'hay hambre\r\n'),
(10, 'Elena Baeza Andrada', '', 'user10@correo.com', 'J2+eZLGU38pn', '1985-01-19', 'Femenino', 'Literatura', '+34 622 434 504', ''),
(11, 'Isidro Monforte Bravo', '', 'user11@correo.com', 'YvKx@eLMg7rT', '1983-10-07', 'Masculino', 'Teatro', '+34 678 695 273', ''),
(12, 'Rosaura Viana Villegas', '', 'user12@correo.com', 'sAqX$wK3EYN!', '1990-09-05', 'Femenino', 'Pintura', '+34 655 171 391', ''),
(13, 'Benjamín Arrieta Sanjuan', '', 'user13@correo.com', '9!HtUMpvycAe', '1978-03-27', 'Masculino', 'Danza', '+34 684 130 920', ''),
(14, 'Rocío Oltra Pascual', '', 'user14@correo.com', 'L!Eex5tzRMm7', '1991-11-02', 'Femenino', 'Literatura', '+34 609 582 423', 'no hay hambre\r\n'),
(15, 'Julián Cardiel Peñalver', '', 'user15@correo.com', 'AQ6bZMpE&9Xu', '1975-08-15', 'Masculino', 'Música', '+34 615 978 350', ''),
(16, 'Daniela Pizarro Sempere', '', 'user16@correo.com', 'TwR*fqgUz23!', '1986-03-17', 'Femenino', 'Pintura', '+34 664 357 229', ''),
(17, 'Eugenio Balsalobre Cánovas', '', 'user17@correo.com', 'eMv&k3UcBN#d', '1980-05-29', 'Masculino', 'Teatro', '+34 695 382 590', ''),
(18, 'Jimena Carreras Roca', '', 'user18@correo.com', 'x5B$dnMAZ4^f', '1992-06-10', 'Femenino', 'Música', '+34 670 981 472', ''),
(19, 'Fernando Monasterio Cuesta', '', 'user19@correo.com', '93TwzE8!gHVu', '1983-09-09', 'Masculino', 'Danza', '+34 648 751 340', ''),
(20, 'Tatiana Rojano Sáenz', '', 'user20@correo.com', 'fbvZHt$4MXq3', '1987-02-03', 'Femenino', 'Literatura', '+34 691 389 712', ''),
(21, 'Ulises Naranjo Goicoechea', '', 'user21@correo.com', 'cJZW@yEL8N5*', '1989-04-22', 'Masculino', 'Teatro', '+34 618 451 913', ''),
(22, 'Beatriz Luján Ochoa', '', 'user22@correo.com', 'F!qgTpbvWY7u', '1990-10-08', 'Femenino', 'Pintura', '+34 684 252 472', ''),
(23, 'Guillermo Lerín Santamaría', '', 'user23@correo.com', 'A@cvKz4YM3uP', '1981-06-03', 'Masculino', 'Danza', '+34 625 783 145', ''),
(24, 'Natalia Cevallos Muñiz', '', 'user24@correo.com', 'Mf^yPzGu9EAK', '1993-01-25', 'Femenino', 'Música', '+34 672 423 987', 'sueño 201'),
(25, 'Lázaro Fonseca Viñas', '', 'user25@correo.com', 'NctKv@pmW3R$', '1979-07-11', 'Masculino', 'Literatura', '+34 637 705 199', ''),
(26, 'Inés Moyano del Río', '', 'user26@correo.com', 'XR#nFbPW3a&L', '1985-09-17', 'Femenino', 'Pintura', '+34 633 201 843', ''),
(27, 'Ángel Domenech Cotilla', '', 'user27@correo.com', 'eZ9WyEXr!J6q', '1984-11-23', 'Masculino', 'Teatro', '+34 694 852 137', ''),
(28, 'Leticia Mínguez Paredes', '', 'user28@correo.com', 'rG&uJc93NAv*', '1982-02-06', 'Femenino', 'Música', '+34 676 428 099', ''),
(29, 'Fidel Robledo Garijo', '', 'user29@correo.com', '7Tf$VqgkXuNp', '1986-06-20', 'Masculino', 'Literatura', '+34 689 375 842', ''),
(30, 'Melina Pardo Revilla', '', 'user30@correo.com', 'UnqPw4&eXB2$', '1991-05-14', 'Femenino', 'Danza', '+34 649 172 356', ''),
(31, 'Ana Torres', '', 'ana.torres@example.com', 'pass123', '1995-04-12', 'Femenino', 'Pintura', '3001112233', ''),
(32, 'Carlos Gómez', '', 'carlos.gomez@example.com', 'pass123', '1990-07-22', 'Masculino', 'Escultura', '3002223344', ''),
(33, 'María López', '', 'maria.lopez@example.com', 'pass123', '1998-02-18', 'Femenino', 'Fotografía', '3003334455', ''),
(34, 'Pedro Sánchez', '', 'pedro.sanchez@example.com', 'pass123', '1988-11-05', 'Masculino', 'Música', '3004445566', ''),
(35, 'Lucía Fernández', '', 'lucia.fernandez@example.com', 'pass123', '1993-06-30', 'Femenino', 'Danza', '3005556677', ''),
(36, 'David Morales', '', 'david.morales@example.com', 'pass123', '1992-01-15', 'Masculino', 'Poesía', '3006667788', ''),
(37, 'Paula Ramírez', '', 'paula.ramirez@example.com', 'pass123', '1997-12-09', 'Femenino', 'Teatro', '3007778899', ''),
(38, 'Sofía Herrera', '', 'sofia.herrera@example.com', 'pass123', '2000-09-20', 'Femenino', 'Cine', '3008889900', ''),
(39, 'Andrés Ríos', '', 'andres.rios@example.com', 'pass123', '1994-03-25', 'Masculino', 'Diseño', '3009990011', ''),
(40, 'Valentina Cruz', '', 'valentina.cruz@example.com', 'pass123', '1996-05-17', 'Femenino', 'Arte digital', '3011112233', ''),
(41, 'string', 'string', 'string', 'string', '2025-09-14', 'string', 'string', 'string', 'string'),
(46, 'ozuna', 'Roldán', 'ozuna@test.com', '123456', '2000-05-20', 'femenino', 'pintura', '3201234567', 'ozunaR'),
(49, 'nolan', 'sin ', 'wrf@gmail.com', '1234ewrt', '2025-09-15', 'Delfin', 'rock', '31431735', '57'),
(51, 'artenity', 'sexo v', 'wtr.falso1@gmail.com', 'qa1122222', '2007-06-20', 'Hombre', 'jazz', '31232303546', 'wtr123'),
(52, 'sebastian', 'reduro', 'sbd@gmail.com', 'sbd44', '2006-07-21', 'Hombre', 'jazz', '31232303543333', 'sbd33');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios_bloqueados`
--

CREATE TABLE `usuarios_bloqueados` (
  `id_bloqueo` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_bloqueado` int(11) NOT NULL,
  `fecha_bloqueo` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios_bloqueados`
--

INSERT INTO `usuarios_bloqueados` (`id_bloqueo`, `id_usuario`, `id_bloqueado`, `fecha_bloqueo`) VALUES
(1, 1, 5, '2025-01-16 11:00:00'),
(2, 2, 6, '2025-01-16 11:05:00'),
(3, 3, 7, '2025-01-16 11:10:00'),
(4, 4, 8, '2025-01-16 11:15:00'),
(5, 5, 9, '2025-01-16 11:20:00'),
(6, 6, 10, '2025-01-16 11:25:00'),
(7, 7, 11, '2025-01-16 11:30:00'),
(8, 8, 12, '2025-01-16 11:35:00'),
(9, 9, 13, '2025-01-16 11:40:00'),
(10, 10, 14, '2025-01-16 11:45:00'),
(11, 11, 15, '2025-01-16 11:50:00'),
(12, 12, 16, '2025-01-16 11:55:00'),
(13, 13, 17, '2025-01-16 12:00:00'),
(14, 14, 18, '2025-01-16 12:05:00'),
(15, 15, 19, '2025-01-16 12:10:00'),
(16, 16, 20, '2025-01-16 12:15:00'),
(17, 17, 21, '2025-01-16 12:20:00'),
(18, 18, 22, '2025-01-16 12:25:00'),
(19, 19, 23, '2025-01-16 12:30:00'),
(20, 20, 24, '2025-01-16 12:35:00'),
(21, 21, 25, '2025-01-16 12:40:00'),
(22, 22, 26, '2025-01-16 12:45:00'),
(23, 23, 27, '2025-01-16 12:50:00'),
(24, 24, 28, '2025-01-16 12:55:00'),
(25, 25, 29, '2025-01-16 13:00:00'),
(26, 26, 30, '2025-01-16 13:05:00'),
(27, 27, 1, '2025-01-16 13:10:00'),
(28, 28, 2, '2025-01-16 13:15:00'),
(29, 29, 3, '2025-01-16 13:20:00'),
(30, 30, 4, '2025-01-16 13:25:00');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias_obra`
--
ALTER TABLE `categorias_obra`
  ADD PRIMARY KEY (`id_categoria`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `colecciones_arte`
--
ALTER TABLE `colecciones_arte`
  ADD PRIMARY KEY (`id_coleccion`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `colecciones_obras`
--
ALTER TABLE `colecciones_obras`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_coleccion` (`id_coleccion`),
  ADD KEY `id_publicacion` (`id_publicacion`);

--
-- Indices de la tabla `comentarios_obra`
--
ALTER TABLE `comentarios_obra`
  ADD PRIMARY KEY (`id_comentario`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_publicacion` (`id_publicacion`),
  ADD KEY `id_comentario_padre` (`id_comentario_padre`);

--
-- Indices de la tabla `configuracion_usuario`
--
ALTER TABLE `configuracion_usuario`
  ADD PRIMARY KEY (`id_configuracion`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `galeria_arte`
--
ALTER TABLE `galeria_arte`
  ADD PRIMARY KEY (`id_galeria`),
  ADD KEY `id_publicacion` (`id_publicacion`);

--
-- Indices de la tabla `guardados_obra`
--
ALTER TABLE `guardados_obra`
  ADD PRIMARY KEY (`id_guardado`),
  ADD UNIQUE KEY `id_usuario` (`id_usuario`,`id_publicacion`),
  ADD KEY `id_publicacion` (`id_publicacion`);

--
-- Indices de la tabla `historial_interacciones_obra`
--
ALTER TABLE `historial_interacciones_obra`
  ADD PRIMARY KEY (`id_historial`),
  ADD KEY `id_publicacion` (`id_publicacion`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `likes_obra`
--
ALTER TABLE `likes_obra`
  ADD PRIMARY KEY (`id_like`),
  ADD KEY `id_publicacion` (`id_publicacion`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `mensajes_privados`
--
ALTER TABLE `mensajes_privados`
  ADD PRIMARY KEY (`id_mensaje`),
  ADD KEY `id_emisor` (`id_emisor`),
  ADD KEY `id_receptor` (`id_receptor`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `perfiles`
--
ALTER TABLE `perfiles`
  ADD PRIMARY KEY (`id_perfil`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `preferencias_arte`
--
ALTER TABLE `preferencias_arte`
  ADD PRIMARY KEY (`id_preferencia`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `publicaciones_obra`
--
ALTER TABLE `publicaciones_obra`
  ADD PRIMARY KEY (`id_publicacion`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_categoria` (`id_categoria`);

--
-- Indices de la tabla `registro_actividad`
--
ALTER TABLE `registro_actividad`
  ADD PRIMARY KEY (`id_actividad`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `reportes_contenido`
--
ALTER TABLE `reportes_contenido`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `id_usuario_reportado` (`id_usuario_reportado`),
  ADD KEY `id_usuario_reportante` (`id_usuario_reportante`);

--
-- Indices de la tabla `seguidores_usuario`
--
ALTER TABLE `seguidores_usuario`
  ADD PRIMARY KEY (`id_seguimiento`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_seguidor` (`id_seguidor`);

--
-- Indices de la tabla `seguimiento_usuario`
--
ALTER TABLE `seguimiento_usuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `solicitudes_amistad`
--
ALTER TABLE `solicitudes_amistad`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id_origen` (`usuario_id_origen`),
  ADD KEY `usuario_id_destino` (`usuario_id_destino`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `correo_electronico` (`correo_electronico`);

--
-- Indices de la tabla `usuarios_bloqueados`
--
ALTER TABLE `usuarios_bloqueados`
  ADD PRIMARY KEY (`id_bloqueo`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_bloqueado` (`id_bloqueado`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias_obra`
--
ALTER TABLE `categorias_obra`
  MODIFY `id_categoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT de la tabla `colecciones_arte`
--
ALTER TABLE `colecciones_arte`
  MODIFY `id_coleccion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT de la tabla `colecciones_obras`
--
ALTER TABLE `colecciones_obras`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `comentarios_obra`
--
ALTER TABLE `comentarios_obra`
  MODIFY `id_comentario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `configuracion_usuario`
--
ALTER TABLE `configuracion_usuario`
  MODIFY `id_configuracion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `galeria_arte`
--
ALTER TABLE `galeria_arte`
  MODIFY `id_galeria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `guardados_obra`
--
ALTER TABLE `guardados_obra`
  MODIFY `id_guardado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `historial_interacciones_obra`
--
ALTER TABLE `historial_interacciones_obra`
  MODIFY `id_historial` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `likes_obra`
--
ALTER TABLE `likes_obra`
  MODIFY `id_like` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `mensajes_privados`
--
ALTER TABLE `mensajes_privados`
  MODIFY `id_mensaje` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `perfiles`
--
ALTER TABLE `perfiles`
  MODIFY `id_perfil` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `preferencias_arte`
--
ALTER TABLE `preferencias_arte`
  MODIFY `id_preferencia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `publicaciones_obra`
--
ALTER TABLE `publicaciones_obra`
  MODIFY `id_publicacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT de la tabla `registro_actividad`
--
ALTER TABLE `registro_actividad`
  MODIFY `id_actividad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `reportes_contenido`
--
ALTER TABLE `reportes_contenido`
  MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `seguidores_usuario`
--
ALTER TABLE `seguidores_usuario`
  MODIFY `id_seguimiento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142;

--
-- AUTO_INCREMENT de la tabla `seguimiento_usuario`
--
ALTER TABLE `seguimiento_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT de la tabla `solicitudes_amistad`
--
ALTER TABLE `solicitudes_amistad`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT de la tabla `usuarios_bloqueados`
--
ALTER TABLE `usuarios_bloqueados`
  MODIFY `id_bloqueo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `colecciones_arte`
--
ALTER TABLE `colecciones_arte`
  ADD CONSTRAINT `colecciones_arte_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `colecciones_obras`
--
ALTER TABLE `colecciones_obras`
  ADD CONSTRAINT `colecciones_obras_ibfk_1` FOREIGN KEY (`id_coleccion`) REFERENCES `colecciones_arte` (`id_coleccion`),
  ADD CONSTRAINT `colecciones_obras_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicaciones_obra` (`id_publicacion`);

--
-- Filtros para la tabla `comentarios_obra`
--
ALTER TABLE `comentarios_obra`
  ADD CONSTRAINT `comentarios_obra_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `comentarios_obra_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicaciones_obra` (`id_publicacion`),
  ADD CONSTRAINT `comentarios_obra_ibfk_3` FOREIGN KEY (`id_comentario_padre`) REFERENCES `comentarios_obra` (`id_comentario`);

--
-- Filtros para la tabla `configuracion_usuario`
--
ALTER TABLE `configuracion_usuario`
  ADD CONSTRAINT `configuracion_usuario_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `galeria_arte`
--
ALTER TABLE `galeria_arte`
  ADD CONSTRAINT `galeria_arte_ibfk_1` FOREIGN KEY (`id_publicacion`) REFERENCES `publicaciones_obra` (`id_publicacion`);

--
-- Filtros para la tabla `guardados_obra`
--
ALTER TABLE `guardados_obra`
  ADD CONSTRAINT `guardados_obra_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `guardados_obra_ibfk_2` FOREIGN KEY (`id_publicacion`) REFERENCES `publicaciones_obra` (`id_publicacion`);

--
-- Filtros para la tabla `historial_interacciones_obra`
--
ALTER TABLE `historial_interacciones_obra`
  ADD CONSTRAINT `historial_interacciones_obra_ibfk_1` FOREIGN KEY (`id_publicacion`) REFERENCES `publicaciones_obra` (`id_publicacion`),
  ADD CONSTRAINT `historial_interacciones_obra_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `likes_obra`
--
ALTER TABLE `likes_obra`
  ADD CONSTRAINT `likes_obra_ibfk_1` FOREIGN KEY (`id_publicacion`) REFERENCES `publicaciones_obra` (`id_publicacion`),
  ADD CONSTRAINT `likes_obra_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `mensajes_privados`
--
ALTER TABLE `mensajes_privados`
  ADD CONSTRAINT `mensajes_privados_ibfk_1` FOREIGN KEY (`id_emisor`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `mensajes_privados_ibfk_2` FOREIGN KEY (`id_receptor`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `perfiles`
--
ALTER TABLE `perfiles`
  ADD CONSTRAINT `perfiles_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `preferencias_arte`
--
ALTER TABLE `preferencias_arte`
  ADD CONSTRAINT `preferencias_arte_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `publicaciones_obra`
--
ALTER TABLE `publicaciones_obra`
  ADD CONSTRAINT `publicaciones_obra_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `publicaciones_obra_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_obra` (`id_categoria`);

--
-- Filtros para la tabla `registro_actividad`
--
ALTER TABLE `registro_actividad`
  ADD CONSTRAINT `registro_actividad_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `reportes_contenido`
--
ALTER TABLE `reportes_contenido`
  ADD CONSTRAINT `reportes_contenido_ibfk_1` FOREIGN KEY (`id_usuario_reportado`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `reportes_contenido_ibfk_2` FOREIGN KEY (`id_usuario_reportante`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `seguidores_usuario`
--
ALTER TABLE `seguidores_usuario`
  ADD CONSTRAINT `seguidores_usuario_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `seguidores_usuario_ibfk_2` FOREIGN KEY (`id_seguidor`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `seguimiento_usuario`
--
ALTER TABLE `seguimiento_usuario`
  ADD CONSTRAINT `seguimiento_usuario_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `solicitudes_amistad`
--
ALTER TABLE `solicitudes_amistad`
  ADD CONSTRAINT `solicitudes_amistad_ibfk_1` FOREIGN KEY (`usuario_id_origen`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `solicitudes_amistad_ibfk_2` FOREIGN KEY (`usuario_id_destino`) REFERENCES `usuarios` (`id_usuario`);

--
-- Filtros para la tabla `usuarios_bloqueados`
--
ALTER TABLE `usuarios_bloqueados`
  ADD CONSTRAINT `usuarios_bloqueados_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  ADD CONSTRAINT `usuarios_bloqueados_ibfk_2` FOREIGN KEY (`id_bloqueado`) REFERENCES `usuarios` (`id_usuario`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
