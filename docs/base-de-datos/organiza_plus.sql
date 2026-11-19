-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- VersiÃ³n del servidor:         8.4.13 - MySQL Community Server - GPL
-- SO del servidor:              Win64
-- HeidiSQL VersiÃ³n:             12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para organiza_plus
CREATE DATABASE IF NOT EXISTS `organiza_plus` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `organiza_plus`;

-- Volcando estructura para tabla organiza_plus.cache
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.cache: ~0 rows (aproximadamente)

-- Volcando estructura para tabla organiza_plus.cache_locks
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.cache_locks: ~0 rows (aproximadamente)

-- Volcando estructura para tabla organiza_plus.failed_jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.failed_jobs: ~0 rows (aproximadamente)

-- Volcando estructura para tabla organiza_plus.jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.jobs: ~0 rows (aproximadamente)

-- Volcando estructura para tabla organiza_plus.job_batches
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.job_batches: ~0 rows (aproximadamente)

-- Volcando estructura para tabla organiza_plus.migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.migrations: ~6 rows (aproximadamente)
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
	(1, '0001_01_01_000000_create_users_table', 1),
	(2, '0001_01_01_000001_create_cache_table', 1),
	(3, '0001_01_01_000002_create_jobs_table', 1),
	(4, '2026_11_15_053214_create_personal_access_tokens_table', 1),
	(5, '2026_11_15_053432_add_role_to_users_table', 1),
	(6, '2026_11_15_054724_create_tasks_table', 1);

-- Volcando estructura para tabla organiza_plus.password_reset_tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Volcando estructura para tabla organiza_plus.personal_access_tokens
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Volcando estructura para tabla organiza_plus.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Volcando estructura para tabla organiza_plus.tasks
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_user_id_foreign` (`user_id`),
  CONSTRAINT `tasks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.tasks: ~26 rows (aproximadamente)
INSERT INTO `tasks` (`id`, `user_id`, `title`, `description`, `completed`, `image_path`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
	(46, 2, 'Prueba fotografica', 'Prueba 1', 1, 'tasks/GzR60GIcXzNqrfFDKQO4DyMsQr9JfRgrUbQbmBJe.jpg', -33.4752675, -70.7129805, '2026-11-19 02:17:28', '2026-11-19 02:17:40'),
	(47, 2, 'Prueba GPS', 'Prueba 2', 0, NULL, -33.4753000, -70.7129886, '2026-11-19 02:17:58', '2026-11-19 02:17:58'),
	(48, 2, 'delectus aut autem', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 02:18:13', '2026-11-19 02:18:13'),
	(49, 2, 'quis ut nam facilis et officia qui', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 02:18:14', '2026-11-19 02:18:14'),
	(50, 2, 'fugiat veniam minus', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 02:18:14', '2026-11-19 02:18:14'),
	(51, 2, 'et porro tempora', 'Tarea importada desde JSONPlaceholder.', 1, NULL, NULL, NULL, '2026-11-19 02:18:14', '2026-11-19 02:18:14'),
	(52, 2, 'laboriosam mollitia et enim quasi adipisci quia provident illum', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 02:18:15', '2026-11-19 02:18:15'),
	(53, 2, 'qui ullam ratione quibusdam voluptatem quia omnis', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 02:18:15', '2026-11-19 02:18:15'),
	(54, 2, 'illo expedita consequatur quia in', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 02:18:15', '2026-11-19 02:18:15'),
	(55, 2, 'quo adipisci enim quam ut ab', 'Tarea importada desde JSONPlaceholder.', 1, NULL, NULL, NULL, '2026-11-19 02:18:16', '2026-11-19 02:18:16'),
	(56, 2, 'molestiae perspiciatis ipsa', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 02:18:16', '2026-11-19 02:18:16'),
	(57, 2, 'illo est ratione doloremque quia maiores aut', 'Tarea importada desde JSONPlaceholder.', 1, NULL, NULL, NULL, '2026-11-19 02:18:16', '2026-11-19 02:18:16'),
	(58, 4, 'Prueba fotografica', NULL, 1, 'tasks/9R3eSvIbOkbpTkvUYQuT2SdW99cOjaN7UH5b3GZL.jpg', -33.4753024, -70.7129964, '2026-11-19 02:25:18', '2026-11-19 02:25:24'),
	(59, 4, 'Prueba GPS 1', NULL, 0, NULL, -33.4752649, -70.7129720, '2026-11-19 02:25:48', '2026-11-19 02:27:23'),
	(61, 4, 'Prueba 3', NULL, 1, NULL, -33.4752649, -70.7129720, '2026-11-19 02:32:39', '2026-11-19 04:30:15'),
	(62, 4, 'Prueba offline', NULL, 1, NULL, -33.4752649, -70.7129720, '2026-11-19 04:30:34', '2026-11-19 04:30:34'),
	(63, 4, 'delectus aut autem', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 04:32:40', '2026-11-19 04:32:40'),
	(64, 4, 'quis ut nam facilis et officia qui', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 04:32:40', '2026-11-19 04:32:40'),
	(65, 4, 'fugiat veniam minus', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 04:32:41', '2026-11-19 04:32:41'),
	(66, 4, 'et porro tempora', 'Tarea importada desde JSONPlaceholder.', 1, NULL, NULL, NULL, '2026-11-19 04:32:41', '2026-11-19 04:32:41'),
	(67, 4, 'laboriosam mollitia et enim quasi adipisci quia provident illum', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 04:32:41', '2026-11-19 04:32:41'),
	(68, 4, 'qui ullam ratione quibusdam voluptatem quia omnis', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 04:32:41', '2026-11-19 04:32:41'),
	(69, 4, 'illo expedita consequatur quia in', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 04:32:42', '2026-11-19 04:32:42'),
	(70, 4, 'quo adipisci enim quam ut ab', 'Tarea importada desde JSONPlaceholder.', 1, NULL, NULL, NULL, '2026-11-19 04:32:42', '2026-11-19 04:32:42'),
	(71, 4, 'molestiae perspiciatis ipsa', 'Tarea importada desde JSONPlaceholder.', 0, NULL, NULL, NULL, '2026-11-19 04:32:43', '2026-11-19 04:32:43'),
	(72, 4, 'illo est ratione doloremque quia maiores aut', 'Tarea importada desde JSONPlaceholder.', 1, NULL, NULL, NULL, '2026-11-19 04:32:43', '2026-11-19 04:32:43');

-- Volcando estructura para tabla organiza_plus.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Volcando datos para la tabla organiza_plus.users: ~4 rows (aproximadamente)
INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `remember_token`, `created_at`, `updated_at`) VALUES
	(1, 'Administrador Demo', 'admin@organizaplus.test', NULL, '$2y$12$vStUpawfI71jBVPyBjskX.l3NSv3IH0TmlHwvRDMYbVdjk2r4ufqm', 'admin', NULL, '2026-11-18 02:01:53', '2026-11-18 02:01:53'),
	(2, 'Usuario Demo', 'usuario@organizaplus.test', NULL, '$2y$12$R0X5gOEVVW0XR7soaUu2UuB6sGZV/z5qtHOxxGdeLwx2orcPuG8Tq', 'user', NULL, '2026-11-18 02:01:53', '2026-11-18 02:01:53'),
	(3, 'Usuario Prueba 2', 'usuario2@organizaplus.test', NULL, '$2y$12$aML8YaK/CV1Yy0gN4clqBuFLFl6.tSOvpc2jqhSzg/0OGYNOkkIom', 'user', NULL, '2026-11-18 03:56:24', '2026-11-18 03:56:24'),
	(4, 'Ale', 'ale@organizaplus.test', NULL, '$2y$12$LK/NVdHl2q0hHQucwm4sT.yCzNxYoHOLD5NEOZhHUZcCgUqYctLnG', 'user', NULL, '2026-11-19 02:21:06', '2026-11-19 02:21:06');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
