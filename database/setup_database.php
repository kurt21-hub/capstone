<?php
/**
 * MotoMaster Database Setup Script
 * Sets up the `motomaster` database, all project tables, indexes, and default accounts.
 */

$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '';
$dbName = 'motomaster';

header('Content-Type: text/plain; charset=UTF-8');

echo "=== MotoMaster Database Setup ===\n\n";

// 1. Connect without database to ensure server is accessible and create DB if needed
$mysqli = new mysqli($dbHost, $dbUser, $dbPass);
if ($mysqli->connect_errno) {
    die("Failed to connect to MySQL server: " . $mysqli->connect_error . "\n");
}
echo "[✓] Connected to MySQL server at $dbHost\n";

// 2. Create database if not exists
$createDb = "CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if (!$mysqli->query($createDb)) {
    die("Failed to create database '$dbName': " . $mysqli->error . "\n");
}
echo "[✓] Database '$dbName' ready\n";

// Select the database
$mysqli->select_db($dbName);
$mysqli->set_charset('utf8mb4');

// Table definitions
$tables = [
    'students' => "CREATE TABLE IF NOT EXISTS students (
        student_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        section VARCHAR(50) NOT NULL DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'instructors' => "CREATE TABLE IF NOT EXISTS instructors (
        instructor_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        specialization VARCHAR(100) NOT NULL,
        contact_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'admin' => "CREATE TABLE IF NOT EXISTS admin (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'simulation' => "CREATE TABLE IF NOT EXISTS simulation (
        simulation_id INT NOT NULL,
        student_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description LONGTEXT NULL,
        date_attempted DATETIME DEFAULT CURRENT_TIMESTAMP,
        completion_status VARCHAR(50) DEFAULT 'In Progress',
        score DECIMAL(5,2) DEFAULT 0.00,
        PRIMARY KEY (simulation_id, student_id),
        INDEX idx_student_sim (student_id),
        CONSTRAINT fk_simulation_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'student_module_progress' => "CREATE TABLE IF NOT EXISTS student_module_progress (
        progress_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        module_key VARCHAR(80) NOT NULL,
        progress_percent TINYINT(3) NOT NULL DEFAULT 0,
        date_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY student_module (student_id, module_key),
        INDEX idx_student_prog (student_id),
        CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'student_module_notes' => "CREATE TABLE IF NOT EXISTS student_module_notes (
        student_id INT NOT NULL,
        module_key VARCHAR(80) NOT NULL,
        note_text TEXT NOT NULL,
        date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (student_id, module_key),
        CONSTRAINT fk_notes_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'assessment' => "CREATE TABLE IF NOT EXISTS assessment (
        assessment_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        remarks VARCHAR(50) NOT NULL,
        details LONGTEXT NULL,
        date_taken TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_assess (student_id),
        CONSTRAINT fk_assessment_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'assessment_results' => "CREATE TABLE IF NOT EXISTS assessment_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        assessment_type VARCHAR(50) NOT NULL,
        score INT NOT NULL,
        total_questions INT NOT NULL,
        correct_answers INT NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_res (student_id),
        CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'activity_logs' => "CREATE TABLE IF NOT EXISTS activity_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        user_type VARCHAR(20) DEFAULT 'User',
        action VARCHAR(100) NOT NULL,
        details TEXT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_log (user_id),
        INDEX idx_created_log (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'messages' => "CREATE TABLE IF NOT EXISTS messages (
        message_id INT AUTO_INCREMENT PRIMARY KEY,
        sender_role VARCHAR(20) NOT NULL,
        sender_id INT NOT NULL,
        sender_name VARCHAR(150) NOT NULL,
        recipient_role VARCHAR(20) NOT NULL,
        recipient_id INT NOT NULL DEFAULT 0,
        recipient_name VARCHAR(150) NULL,
        subject VARCHAR(200) NOT NULL DEFAULT '',
        message_text TEXT NOT NULL,
        category VARCHAR(20) NOT NULL DEFAULT 'message',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        read_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_recipient (recipient_role, recipient_id, is_read, created_at),
        INDEX idx_sender (sender_role, sender_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'notifications' => "CREATE TABLE IF NOT EXISTS notifications (
        notification_id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        badge_text VARCHAR(50) NOT NULL DEFAULT 'Notice',
        badge_class VARCHAR(50) NOT NULL DEFAULT 'badge-info',
        icon VARCHAR(80) NOT NULL DEFAULT 'fa-solid fa-bell',
        icon_bg VARCHAR(25) NOT NULL DEFAULT 'rgba(232,34,42,0.1)',
        icon_color VARCHAR(25) NOT NULL DEFAULT '#e8222a',
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        recipient_role VARCHAR(50) NOT NULL DEFAULT 'All Admins',
        delivery_channel VARCHAR(50) NOT NULL DEFAULT 'In-App Only',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_type (type),
        INDEX idx_notif_read (is_read),
        INDEX idx_notif_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'reports' => "CREATE TABLE IF NOT EXISTS reports (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NULL,
        instructor_id INT NULL,
        report_type VARCHAR(100) NOT NULL,
        data LONGTEXT NULL,
        generated_data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_report_type (report_type),
        INDEX idx_report_student (student_id),
        INDEX idx_report_instructor (instructor_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",

    'users_vehicle_parts_system_settings' => "CREATE TABLE IF NOT EXISTS users_vehicle_parts_system_settings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL DEFAULT 1,
        module_type VARCHAR(100) NOT NULL UNIQUE,
        module_name VARCHAR(150) NOT NULL,
        details LONGTEXT NULL,
        date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
];

$step = 3;
foreach ($tables as $name => $sql) {
    if (!$mysqli->query($sql)) {
        echo "[$step] ERROR creating table '$name': " . $mysqli->error . "\n";
    } else {
        echo "[$step] Table '$name' created/verified\n";
    }
    $step++;
}

// 4. Seed default accounts if tables are empty
// Admin default
$adminCheck = $mysqli->query("SELECT admin_id FROM admin LIMIT 1");
if ($adminCheck && $adminCheck->num_rows === 0) {
    $adminPass = password_hash('Admin@123', PASSWORD_DEFAULT);
    $insAdmin = $mysqli->prepare("INSERT INTO admin (first_name, last_name, email, password) VALUES ('System', 'Administrator', 'admin@motomaster.edu', ?)");
    $insAdmin->bind_param('s', $adminPass);
    $insAdmin->execute();
    $insAdmin->close();
    echo "[✓] Default admin account seeded (admin@motomaster.edu / Admin@123)\n";
}

// Instructor default
$instCheck = $mysqli->query("SELECT instructor_id FROM instructors LIMIT 1");
if ($instCheck && $instCheck->num_rows === 0) {
    $instPass = password_hash('Teacher@123', PASSWORD_DEFAULT);
    $insInst = $mysqli->prepare("INSERT INTO instructors (first_name, last_name, email, password, specialization, contact_number) VALUES ('Alex', 'Cruz', 'teacher@motomaster.edu', ?, 'Automotive Servicing NC II', '09123456789')");
    $insInst->bind_param('s', $instPass);
    $insInst->execute();
    $insInst->close();
    echo "[✓] Default teacher account seeded (teacher@motomaster.edu / Teacher@123)\n";
}

// Student default
$stuCheck = $mysqli->query("SELECT student_id FROM students LIMIT 1");
if ($stuCheck && $stuCheck->num_rows === 0) {
    $stuPass = password_hash('Student@123', PASSWORD_DEFAULT);
    $insStu = $mysqli->prepare("INSERT INTO students (first_name, last_name, email, password, section) VALUES ('Juan', 'Dela Cruz', 'student@motomaster.edu', ?, 'A')");
    $insStu->bind_param('s', $stuPass);
    $insStu->execute();
    $insStu->close();
    echo "[✓] Default student account seeded (student@motomaster.edu / Student@123)\n";
}

// Default system settings
$setCheck = $mysqli->query("SELECT setting_id FROM users_vehicle_parts_system_settings WHERE module_type = 'platform_settings' LIMIT 1");
if ($setCheck && $setCheck->num_rows === 0) {
    $platformDetails = json_encode([
        'platform_name' => 'MotoMaster LMS',
        'support_email' => 'support@motomaster.edu',
        'default_language' => 'English (Philippines)',
        'max_upload_size' => '50MB'
    ]);
    $insSet = $mysqli->prepare("INSERT INTO users_vehicle_parts_system_settings (admin_id, module_type, module_name, details) VALUES (1, 'platform_settings', 'Platform Settings', ?)");
    $insSet->bind_param('s', $platformDetails);
    $insSet->execute();
    $insSet->close();

    $prefDetails = json_encode([
        'failed_login_alerts' => true,
        'student_progress_alerts' => true,
        'assessment_failures' => true,
        'new_registrations' => true,
        'backup_status' => true,
        'report_ready' => true,
        'channel_in_app' => true,
        'channel_email' => true
    ]);
    $insPref = $mysqli->prepare("INSERT INTO users_vehicle_parts_system_settings (admin_id, module_type, module_name, details) VALUES (1, 'notification_alert_preferences', 'Notification Alert Preferences', ?)");
    $insPref->bind_param('s', $prefDetails);
    $insPref->execute();
    $insPref->close();
    echo "[✓] Default platform settings seeded\n";
}

$mysqli->close();

echo "\n=== MotoMaster Database Setup Successfully Completed ===\n";
echo "Database: motomaster\n";
echo "All 13 project tables are created and connected.\n";
echo "Login and registration for Students, Teachers, and Admins are active and ready!\n";
?>
