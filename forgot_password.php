<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$mysqli = motoMasterGetDbConnection();

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$action = isset($input['action']) ? $input['action'] : '';
$role = isset($input['role']) ? $input['role'] : '';
$email = isset($input['email']) ? trim($input['email']) : '';

$table = null;
if ($role === 'student') {
    $table = 'students';
} elseif ($role === 'teacher') {
    $table = 'instructors';
}

if ($table === null) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid role']);
    exit;
}

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email']);
    exit;
}

$check = $mysqli->prepare("SELECT 1 FROM `$table` WHERE email = ? LIMIT 1");
$check->bind_param('s', $email);
$check->execute();
$check->store_result();
$found = $check->num_rows > 0;
$check->close();

if (!$found) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'No account found with that email.']);
    $mysqli->close();
    exit;
}

if ($action === 'check') {
    echo json_encode(['success' => true, 'message' => 'Email verified']);
    $mysqli->close();
    exit;
}

if ($action === 'reset') {
    $password = isset($input['password']) ? $input['password'] : '';
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters.']);
        $mysqli->close();
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $mysqli->prepare("UPDATE `$table` SET password = ? WHERE email = ?");
    $stmt->bind_param('ss', $hash, $email);
    $stmt->execute();
    $stmt->close();

    echo json_encode(['success' => true, 'message' => 'Password updated']);
    $mysqli->close();
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action']);
$mysqli->close();
?>
