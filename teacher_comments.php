<?php
header('Content-Type: application/json');
require_once __DIR__ . '/auth_session.php';

// Verify teacher session
motoMasterStartSession();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'Teacher' || empty($_SESSION['teacher_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied: Teachers only']);
    exit;
}

$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '';
$dbName = 'motomaster';

$mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// Auto-create the comments table if it does not exist yet
$mysqli->query(
    "CREATE TABLE IF NOT EXISTS simulation_comments (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
);

$teacherId = (int) $_SESSION['teacher_id'];
$teacherName = isset($_SESSION['teacher_name']) ? trim($_SESSION['teacher_name']) : 'Instructor';
if ($teacherName === '') {
    $teacherName = 'Instructor';
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = isset($_GET['action']) ? trim($_GET['action']) : 'list';

function formatCommentDate($dateStr) {
    if (!$dateStr) return '';
    $time = strtotime($dateStr);
    if (!$time) return $dateStr;
    $diff = time() - $time;
    if ($diff < 60) return 'Just now';
    if ($diff < 3600) return round($diff / 60) . 'm ago';
    if ($diff < 86400) return round($diff / 3600) . 'h ago';
    if ($diff < 172800) return 'Yesterday';
    return date('M d, Y', $time);
}

// LIST comments for a specific student's work
if ($action === 'list' && $method === 'GET') {
    $workType = isset($_GET['work_type']) ? trim($_GET['work_type']) : '';
    $studentId = isset($_GET['student_id']) ? (int) $_GET['student_id'] : 0;
    $moduleTitle = isset($_GET['module_title']) ? trim($_GET['module_title']) : '';

    if ($workType === '' || $studentId <= 0 || $moduleTitle === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'work_type, student_id and module_title are required']);
        exit;
    }

    $stmt = $mysqli->prepare(
        'SELECT comment_id, teacher_id, teacher_name, comment_text, created_at
         FROM simulation_comments
         WHERE work_type = ? AND student_id = ? AND module_title = ?
         ORDER BY created_at ASC'
    );
    $stmt->bind_param('sis', $workType, $studentId, $moduleTitle);
    $stmt->execute();
    $result = $stmt->get_result();

    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = [
            'comment_id' => (int) $row['comment_id'],
            'teacher_id' => (int) $row['teacher_id'],
            'teacher_name' => $row['teacher_name'],
            'comment_text' => $row['comment_text'],
            'created_at' => $row['created_at'],
            'created_display' => formatCommentDate($row['created_at']),
            'is_own' => ((int) $row['teacher_id'] === $teacherId)
        ];
    }
    $stmt->close();

    echo json_encode([
        'success' => true,
        'comments' => $comments,
        'count' => count($comments)
    ]);
    $mysqli->close();
    exit;
}

// COUNT comments grouped per student's work (for badges on the lists)
if ($action === 'counts' && $method === 'GET') {
    $workType = isset($_GET['work_type']) ? trim($_GET['work_type']) : '';

    if ($workType === '') {
        $stmt = $mysqli->prepare(
            'SELECT work_type, student_id, module_title, COUNT(*) AS cnt
             FROM simulation_comments GROUP BY work_type, student_id, module_title'
        );
        $stmt->execute();
    } else {
        $stmt = $mysqli->prepare(
            'SELECT work_type, student_id, module_title, COUNT(*) AS cnt
             FROM simulation_comments WHERE work_type = ? GROUP BY work_type, student_id, module_title'
        );
        $stmt->bind_param('s', $workType);
        $stmt->execute();
    }

    $result = $stmt->get_result();
    $counts = [];
    while ($row = $result->fetch_assoc()) {
        $key = $row['work_type'] . '|' . $row['student_id'] . '|' . $row['module_title'];
        $counts[$key] = (int) $row['cnt'];
    }
    $stmt->close();

    echo json_encode(['success' => true, 'counts' => $counts]);
    $mysqli->close();
    exit;
}

// ADD a new comment
if ($action === 'add' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $workType = isset($input['work_type']) ? trim($input['work_type']) : '';
    $workId = isset($input['work_id']) ? (int) $input['work_id'] : null;
    $studentId = isset($input['student_id']) ? (int) $input['student_id'] : 0;
    $moduleTitle = isset($input['module_title']) ? trim($input['module_title']) : '';
    $commentText = isset($input['comment']) ? trim($input['comment']) : '';

    if (!in_array($workType, ['practice', 'assessment'], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid work_type']);
        exit;
    }
    if ($studentId <= 0 || $moduleTitle === '' || $commentText === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'student_id, module_title and comment are required']);
        exit;
    }

    // Verify the student exists
    $check = $mysqli->prepare('SELECT student_id FROM students WHERE student_id = ? LIMIT 1');
    $check->bind_param('i', $studentId);
    $check->execute();
    $check->store_result();
    if ($check->num_rows === 0) {
        $check->close();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Student not found']);
        exit;
    }
    $check->close();

    $ins = $mysqli->prepare(
        'INSERT INTO simulation_comments (work_type, work_id, student_id, module_title, teacher_id, teacher_name, comment_text)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $ins->bind_param('siisiss', $workType, $workId, $studentId, $moduleTitle, $teacherId, $teacherName, $commentText);
    $ok = $ins->execute();
    $newId = $ins->insert_id;
    $ins->close();

    if (!$ok) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save comment']);
        $mysqli->close();
        exit;
    }

    echo json_encode([
        'success' => true,
        'comment' => [
            'comment_id' => (int) $newId,
            'teacher_id' => $teacherId,
            'teacher_name' => $teacherName,
            'comment_text' => $commentText,
            'created_at' => date('Y-m-d H:i:s'),
            'created_display' => 'Just now',
            'is_own' => true
        ]
    ]);
    $mysqli->close();
    exit;
}

// DELETE a comment (only own comments)
if ($action === 'delete' && $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    $commentId = isset($input['comment_id']) ? (int) $input['comment_id'] : 0;
    if ($commentId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'comment_id is required']);
        exit;
    }

    $del = $mysqli->prepare('DELETE FROM simulation_comments WHERE comment_id = ? AND teacher_id = ?');
    $del->bind_param('ii', $commentId, $teacherId);
    $del->execute();
    $deleted = $del->affected_rows;
    $del->close();

    if ($deleted <= 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Comment not found or not yours']);
        $mysqli->close();
        exit;
    }

    echo json_encode(['success' => true, 'deleted' => $commentId]);
    $mysqli->close();
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Unknown action']);
$mysqli->close();
