-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 13, 2025 at 01:38 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `market_spoton_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `id_number` varchar(50) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `user_id`, `full_name`, `id_number`, `department`, `permissions`, `created_at`) VALUES
(1, 1, 'System Administrator', 'ADM001', 'IT & Operations', NULL, '2025-11-13 11:10:21');

-- --------------------------------------------------------

--
-- Table structure for table `blacklisted_tokens`
--

CREATE TABLE `blacklisted_tokens` (
  `id` int(11) NOT NULL,
  `token_hash` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `managers`
--

CREATE TABLE `managers` (
  `manager_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `id_number` varchar(50) NOT NULL,
  `assigned_zones` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`assigned_zones`)),
  `employment_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `managers`
--

INSERT INTO `managers` (`manager_id`, `user_id`, `full_name`, `id_number`, `assigned_zones`, `employment_date`, `created_at`) VALUES
(1, 2, 'Manager One', 'MGR001', '[]', '2025-11-13', '2025-11-13 11:18:19'),
(2, 4, 'Manager A', 'MGR-A', '[]', '2025-11-13', '2025-11-13 11:34:05'),
(3, 5, 'Manager B', 'MGR-B', '[]', '2025-11-13', '2025-11-13 11:34:05');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(11) NOT NULL,
  `migration_name` varchar(255) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration_name`, `executed_at`) VALUES
(1, '001_create_users_table.js', '2025-11-13 11:10:10'),
(2, '002_create_profiles_tables.js', '2025-11-13 11:10:10'),
(3, '003_create_zones_spaces_tables.js', '2025-11-13 11:10:10'),
(4, '004_create_allocations_table.js', '2025-11-13 11:10:10'),
(5, '005_create_payments_table.js', '2025-11-13 11:10:10'),
(6, '006_create_notifications_table.js', '2025-11-13 11:10:10'),
(7, '013_create_blacklisted_tokens_table.js', '2025-11-13 11:10:10'),
(8, '014_add_row_ownership_and_views.js', '2025-11-13 11:26:17'),
(9, '015_add_manager_id_to_spaces.js', '2025-11-13 11:38:10');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `seller_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `notification_type` enum('system','allocation','payment','alert','announcement') DEFAULT 'system',
  `related_id` int(11) DEFAULT NULL,
  `status` enum('unread','read','archived') DEFAULT 'unread',
  `action_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `seller_id`, `title`, `message`, `notification_type`, `related_id`, `status`, `action_url`, `created_at`, `read_at`) VALUES
(1, 3, 1, 'Allocation Created', 'Your space allocation has been created and paid.', 'allocation', 1, 'unread', NULL, '2025-11-13 11:18:19', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `allocation_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` datetime NOT NULL,
  `payment_method` enum('mobile_money','cash','bank_transfer','card') NOT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_period_start` date DEFAULT NULL,
  `payment_period_end` date DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `processed_by` int(11) DEFAULT NULL,
  `mobile_money_number` varchar(30) DEFAULT NULL,
  `mobile_money_provider` varchar(100) DEFAULT NULL,
  `transaction_id` varchar(200) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`payment_id`, `allocation_id`, `seller_id`, `amount`, `payment_date`, `payment_method`, `payment_reference`, `payment_period_start`, `payment_period_end`, `status`, `processed_by`, `mobile_money_number`, `mobile_money_provider`, `transaction_id`, `notes`, `created_at`) VALUES
(4, 4, 6, 900.00, '2025-11-13 00:00:00', 'cash', '456789', '2025-11-15', '2025-11-26', 'completed', NULL, '', '', '65789', 'SDRFGHJK', '2025-11-13 11:53:47'),
(6, 4, 6, 86.00, '2025-11-13 00:00:00', 'cash', '4567898', NULL, NULL, 'completed', NULL, NULL, NULL, NULL, 'FDGHJ', '2025-11-13 12:02:50'),
(7, 4, 6, 500.00, '2025-11-13 00:00:00', 'cash', '986754', NULL, NULL, 'completed', NULL, NULL, NULL, NULL, NULL, '2025-11-13 12:03:32'),
(8, 5, 4, 4000.00, '2025-11-13 00:00:00', 'cash', '45678', '2025-11-11', '2025-11-21', 'completed', NULL, '', '', '2345678', 'WERTYUI', '2025-11-13 12:13:22'),
(9, 6, 7, 7000.00, '2025-11-13 00:00:00', 'cash', '4567890', '2025-11-23', '2025-11-11', 'completed', NULL, '', '', '6789009', 'dsfghjkl', '2025-11-13 12:32:37');

-- --------------------------------------------------------

--
-- Table structure for table `sellers`
--

CREATE TABLE `sellers` (
  `seller_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_by_manager_id` int(11) DEFAULT NULL,
  `full_name` varchar(255) NOT NULL,
  `id_number` varchar(50) NOT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `business_type` varchar(100) DEFAULT NULL,
  `tin_number` varchar(100) DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sellers`
--

INSERT INTO `sellers` (`seller_id`, `user_id`, `created_by_manager_id`, `full_name`, `id_number`, `business_name`, `business_type`, `tin_number`, `emergency_contact`, `address`, `registration_date`, `verification_status`, `created_at`) VALUES
(1, 3, NULL, 'Seller One', 'SLR001', 'One Shop Ltd', 'retail', 'TIN-0001', NULL, NULL, '2025-11-13', 'verified', '2025-11-13 11:18:19'),
(2, 6, 2, 'Seller A1', 'SLR-A1', 'Seller A1 Biz', 'retail', NULL, NULL, NULL, '2025-11-13', 'verified', '2025-11-13 11:34:05'),
(3, 7, 2, 'Seller A2', 'SLR-A2', 'Seller A2 Biz', 'retail', NULL, NULL, NULL, '2025-11-13', 'verified', '2025-11-13 11:34:05'),
(4, 8, 3, 'Seller B1', 'SLR-B1', 'Seller B1 Biz', 'retail', NULL, NULL, NULL, '2025-11-13', 'verified', '2025-11-13 11:34:05'),
(5, 9, 3, 'Seller B2', 'SLR-B2', 'Seller B2 Biz', 'retail', NULL, NULL, NULL, '2025-11-13', 'verified', '2025-11-13 11:34:05'),
(6, 10, 1, 'rukomo', '12345678765432', 'Rukomo', 'KAWA', '12345678', '+250789999999999', 'FGHJKL', '2025-11-13', 'verified', '2025-11-13 11:43:42'),
(7, 11, 3, 'rukoma', '123456789098765', 'Rukomo', 'RUKO', '2345678', '+250786690767', 'GHJK', '2025-11-13', 'verified', '2025-11-13 12:18:11');

-- --------------------------------------------------------

--
-- Table structure for table `spaces`
--

CREATE TABLE `spaces` (
  `space_id` int(11) NOT NULL,
  `zone_id` int(11) NOT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `created_by_manager_id` int(11) DEFAULT NULL,
  `space_number` varchar(20) NOT NULL,
  `space_type` enum('standard','premium','corner','storage') NOT NULL,
  `size_sqm` decimal(6,2) DEFAULT NULL,
  `daily_rate` decimal(10,2) NOT NULL,
  `weekly_rate` decimal(10,2) DEFAULT NULL,
  `monthly_rate` decimal(10,2) DEFAULT NULL,
  `status` enum('available','occupied','reserved','maintenance') DEFAULT 'available',
  `features` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spaces`
--

INSERT INTO `spaces` (`space_id`, `zone_id`, `manager_id`, `created_by_manager_id`, `space_number`, `space_type`, `size_sqm`, `daily_rate`, `weekly_rate`, `monthly_rate`, `status`, `features`, `created_at`) VALUES
(37, 8, 1, 1, 'SP-909', 'standard', 87.00, 97.00, 87.00, 86.00, 'occupied', 'JHj', '2025-11-13 11:38:29'),
(39, 8, 1, 1, 'SP-89', 'standard', 8.00, 67.00, 879.00, 6879.00, 'available', 'GGHJ', '2025-11-13 12:04:35'),
(40, 9, 3, 3, 'SP-090', 'standard', 900.00, 677.00, 879.00, 567.00, 'occupied', 'HGJ', '2025-11-13 12:11:06'),
(41, 9, 3, 3, 'SP-ELIE0', 'standard', 40.00, 98.00, 890.00, 977.00, 'occupied', 'FGH', '2025-11-13 12:23:31');

--
-- Triggers `spaces`
--
DELIMITER $$
CREATE TRIGGER `trg_spaces_set_creator` BEFORE INSERT ON `spaces` FOR EACH ROW BEGIN 
      IF NEW.created_by_manager_id IS NULL THEN 
        SET NEW.created_by_manager_id = (
          SELECT z.manager_id FROM zones z WHERE z.zone_id = NEW.zone_id
        );
      END IF; 
    END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_spaces_set_manager` BEFORE INSERT ON `spaces` FOR EACH ROW BEGIN
      IF NEW.manager_id IS NULL THEN
        SET NEW.manager_id = (
          SELECT z.manager_id FROM zones z WHERE z.zone_id = NEW.zone_id
        );
      END IF;
    END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `space_allocations`
--

CREATE TABLE `space_allocations` (
  `allocation_id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `space_id` int(11) NOT NULL,
  `allocation_date` date NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `allocation_type` enum('daily','weekly','monthly','permanent','temporary') NOT NULL,
  `created_by_manager_id` int(11) DEFAULT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `approved_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `space_allocations`
--

INSERT INTO `space_allocations` (`allocation_id`, `seller_id`, `space_id`, `allocation_date`, `start_date`, `end_date`, `allocation_type`, `created_by_manager_id`, `status`, `approved_by`, `notes`, `created_at`) VALUES
(4, 6, 37, '2025-11-13', '2025-11-13', '2026-01-21', 'monthly', 1, 'active', 2, 'YTDR', '2025-11-13 11:49:25'),
(5, 4, 40, '2025-11-13', '2025-11-13', '2025-11-26', 'monthly', 3, 'active', 5, 'JIUYF', '2025-11-13 12:12:17'),
(6, 7, 41, '2025-11-13', '2025-11-13', '2025-11-21', 'monthly', 3, 'active', 5, NULL, '2025-11-13 12:31:44');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `user_type` enum('admin','manager','seller') NOT NULL,
  `status` enum('active','suspended','inactive') DEFAULT 'active',
  `profile_photo` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `phone_number`, `user_type`, `status`, `profile_photo`, `reset_token`, `reset_token_expires`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin', 'admin@marketspoton.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000000', 'admin', 'active', NULL, NULL, NULL, '2025-11-13 11:10:21', '2025-11-13 12:19:16', '2025-11-13 12:19:16'),
(2, 'manager1', 'manager1@example.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000001', 'manager', 'active', NULL, NULL, NULL, '2025-11-13 11:18:18', '2025-11-13 12:27:48', '2025-11-13 12:27:48'),
(3, 'seller1', 'seller1@example.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000002', 'seller', 'active', NULL, NULL, NULL, '2025-11-13 11:18:18', '2025-11-13 11:18:18', NULL),
(4, 'manager_a', 'manager_a@example.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000100', 'manager', 'active', NULL, NULL, NULL, '2025-11-13 11:34:05', '2025-11-13 11:34:05', NULL),
(5, 'manager_b', 'manager_b@example.com', '$2a$10$7oieTZwGMdWlynAy9u7JA.GeWJVsEIvdqw6x/MyO4cL26TywetoMy', '+250788000100', 'manager', 'active', NULL, NULL, NULL, '2025-11-13 11:34:05', '2025-11-13 12:25:46', '2025-11-13 12:25:46'),
(6, 'seller_a1', 'seller_a1@example.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000200', 'seller', 'active', NULL, NULL, NULL, '2025-11-13 11:34:05', '2025-11-13 11:34:05', NULL),
(7, 'seller_a2', 'seller_a2@example.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000200', 'seller', 'active', NULL, NULL, NULL, '2025-11-13 11:34:05', '2025-11-13 11:34:05', NULL),
(8, 'seller_b1', 'seller_b1@example.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000200', 'seller', 'active', NULL, NULL, NULL, '2025-11-13 11:34:05', '2025-11-13 11:34:05', NULL),
(9, 'seller_b2', 'seller_b2@example.com', '$2a$10$OpEdmDBE7tK/eM9mqdxja.BM09kJesk4gklPia/645dnT5RGfDsKK', '+250788000200', 'seller', 'active', NULL, NULL, NULL, '2025-11-13 11:34:05', '2025-11-13 11:34:05', NULL),
(10, 'rukomo', 'rukomo@gmail.com', '$2a$10$BlDqgmxlUNFuW3/t2oH/xe5mZxoK3pCQIihf7metbv/60.2L67VJi', '+25078766688988', 'seller', 'active', NULL, NULL, NULL, '2025-11-13 11:43:42', '2025-11-13 12:24:12', '2025-11-13 12:24:12'),
(11, 'rukoma', 'rukoma@gmail.com', '$2a$10$QHAiOJXHeVALHwY/ETSYXecaFLqPCW3ixR.oCwK6eeG9rrtO/0GqW', '+2507866464764', 'seller', 'active', NULL, NULL, NULL, '2025-11-13 12:18:11', '2025-11-13 12:18:11', NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_manager_allocations`
-- (See below for the actual view)
--
CREATE TABLE `vw_manager_allocations` (
`allocation_id` int(11)
,`seller_id` int(11)
,`space_id` int(11)
,`allocation_date` date
,`start_date` date
,`end_date` date
,`allocation_type` enum('daily','weekly','monthly','permanent','temporary')
,`created_by_manager_id` int(11)
,`status` enum('active','expired','cancelled')
,`approved_by` int(11)
,`notes` text
,`created_at` timestamp
,`owner_manager_id` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_manager_payments`
-- (See below for the actual view)
--
CREATE TABLE `vw_manager_payments` (
`payment_id` int(11)
,`allocation_id` int(11)
,`seller_id` int(11)
,`amount` decimal(10,2)
,`payment_date` datetime
,`payment_method` enum('mobile_money','cash','bank_transfer','card')
,`payment_reference` varchar(100)
,`payment_period_start` date
,`payment_period_end` date
,`status` enum('pending','completed','failed','refunded')
,`processed_by` int(11)
,`mobile_money_number` varchar(30)
,`mobile_money_provider` varchar(100)
,`transaction_id` varchar(200)
,`notes` text
,`created_at` timestamp
,`owner_manager_id` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_manager_sellers`
-- (See below for the actual view)
--
CREATE TABLE `vw_manager_sellers` (
`seller_id` int(11)
,`user_id` int(11)
,`created_by_manager_id` int(11)
,`full_name` varchar(255)
,`id_number` varchar(50)
,`business_name` varchar(255)
,`business_type` varchar(100)
,`tin_number` varchar(100)
,`emergency_contact` varchar(100)
,`address` text
,`registration_date` date
,`verification_status` enum('pending','verified','rejected')
,`created_at` timestamp
,`owner_manager_id` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_manager_spaces`
-- (See below for the actual view)
--
CREATE TABLE `vw_manager_spaces` (
`space_id` int(11)
,`zone_id` int(11)
,`created_by_manager_id` int(11)
,`space_number` varchar(20)
,`space_type` enum('standard','premium','corner','storage')
,`size_sqm` decimal(6,2)
,`daily_rate` decimal(10,2)
,`weekly_rate` decimal(10,2)
,`monthly_rate` decimal(10,2)
,`status` enum('available','occupied','reserved','maintenance')
,`features` text
,`created_at` timestamp
,`owner_manager_id` int(11)
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_manager_zones`
-- (See below for the actual view)
--
CREATE TABLE `vw_manager_zones` (
`zone_id` int(11)
,`zone_name` varchar(100)
,`zone_code` varchar(20)
,`description` text
,`manager_id` int(11)
,`total_spaces` int(11)
,`occupied_spaces` int(11)
,`status` enum('active','inactive','maintenance')
,`created_at` timestamp
,`owner_manager_id` int(11)
);

-- --------------------------------------------------------

--
-- Table structure for table `zones`
--

CREATE TABLE `zones` (
  `zone_id` int(11) NOT NULL,
  `zone_name` varchar(100) NOT NULL,
  `zone_code` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `total_spaces` int(11) NOT NULL DEFAULT 0,
  `occupied_spaces` int(11) DEFAULT 0,
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `zones`
--

INSERT INTO `zones` (`zone_id`, `zone_name`, `zone_code`, `description`, `manager_id`, `total_spaces`, `occupied_spaces`, `status`, `created_at`) VALUES
(5, 'JIJI', 'Z-400', 'FGFHJK', 2, 2, 0, 'active', '2025-11-13 11:23:51'),
(8, 'KIKO', 'Z-PG', 'HG', 1, 92, 1, 'active', '2025-11-13 11:35:20'),
(9, '89L', 'ZIP', 'Hll', 3, 89, 2, 'active', '2025-11-13 12:06:56'),
(10, 'HAHA', 'ZF', 'JHGF', NULL, 0, 0, 'active', '2025-11-13 12:26:47');

-- --------------------------------------------------------

--
-- Structure for view `vw_manager_allocations`
--
DROP TABLE IF EXISTS `vw_manager_allocations`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_allocations`  AS SELECT `a`.`allocation_id` AS `allocation_id`, `a`.`seller_id` AS `seller_id`, `a`.`space_id` AS `space_id`, `a`.`allocation_date` AS `allocation_date`, `a`.`start_date` AS `start_date`, `a`.`end_date` AS `end_date`, `a`.`allocation_type` AS `allocation_type`, `a`.`created_by_manager_id` AS `created_by_manager_id`, `a`.`status` AS `status`, `a`.`approved_by` AS `approved_by`, `a`.`notes` AS `notes`, `a`.`created_at` AS `created_at`, `z`.`manager_id` AS `owner_manager_id` FROM ((`space_allocations` `a` join `spaces` `sp` on(`sp`.`space_id` = `a`.`space_id`)) join `zones` `z` on(`z`.`zone_id` = `sp`.`zone_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_manager_payments`
--
DROP TABLE IF EXISTS `vw_manager_payments`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_payments`  AS SELECT `p`.`payment_id` AS `payment_id`, `p`.`allocation_id` AS `allocation_id`, `p`.`seller_id` AS `seller_id`, `p`.`amount` AS `amount`, `p`.`payment_date` AS `payment_date`, `p`.`payment_method` AS `payment_method`, `p`.`payment_reference` AS `payment_reference`, `p`.`payment_period_start` AS `payment_period_start`, `p`.`payment_period_end` AS `payment_period_end`, `p`.`status` AS `status`, `p`.`processed_by` AS `processed_by`, `p`.`mobile_money_number` AS `mobile_money_number`, `p`.`mobile_money_provider` AS `mobile_money_provider`, `p`.`transaction_id` AS `transaction_id`, `p`.`notes` AS `notes`, `p`.`created_at` AS `created_at`, `z`.`manager_id` AS `owner_manager_id` FROM (((`payments` `p` join `space_allocations` `a` on(`a`.`allocation_id` = `p`.`allocation_id`)) join `spaces` `sp` on(`sp`.`space_id` = `a`.`space_id`)) join `zones` `z` on(`z`.`zone_id` = `sp`.`zone_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_manager_sellers`
--
DROP TABLE IF EXISTS `vw_manager_sellers`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_sellers`  AS SELECT `s`.`seller_id` AS `seller_id`, `s`.`user_id` AS `user_id`, `s`.`created_by_manager_id` AS `created_by_manager_id`, `s`.`full_name` AS `full_name`, `s`.`id_number` AS `id_number`, `s`.`business_name` AS `business_name`, `s`.`business_type` AS `business_type`, `s`.`tin_number` AS `tin_number`, `s`.`emergency_contact` AS `emergency_contact`, `s`.`address` AS `address`, `s`.`registration_date` AS `registration_date`, `s`.`verification_status` AS `verification_status`, `s`.`created_at` AS `created_at`, `s`.`created_by_manager_id` AS `owner_manager_id` FROM `sellers` AS `s` ;

-- --------------------------------------------------------

--
-- Structure for view `vw_manager_spaces`
--
DROP TABLE IF EXISTS `vw_manager_spaces`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_spaces`  AS SELECT `s`.`space_id` AS `space_id`, `s`.`zone_id` AS `zone_id`, `s`.`created_by_manager_id` AS `created_by_manager_id`, `s`.`space_number` AS `space_number`, `s`.`space_type` AS `space_type`, `s`.`size_sqm` AS `size_sqm`, `s`.`daily_rate` AS `daily_rate`, `s`.`weekly_rate` AS `weekly_rate`, `s`.`monthly_rate` AS `monthly_rate`, `s`.`status` AS `status`, `s`.`features` AS `features`, `s`.`created_at` AS `created_at`, `z`.`manager_id` AS `owner_manager_id` FROM (`spaces` `s` join `zones` `z` on(`z`.`zone_id` = `s`.`zone_id`)) ;

-- --------------------------------------------------------

--
-- Structure for view `vw_manager_zones`
--
DROP TABLE IF EXISTS `vw_manager_zones`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_zones`  AS SELECT `z`.`zone_id` AS `zone_id`, `z`.`zone_name` AS `zone_name`, `z`.`zone_code` AS `zone_code`, `z`.`description` AS `description`, `z`.`manager_id` AS `manager_id`, `z`.`total_spaces` AS `total_spaces`, `z`.`occupied_spaces` AS `occupied_spaces`, `z`.`status` AS `status`, `z`.`created_at` AS `created_at`, `z`.`manager_id` AS `owner_manager_id` FROM `zones` AS `z` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `id_number` (`id_number`);

--
-- Indexes for table `blacklisted_tokens`
--
ALTER TABLE `blacklisted_tokens`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `managers`
--
ALTER TABLE `managers`
  ADD PRIMARY KEY (`manager_id`),
  ADD UNIQUE KEY `id_number` (`id_number`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `migration_name` (`migration_name`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `seller_id` (`seller_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_type` (`notification_type`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `payment_reference` (`payment_reference`),
  ADD KEY `allocation_id` (`allocation_id`),
  ADD KEY `idx_payment_status` (`status`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_seller_payment` (`seller_id`);

--
-- Indexes for table `sellers`
--
ALTER TABLE `sellers`
  ADD PRIMARY KEY (`seller_id`),
  ADD UNIQUE KEY `id_number` (`id_number`),
  ADD KEY `fk_sellers_created_by_manager` (`created_by_manager_id`);

--
-- Indexes for table `spaces`
--
ALTER TABLE `spaces`
  ADD PRIMARY KEY (`space_id`),
  ADD UNIQUE KEY `unique_space` (`zone_id`,`space_number`),
  ADD KEY `idx_space_status` (`status`),
  ADD KEY `idx_space_type` (`space_type`),
  ADD KEY `idx_space_created_by` (`created_by_manager_id`),
  ADD KEY `idx_spaces_manager` (`manager_id`);

--
-- Indexes for table `space_allocations`
--
ALTER TABLE `space_allocations`
  ADD PRIMARY KEY (`allocation_id`),
  ADD KEY `space_id` (`space_id`),
  ADD KEY `idx_allocation_status` (`status`),
  ADD KEY `idx_seller` (`seller_id`),
  ADD KEY `idx_dates` (`start_date`,`end_date`),
  ADD KEY `idx_alloc_created_by` (`created_by_manager_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_user_type` (`user_type`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `zones`
--
ALTER TABLE `zones`
  ADD PRIMARY KEY (`zone_id`),
  ADD UNIQUE KEY `zone_code` (`zone_code`),
  ADD KEY `idx_zone_status` (`status`),
  ADD KEY `idx_zone_manager` (`manager_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `admin_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `blacklisted_tokens`
--
ALTER TABLE `blacklisted_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `managers`
--
ALTER TABLE `managers`
  MODIFY `manager_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `sellers`
--
ALTER TABLE `sellers`
  MODIFY `seller_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `spaces`
--
ALTER TABLE `spaces`
  MODIFY `space_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `space_allocations`
--
ALTER TABLE `space_allocations`
  MODIFY `allocation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `zones`
--
ALTER TABLE `zones`
  MODIFY `zone_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`seller_id`) ON DELETE SET NULL;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`allocation_id`) REFERENCES `space_allocations` (`allocation_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`seller_id`) ON DELETE CASCADE;

--
-- Constraints for table `sellers`
--
ALTER TABLE `sellers`
  ADD CONSTRAINT `fk_sellers_created_by_manager` FOREIGN KEY (`created_by_manager_id`) REFERENCES `managers` (`manager_id`) ON DELETE SET NULL;

--
-- Constraints for table `spaces`
--
ALTER TABLE `spaces`
  ADD CONSTRAINT `spaces_ibfk_1` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`zone_id`) ON DELETE CASCADE;

--
-- Constraints for table `space_allocations`
--
ALTER TABLE `space_allocations`
  ADD CONSTRAINT `space_allocations_ibfk_1` FOREIGN KEY (`seller_id`) REFERENCES `sellers` (`seller_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `space_allocations_ibfk_2` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`space_id`) ON DELETE CASCADE;

--
-- Constraints for table `zones`
--
ALTER TABLE `zones`
  ADD CONSTRAINT `zones_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `managers` (`manager_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
