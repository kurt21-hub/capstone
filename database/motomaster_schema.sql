-- MotoMaster Database Schema
-- Database: motomaster

CREATE DATABASE IF NOT EXISTS motomaster CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE motomaster;

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    section VARCHAR(50) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Instructors (Teachers) Table
CREATE TABLE IF NOT EXISTS instructors (
    instructor_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    contact_number VARCHAR(30) NOT NULL DEFAULT '',
    timezone VARCHAR(60) NOT NULL DEFAULT 'Asia/Manila (UTC+8)',
    bio TEXT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'Super Admin',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Simulation Table (3D Practice Simulations)
CREATE TABLE IF NOT EXISTS simulation (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Student Module Progress Table
CREATE TABLE IF NOT EXISTS student_module_progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    module_key VARCHAR(80) NOT NULL,
    progress_percent TINYINT(3) NOT NULL DEFAULT 0,
    date_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY student_module (student_id, module_key),
    INDEX idx_student_prog (student_id),
    CONSTRAINT fk_progress_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Student Module Notes Table
CREATE TABLE IF NOT EXISTS student_module_notes (
    student_id INT NOT NULL,
    module_key VARCHAR(80) NOT NULL,
    note_text TEXT NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, module_key),
    CONSTRAINT fk_notes_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Assessment Table (3D Assessment Area Simulations)
CREATE TABLE IF NOT EXISTS assessment (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Assessment Results Table (Quizzes / Legacy Assessments)
CREATE TABLE IF NOT EXISTS assessment_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    correct_answers INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_res (student_id),
    CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_type VARCHAR(20) DEFAULT 'User',
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_log (user_id),
    INDEX idx_created_log (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Messages Table
CREATE TABLE IF NOT EXISTS messages (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Reports Table
CREATE TABLE IF NOT EXISTS reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NULL,
    instructor_id INT NULL,
    report_type VARCHAR(100) NOT NULL,
    data LONGTEXT NULL,
    generated_data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_report_type (report_type),
    INDEX idx_report_student (student_id),
    INDEX idx_report_instructor (instructor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Simulation Comments Table (Instructor feedback on student work)
CREATE TABLE IF NOT EXISTS simulation_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    work_type VARCHAR(20) NOT NULL,
    work_id INT NULL,
    student_id INT NOT NULL,
    module_title VARCHAR(200) NOT NULL,
    teacher_id INT NOT NULL,
    teacher_name VARCHAR(150) NOT NULL DEFAULT '',
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_comment_work (work_type, student_id, module_title),
    INDEX idx_comment_student (student_id),
    INDEX idx_comment_teacher (teacher_id),
    CONSTRAINT fk_comment_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. System Settings Table
CREATE TABLE IF NOT EXISTS users_vehicle_parts_system_settings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL DEFAULT 1,
    module_type VARCHAR(100) NOT NULL UNIQUE,
    module_name VARCHAR(150) NOT NULL,
    details LONGTEXT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
