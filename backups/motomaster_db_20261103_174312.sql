-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: motomaster
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `user_type` varchar(20) DEFAULT 'User',
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`),
  KEY `idx_user_log` (`user_id`),
  KEY `idx_created_log` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin` (
  `admin_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES (3,'Albea','Pallado','aiapallado@gmail.com','$2y$10$PQD8gX62hijWKK/ThznOb.uUZCvaACdRTeV5SG2tohc76IUNacBsi','2026-10-12 04:31:19');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assessment`
--

DROP TABLE IF EXISTS `assessment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assessment` (
  `assessment_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `type` varchar(50) NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `remarks` varchar(50) NOT NULL,
  `details` longtext DEFAULT NULL,
  `date_taken` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`assessment_id`),
  KEY `idx_student_assess` (`student_id`),
  CONSTRAINT `fk_assessment_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessment`
--

LOCK TABLES `assessment` WRITE;
/*!40000 ALTER TABLE `assessment` DISABLE KEYS */;
/*!40000 ALTER TABLE `assessment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assessment_results`
--

DROP TABLE IF EXISTS `assessment_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `assessment_results` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `assessment_type` varchar(50) NOT NULL,
  `score` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `correct_answers` int(11) NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_student_res` (`student_id`),
  CONSTRAINT `fk_results_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessment_results`
--

LOCK TABLES `assessment_results` WRITE;
/*!40000 ALTER TABLE `assessment_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `assessment_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instructors`
--

DROP TABLE IF EXISTS `instructors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `instructors` (
  `instructor_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`instructor_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instructors`
--

LOCK TABLES `instructors` WRITE;
/*!40000 ALTER TABLE `instructors` DISABLE KEYS */;
INSERT INTO `instructors` VALUES (3,'Albea','Pallado','aiapallado@gmail.com','$2y$10$BTuRSrlSqz4mi6HEsQ54h.U3ZiLIGuk8PRyuSqGKz13Zai5I7tJ76','Engine Systems','09488124593','2026-10-12 04:33:19');
/*!40000 ALTER TABLE `instructors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_role` varchar(20) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `sender_name` varchar(150) NOT NULL,
  `recipient_role` varchar(20) NOT NULL,
  `recipient_id` int(11) NOT NULL DEFAULT 0,
  `recipient_name` varchar(150) DEFAULT NULL,
  `subject` varchar(200) NOT NULL DEFAULT '',
  `message_text` text NOT NULL,
  `category` varchar(20) NOT NULL DEFAULT 'message',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`message_id`),
  KEY `idx_recipient` (`recipient_role`,`recipient_id`,`is_read`,`created_at`),
  KEY `idx_sender` (`sender_role`,`sender_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `badge_text` varchar(50) NOT NULL DEFAULT 'Notice',
  `badge_class` varchar(50) NOT NULL DEFAULT 'badge-info',
  `icon` varchar(80) NOT NULL DEFAULT 'fa-solid fa-bell',
  `icon_bg` varchar(25) NOT NULL DEFAULT 'rgba(232,34,42,0.1)',
  `icon_color` varchar(25) NOT NULL DEFAULT '#e8222a',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `recipient_role` varchar(50) NOT NULL DEFAULT 'All Admins',
  `delivery_channel` varchar(50) NOT NULL DEFAULT 'In-App Only',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`notification_id`),
  KEY `idx_notif_type` (`type`),
  KEY `idx_notif_read` (`is_read`),
  KEY `idx_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `report_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `report_type` varchar(100) NOT NULL,
  `data` longtext DEFAULT NULL,
  `generated_data` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`report_id`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_report_student` (`student_id`),
  KEY `idx_report_instructor` (`instructor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `simulation`
--

DROP TABLE IF EXISTS `simulation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `simulation` (
  `simulation_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` longtext DEFAULT NULL,
  `date_attempted` datetime DEFAULT current_timestamp(),
  `completion_status` varchar(50) DEFAULT 'In Progress',
  `score` decimal(5,2) DEFAULT 0.00,
  PRIMARY KEY (`simulation_id`,`student_id`),
  KEY `idx_student_sim` (`student_id`),
  CONSTRAINT `fk_simulation_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `simulation`
--

LOCK TABLES `simulation` WRITE;
/*!40000 ALTER TABLE `simulation` DISABLE KEYS */;
INSERT INTO `simulation` VALUES (2,3,'Battery Maintenance','{\"time_elapsed_seconds\":1646,\"steps\":[{\"title\":\"Step 1: Inspect Battery Condition\",\"correct\":[\"Ignition off and keys removed\",\"Battery has no cracks, bulging, or leaks\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 2: Clean Battery Terminals\",\"correct\":[\"Battery cleaned successfully!\",\"Mix baking soda with water to create cleaning paste\",\"Disconnect negative (-) terminal first, then positive (+)\",\"Apply paste to terminals and use wire brush to remove corrosion\",\"Wipe terminals clean with a damp cloth and dry thoroughly\",\"Reconnect positive (+) first, then negative (-) terminal\",\"Check electrolyte level in each cell against MIN\\/MAX marks\",\"Connect the tester leads — red to positive (+), black to negative (−)\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 3: Test Battery Health\",\"correct\":[\"Remove battery caps carefully — wear safety goggles\",\"Battery tested successfully — 12.6V, CCA within spec, health GOOD.\",\"Remove the terminal caps to access the battery posts\",\"Connect the tester leads — red to positive (+), black to negative (−)\",\"Run the battery test and read the voltage result\",\"Verify the battery passes — 12.4V or higher under load\",\"Remove the tester leads and replace the terminal caps\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 4: Secure Battery Mount\",\"correct\":[\"Check battery hold-down bracket for tightness\",\"Inspect bracket bolts for corrosion and tightness\",\"Tighten bracket evenly — do not over-tighten\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 5: Test Electrical System\",\"correct\":[\"Listen for smooth starter motor operation\",\"Record battery test results and service date in log\"],\"mistakes\":[],\"score\":100}],\"saved_at\":\"2026-11-03T15:16:01+01:00\",\"current_step_index\":null,\"step_instr_done\":null,\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 22:16:01','Completed',100.00),(3,3,'Engine Oil Change','{\"time_elapsed_seconds\":746,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare Tools & Safety Check\",\"correct_actions\":[\"Engine is completely OFF and keys are removed\",\"Engine has cooled down to avoid burns\",\"Vehicle parked on a level surface with parking brake engaged\",\"Wearing gloves, goggles, and protective gear\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Drain the Old Oil\",\"correct_actions\":[\"Locate the oil drain plug under the chassis\",\"Position the drain pan directly under the plug\",\"Loosen and remove the drain plug slowly\",\"Allow the used oil to drain completely\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Reinstall Plug & Replace Filter\",\"correct_actions\":[\"Reinstall the drain plug and tighten to the correct torque\",\"Remove the old oil filter carefully\",\"Lubricate the new filter gasket with fresh oil\",\"Install the new oil filter hand-tight only\",\"Check that the old gasket is fully removed\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Refill Engine Oil\",\"correct_actions\":[\"Remove the oil filler cap\",\"Pour the recommended oil type slowly to prevent spills\",\"Wipe the dipstick before checking the level\",\"Check that the oil level is within the safe range\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":4,\"title\":\"Step 5: Test Engine & Clean Up\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:59:22+01:00\",\"current_step_index\":0,\"step_instr_done\":[],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:59:22','In Progress',80.00),(4,3,'Brake Pad Replacement','{\"time_elapsed_seconds\":107,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare Tools & Safety Check\",\"correct_actions\":[\"Prepare jack, wrench, and correct socket sizes\"],\"mistake_actions\":[],\"correct_count\":1,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Lift Vehicle & Remove Wheel\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":2,\"title\":\"Step 3: Inspect & Remove Old Pads\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Install New Pads & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Pump Pedal & Test Brakes\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:59:35+01:00\",\"current_step_index\":0,\"step_instr_done\":[[null,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:59:35','In Progress',20.00),(5,3,'Air Filter Replacement','{\"time_elapsed_seconds\":20,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Open the Hood\",\"correct_actions\":[\"Air filter box located.\",\"Intake hose identified.\",\"New filter and tools prepared.\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Open Housing & Remove Filter\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":2,\"title\":\"Step 3: Inspect & Clean Housing\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Install the New Filter\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Secure Housing & Final Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:59:44+01:00\",\"current_step_index\":0,\"step_instr_done\":[],\"battery_needs_replacement\":null,\"scene_state\":{\"hoodOpen\":true,\"clipsReleased\":false,\"coverOff\":false,\"oldFilterRemoved\":false,\"newFilterInstalled\":false,\"inspectDone\":[true,true,true,true,true]}}','2026-11-03 20:59:44','In Progress',20.00),(6,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":32,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Electrical connector unplugged successfully.\",\"Remove the bolts holding the ignition coil\",\"Ignition coil bolts removed successfully.\",\"Ignition coil pulled straight out of the plug well successfully.\",\"Insert a spark plug socket with extension\",\"Spark plug socket inserted successfully.\",\"Turn counterclockwise to loosen and lift out the plug\",\"Spark plug loosened and lifted out successfully.\"],\"mistake_actions\":[\"Remove the coil bolts first (use the Socket Wrench or Socket Set tool).\",\"Refit the coil and connector during the reassembly step.\",\"Inspect the plug after it has been lifted out — on the next step.\",\"The parts tray is not used in the spark plug procedure.\",\"The shop rag is not needed during this step.\"],\"correct_count\":9,\"mistake_count\":5,\"score\":64},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-10-26T06:08:56+01:00\",\"current_step_index\":1,\"step_instr_done\":[[true,true,true],[true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-10-26 13:08:56','In Progress',33.00),(7,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":95,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Battery negative terminal disconnected first\",\"Ignition OFF and keys removed\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Remove the lower fuel line fitting with a wrench\",\"Lower fuel line fitting removed successfully.\",\"Use a rag to catch any fuel spray\",\"Shop rag positioned successfully to catch fuel spray.\"],\"mistake_actions\":[\"Disconnect the fuel line fittings first!\"],\"correct_count\":4,\"mistake_count\":1,\"score\":80},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T03:45:41+01:00\",\"current_step_index\":1,\"step_instr_done\":[[true,true,true,true,true],[null,true,null,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 10:45:41','In Progress',36.00),(8,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":5,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Electrical connector unplugged successfully.\",\"Remove the bolts holding the ignition coil\",\"Ignition coil bolts removed successfully.\",\"Ignition coil pulled straight out of the plug well successfully.\",\"Insert a spark plug socket with extension\",\"Spark plug socket inserted successfully.\",\"Turn counterclockwise to loosen and lift out the plug\",\"Spark plug loosened and lifted out successfully.\"],\"mistake_actions\":[\"Remove the coil bolts first (use the Socket Wrench or Socket Set tool).\",\"Refit the coil and connector during the reassembly step.\",\"Inspect the plug after it has been lifted out — on the next step.\",\"The parts tray is not used in the spark plug procedure.\",\"The shop rag is not needed during this step.\"],\"correct_count\":9,\"mistake_count\":5,\"score\":64},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-10-26T06:13:49+01:00\",\"current_step_index\":1,\"step_instr_done\":[[true,true,true],[true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-10-26 13:13:49','In Progress',33.00),(9,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":6,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Electrical connector unplugged successfully.\",\"Remove the bolts holding the ignition coil\",\"Ignition coil bolts removed successfully.\",\"Ignition coil pulled straight out of the plug well successfully.\",\"Insert a spark plug socket with extension\",\"Spark plug socket inserted successfully.\",\"Turn counterclockwise to loosen and lift out the plug\",\"Spark plug loosened and lifted out successfully.\"],\"mistake_actions\":[\"Remove the coil bolts first (use the Socket Wrench or Socket Set tool).\",\"Refit the coil and connector during the reassembly step.\",\"Inspect the plug after it has been lifted out — on the next step.\",\"The parts tray is not used in the spark plug procedure.\",\"The shop rag is not needed during this step.\"],\"correct_count\":9,\"mistake_count\":5,\"score\":64},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-10-26T06:15:58+01:00\",\"current_step_index\":1,\"step_instr_done\":[[true,true,true],[true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-10-26 13:15:58','In Progress',33.00),(10,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":30,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Hood opened and secured successfully.\"],\"mistake_actions\":[],\"correct_count\":1,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-10-26T06:23:36+01:00\",\"current_step_index\":0,\"step_instr_done\":[[false,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-10-26 13:23:36','In Progress',20.00),(11,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":59,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[\"Check the plug tip: light brown\\/gray is normal\",\"Black sooty tip means a rich fuel condition\",\"Oil-coated tip may indicate an engine issue\",\"Plug tip condition inspected — readings recorded successfully.\"],\"mistake_actions\":[\"Keep the coil and connector off during the inspection step.\",\"The new spark plug is installed during the reassembly step.\",\"The spark plug is only lifted out during the removal step.\"],\"correct_count\":4,\"mistake_count\":3,\"score\":57},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-10-26T08:23:51+01:00\",\"current_step_index\":2,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":{\"caps\":[0,1],\"plug_removed\":false,\"covers\":[]}}','2026-10-26 15:23:51','In Progress',51.00),(12,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":40,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[\"Hover the spark plug to check its tip condition\",\"Use a feeler gauge to check the electrode gap\"],\"mistake_actions\":[],\"correct_count\":2,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-10-26T08:47:38+01:00\",\"current_step_index\":3,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true,true]],\"battery_needs_replacement\":null,\"scene_state\":{\"caps\":[0,1],\"plug_removed\":false,\"covers\":[{\"type\":\"cover\",\"name\":\"Ignition_Coil\",\"index\":0}]}}','2026-10-26 15:47:38','In Progress',60.00),(13,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":13,\"steps\":[{\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct\":[\"Hover the spark plug to check its tip condition\",\"Use a feeler gauge to check the electrode gap\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 4: Install & Reassemble\",\"correct\":[\"Insert the new plug by hand first to avoid cross-threading\",\"Tighten with the socket — snug, not over-tightened\",\"Push the coil back into place and reinstall its bolt\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 5: Final Engine Check\",\"correct\":[\"Refit the ignition coil and reconnect the electrical connector\",\"Start the engine and let it idle\",\"Check for misfires or rough running\",\"Shut off the engine and clean up tools\"],\"mistakes\":[],\"score\":100}],\"saved_at\":\"2026-11-02T15:01:29+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true,true],[true,true,true,false,false],[true,true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-02 22:01:29','Completed',100.00),(14,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":79,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[\"Click the spark plug in Removed Items to check its tip condition\",\"Use a feeler gauge to check the electrode gap\"],\"mistake_actions\":[],\"correct_count\":2,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-02T15:02:55+01:00\",\"current_step_index\":3,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true,true]],\"battery_needs_replacement\":null,\"scene_state\":{\"caps\":[0,1],\"plug_removed\":false,\"covers\":[]}}','2026-11-02 22:02:55','In Progress',60.00),(15,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":47,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[\"Click the spark plug in the engine to check its tip condition\",\"Use a feeler gauge to check the electrode gap\"],\"mistake_actions\":[],\"correct_count\":2,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[\"Insert the new plug by hand first to avoid cross-threading\",\"Tighten with the socket — snug, not over-tightened\",\"Push the coil back into place and reinstall its bolt\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[\"Start the engine and let it idle\",\"Shut off the engine and clean up tools\"],\"mistake_actions\":[],\"correct_count\":2,\"mistake_count\":0,\"score\":100}],\"saved_at\":\"2026-11-02T15:14:51+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true,true],[true,true,true],[null,true,null,true]],\"battery_needs_replacement\":null,\"scene_state\":{\"caps\":[],\"plug_removed\":false,\"covers\":[]}}','2026-11-02 22:14:51','In Progress',100.00),(16,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":13,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct_actions\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct_actions\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct_actions\":[\"Click the spark plug in the engine to check its tip condition\"],\"mistake_actions\":[\"Worn spark plug removed — a replacement plug is required.\"],\"correct_count\":1,\"mistake_count\":1,\"score\":50},{\"step_index\":3,\"title\":\"Step 4: Install & Reassemble\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Final Engine Check\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-02T15:35:33+01:00\",\"current_step_index\":2,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true]],\"battery_needs_replacement\":null,\"scene_state\":{\"caps\":[0,1],\"plug_removed\":false,\"covers\":[{\"type\":\"cover\",\"name\":\"Ignition_Coil\",\"index\":0}]}}','2026-11-02 22:35:33','In Progress',50.00),(17,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":32,\"steps\":[{\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct\":[\"Use Check Spark Plug to inspect the plug tip condition\",\"Use a feeler gauge to check the electrode gap\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 4: Install & Reassemble\",\"correct\":[\"Insert the new plug by hand first to avoid cross-threading\",\"Tighten with the socket — snug, not over-tightened\",\"Push the coil back into place and reinstall its bolt\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 5: Final Engine Check\",\"correct\":[\"Refit the ignition coil and reconnect the electrical connector\",\"Start the engine and let it idle\",\"Check for misfires or rough running\",\"Shut off the engine and clean up tools\"],\"mistakes\":[],\"score\":100}],\"saved_at\":\"2026-11-02T15:39:39+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true,true],[true,true,true],[true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-02 22:39:39','Completed',100.00),(18,3,'Spark Plug Replacement','{\"time_elapsed_seconds\":87,\"steps\":[{\"title\":\"Step 1: Prepare & Locate the Spark Plugs\",\"correct\":[\"Engine is OFF and completely cool\",\"Hood opened and secured\",\"Wearing gloves and safety goggles\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 2: Remove Coils & Spark Plugs\",\"correct\":[\"Unplug the electrical connector carefully\",\"Remove the bolts holding the ignition coil\",\"Pull the coil straight out of the plug well\",\"Insert a spark plug socket with extension\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 3: Inspect & Gap the Spark Plugs\",\"correct\":[\"Use Check Spark Plug to inspect the plug tip condition\",\"Use a feeler gauge to check the electrode gap\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 4: Install & Reassemble\",\"correct\":[\"Insert the new plug by hand first to avoid cross-threading\",\"Tighten with the socket — snug, not over-tightened\",\"Push the coil back into place and reinstall its bolt\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 5: Final Engine Check\",\"correct\":[\"Refit the ignition coil and reconnect the electrical connector\",\"Start the engine and let it idle\",\"Check for misfires or rough running\",\"Shut off the engine and clean up tools\"],\"mistakes\":[],\"score\":100}],\"saved_at\":\"2026-11-02T16:04:06+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true],[true,true,true,true],[true,true],[true,true,true],[true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-02 23:04:06','Completed',100.00),(19,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":6,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Battery negative terminal disconnected successfully.\"],\"mistake_actions\":[],\"correct_count\":1,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T04:21:19+01:00\",\"current_step_index\":0,\"step_instr_done\":[[true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 11:21:19','In Progress',20.00),(20,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":65,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Remove the lower fuel line fitting with a wrench\",\"Lower fuel line fitting removed successfully.\",\"Use a rag to catch any fuel spray\",\"Shop rag positioned successfully to catch fuel spray.\"],\"mistake_actions\":[\"Disconnect the fuel line fittings first — remove both caps.\"],\"correct_count\":4,\"mistake_count\":1,\"score\":80},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T12:54:12+01:00\",\"current_step_index\":1,\"step_instr_done\":[[true,true,true,true,true],[null,true,null,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 19:54:12','In Progress',36.00),(21,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":8,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[],\"mistake_actions\":[\"Disconnect the fuel line fittings first — remove both caps.\",\"Loosen the banjo bolt and position the rag\\/drip pan first.\"],\"correct_count\":0,\"mistake_count\":2,\"score\":0},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:04:08+01:00\",\"current_step_index\":1,\"step_instr_done\":[[true,true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:04:08','In Progress',20.00),(22,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":10,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[\"Unscrew the mounting bracket bolt\",\"Mounting bracket bolt unscrewed successfully.\",\"Slide the old fuel filter out of the bracket\",\"Old fuel filter slid out successfully from the bracket.\",\"Place the new filter in the bracket\",\"Make sure the filter sits firmly in place\",\"New fuel filter installed successfully — sits firmly in the bracket.\",\"New fuel filter installed successfully!\"],\"mistake_actions\":[],\"correct_count\":8,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:11:34+01:00\",\"current_step_index\":2,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true,true,true,null,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:11:34','In Progress',60.00),(23,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":9,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\"],\"mistake_actions\":[\"Top banjo bolt loosened slowly — fuel pressure relieved.\"],\"correct_count\":1,\"mistake_count\":1,\"score\":50},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:17:08+01:00\",\"current_step_index\":1,\"step_instr_done\":[[true,true,true,true,true],[true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:17:08','In Progress',30.00),(24,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":134,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[\"Unscrew the mounting bracket bolt\",\"Slide the old fuel filter out of the bracket\",\"Place the new filter in the bracket\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[\"Reconnect the bottom fuel line first\",\"Then reinstall the top banjo bolt\",\"Put back all washers exactly as before\",\"Tighten fittings to proper torque — firm, not over-tightened\",\"Reconnect the battery negative terminal\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[\"Turn the key to ON to build fuel pressure — do not start yet\",\"Start the engine and let it run\",\"Confirm the engine runs smoothly\",\"Engine primed and started successfully — idles smoothly.\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100}],\"saved_at\":\"2026-11-03T13:19:26+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true,true,true],[true,true,true,true,true],[true,true,null,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:19:26','In Progress',100.00),(25,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":20,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[\"Unscrew the mounting bracket bolt\",\"Slide the old fuel filter out of the bracket\",\"Place the new filter in the bracket\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[\"Reconnect the bottom fuel line first\",\"Then reinstall the top banjo bolt\",\"Tighten fittings to proper torque — firm, not over-tightened\",\"Reconnect the battery negative terminal\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[\"Turn the key to ON to build fuel pressure — do not start yet\",\"Start the engine and let it run\",\"Confirm the engine runs smoothly\",\"Engine primed and started successfully — idles smoothly.\",\"Retighten any leaking fittings if needed\",\"Leaking fittings retightened successfully.\"],\"mistake_actions\":[\"Safety gear is equipped during the safety step.\",\"The drip pan is only needed during the disconnect step.\",\"Penetrating oil is only needed during the disconnect step.\"],\"correct_count\":6,\"mistake_count\":3,\"score\":67}],\"saved_at\":\"2026-11-03T13:26:24+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true,true,true],[true,true,true,true,true],[true,true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:26:24','In Progress',93.00),(26,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":8,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[\"Unscrew the mounting bracket bolt\",\"Mounting bracket bolt unscrewed successfully.\"],\"mistake_actions\":[],\"correct_count\":2,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:29:45+01:00\",\"current_step_index\":2,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:29:45','In Progress',60.00),(27,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":144,\"steps\":[{\"title\":\"Step 1: Safety & Locate the Filter\",\"correct\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 3: Replace the Fuel Filter\",\"correct\":[\"Unscrew the mounting bracket bolt\",\"Slide the old fuel filter out of the bracket\",\"Place the new filter in the bracket\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct\":[\"Reconnect the bottom fuel line first\",\"Then reinstall the top banjo bolt\",\"Tighten fittings to proper torque — firm, not over-tightened\",\"Reconnect the battery negative terminal\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 5: Prime & Test the Engine\",\"correct\":[\"Turn the key to ON to build fuel pressure — do not start yet\",\"Start the engine and let it run\",\"Confirm the engine runs smoothly\",\"Retighten any leaking fittings if needed\"],\"mistakes\":[],\"score\":100}],\"saved_at\":\"2026-11-03T13:32:10+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true,true,true],[true,true,true,true],[true,true,true,true]],\"battery_needs_replacement\":null,\"scene_state\":null}','2026-11-03 20:32:10','Completed',100.00),(28,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":108,\"steps\":[{\"title\":\"Step 1: Safety & Locate the Filter\",\"correct\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 3: Replace the Fuel Filter\",\"correct\":[\"Unscrew the mounting bracket bolt\",\"Slide the old fuel filter out of the bracket\",\"Place the new filter in the bracket\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct\":[\"Reconnect the bottom fuel line first\",\"Then reinstall the top banjo bolt\",\"Tighten fittings to proper torque — firm, not over-tightened\",\"Reconnect the battery negative terminal\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 5: Prime & Test the Engine\",\"correct\":[\"Turn the key to ON to build fuel pressure — do not start yet\",\"Start the engine and let it run\",\"Confirm the engine runs smoothly\",\"Retighten any leaking fittings if needed\"],\"mistakes\":[],\"score\":100}],\"saved_at\":\"2026-11-03T13:38:49+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true,true,true],[true,true,true,true],[true,true,true,true]],\"battery_needs_replacement\":false,\"scene_state\":{\"negativeCapRemoved\":false,\"positiveCapRemoved\":false,\"fuelFilterRemoved\":false,\"removedItems\":[[\"battery\",{\"type\":\"battery\",\"name\":\"Fuel Filter\",\"removed\":true}]]}}','2026-11-03 20:38:49','Completed',100.00),(29,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":16,\"steps\":[{\"step_index\":0,\"title\":\"Step 1: Safety & Locate the Filter\",\"correct_actions\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistake_actions\":[],\"correct_count\":5,\"mistake_count\":0,\"score\":100},{\"step_index\":1,\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct_actions\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistake_actions\":[],\"correct_count\":4,\"mistake_count\":0,\"score\":100},{\"step_index\":2,\"title\":\"Step 3: Replace the Fuel Filter\",\"correct_actions\":[\"Unscrew the mounting bracket bolt\",\"Slide the old fuel filter out of the bracket\",\"Place the new filter in the bracket\"],\"mistake_actions\":[],\"correct_count\":3,\"mistake_count\":0,\"score\":100},{\"step_index\":3,\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0},{\"step_index\":4,\"title\":\"Step 5: Prime & Test the Engine\",\"correct_actions\":[],\"mistake_actions\":[],\"correct_count\":0,\"mistake_count\":0,\"score\":0}],\"saved_at\":\"2026-11-03T13:40:52+01:00\",\"current_step_index\":2,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true,true,true]],\"battery_needs_replacement\":false,\"scene_state\":{\"negativeCapRemoved\":true,\"positiveCapRemoved\":true,\"fuelFilterRemoved\":false,\"removedItems\":[[0,{\"index\":0,\"removed\":false,\"name\":\"Negative (-) Cap\",\"type\":\"negative\"}],[1,{\"index\":1,\"removed\":true,\"name\":\"Positive (+) Cap\",\"type\":\"positive\"}],[\"battery\",{\"type\":\"battery\",\"name\":\"Fuel Filter\",\"removed\":true}]]}}','2026-11-03 20:40:52','In Progress',60.00),(30,3,'Fuel Filter Replacement','{\"time_elapsed_seconds\":20,\"steps\":[{\"title\":\"Step 1: Safety & Locate the Filter\",\"correct\":[\"Ignition OFF and keys removed\",\"Battery negative terminal disconnected first\",\"Fuel filter located on the firewall\",\"Wearing gloves and safety goggles\",\"Wrenches, rag, and new filter prepared\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 2: Relieve Pressure & Disconnect Lines\",\"correct\":[\"Loosen the top banjo bolt slowly to relieve fuel pressure\",\"Use a rag to catch any fuel spray\",\"Remove the top banjo bolt completely\",\"Remove the lower fuel line fitting with a wrench\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 3: Replace the Fuel Filter\",\"correct\":[\"Unscrew the mounting bracket bolt\",\"Slide the old fuel filter out of the bracket\",\"Place the new filter in the bracket\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 4: Reconnect Lines & Tighten\",\"correct\":[\"Reconnect the bottom fuel line first\",\"Then reinstall the top banjo bolt\",\"Tighten fittings to proper torque — firm, not over-tightened\",\"Reconnect the battery negative terminal\"],\"mistakes\":[],\"score\":100},{\"title\":\"Step 5: Prime & Test the Engine\",\"correct\":[\"Turn the key to ON to build fuel pressure — do not start yet\",\"Start the engine and let it run\",\"Confirm the engine runs smoothly\",\"Retighten any leaking fittings if needed\"],\"mistakes\":[],\"score\":100}],\"saved_at\":\"2026-11-03T13:47:27+01:00\",\"current_step_index\":4,\"step_instr_done\":[[true,true,true,true,true],[true,true,true,true],[true,true,true],[true,true,true,true],[true,true,true,true]],\"battery_needs_replacement\":false,\"scene_state\":{\"negativeCapRemoved\":false,\"positiveCapRemoved\":false,\"fuelFilterRemoved\":false,\"engineOn\":true,\"removedItems\":[[\"battery\",{\"type\":\"battery\",\"name\":\"Fuel Filter\",\"removed\":true}]]}}','2026-11-03 20:47:27','Completed',100.00);
/*!40000 ALTER TABLE `simulation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `simulation_comments`
--

DROP TABLE IF EXISTS `simulation_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `simulation_comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `work_type` varchar(20) NOT NULL,
  `work_id` int(11) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `module_title` varchar(200) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `teacher_name` varchar(150) NOT NULL DEFAULT '',
  `comment_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`comment_id`),
  KEY `idx_comment_work` (`work_type`,`student_id`,`module_title`),
  KEY `idx_comment_student` (`student_id`),
  KEY `idx_comment_teacher` (`teacher_id`),
  CONSTRAINT `fk_comment_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `simulation_comments`
--

LOCK TABLES `simulation_comments` WRITE;
/*!40000 ALTER TABLE `simulation_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `simulation_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_module_notes`
--

DROP TABLE IF EXISTS `student_module_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_module_notes` (
  `student_id` int(11) NOT NULL,
  `module_key` varchar(80) NOT NULL,
  `note_text` text NOT NULL,
  `date_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`student_id`,`module_key`),
  CONSTRAINT `fk_notes_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_module_notes`
--

LOCK TABLES `student_module_notes` WRITE;
/*!40000 ALTER TABLE `student_module_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_module_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_module_progress`
--

DROP TABLE IF EXISTS `student_module_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_module_progress` (
  `progress_id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `module_key` varchar(80) NOT NULL,
  `progress_percent` tinyint(3) NOT NULL DEFAULT 0,
  `date_updated` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`progress_id`),
  UNIQUE KEY `student_module` (`student_id`,`module_key`),
  KEY `idx_student_prog` (`student_id`),
  KEY `idx_student_id` (`student_id`),
  CONSTRAINT `fk_progress_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_module_progress`
--

LOCK TABLES `student_module_progress` WRITE;
/*!40000 ALTER TABLE `student_module_progress` DISABLE KEYS */;
INSERT INTO `student_module_progress` VALUES (2,3,'mod_progress_batterymodule',100,'2026-11-03 23:28:43'),(3,3,'mod_progress_brakemodule',100,'2026-11-03 23:27:56'),(4,3,'mod_progress_enginemodule',100,'2026-11-03 23:21:49'),(5,3,'mod_progress_airmodule',100,'2026-11-03 23:28:16'),(6,3,'mod_progress_fuelmodule',100,'2026-11-03 23:28:28'),(7,3,'mod_progress_sparkmodule',100,'2026-11-03 23:44:02');
/*!40000 ALTER TABLE `student_module_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `student_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `section` varchar(50) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (3,'Albea','Pallado','aiapallado@gmail.com','$2y$10$JXJME58wHNsXqMPzUjLkhe0vVOMI5ADKwv0l3tNRW/9vv6E1oTPny','B','2026-10-06 01:52:01');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_vehicle_parts_system_settings`
--

DROP TABLE IF EXISTS `users_vehicle_parts_system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users_vehicle_parts_system_settings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL DEFAULT 1,
  `module_type` varchar(100) NOT NULL,
  `module_name` varchar(150) NOT NULL,
  `details` longtext DEFAULT NULL,
  `date_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `module_type` (`module_type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_vehicle_parts_system_settings`
--

LOCK TABLES `users_vehicle_parts_system_settings` WRITE;
/*!40000 ALTER TABLE `users_vehicle_parts_system_settings` DISABLE KEYS */;
INSERT INTO `users_vehicle_parts_system_settings` VALUES (1,1,'platform_settings','Platform Settings','{\"platform_name\":\"MotoMaster LMS\",\"support_email\":\"support@motomaster.edu\",\"default_language\":\"English (Philippines)\",\"max_upload_size\":\"50MB\"}','2026-10-06 01:46:23'),(2,1,'notification_alert_preferences','Notification Alert Preferences','{\"failed_login_alerts\":true,\"student_progress_alerts\":true,\"assessment_failures\":true,\"new_registrations\":true,\"backup_status\":true,\"report_ready\":true,\"channel_in_app\":true,\"channel_email\":true}','2026-10-06 01:46:23');
/*!40000 ALTER TABLE `users_vehicle_parts_system_settings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-04  0:43:12
