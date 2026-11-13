<?php
header('Content-Type: application/json');
require_once __DIR__ . '/auth_session.php';

$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '';
$dbName = 'motomaster';

$mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

// Log input for debugging
error_log("Save simulation input: " . json_encode($input));

// Try to get student_id from PHP session first
motoMasterStartSession();
$studentId = null;
if (isset($_SESSION['role']) && $_SESSION['role'] === 'Student' && !empty($_SESSION['student_id'])) {
    $studentId = (int) $_SESSION['student_id'];
    error_log("Got student_id from session: " . $studentId);
}

// Fallback: student_id from request body (used when PHP session is unavailable)
if (!$studentId) {
    $studentId = isset($input['student_id']) ? (int) $input['student_id'] : null;

    if (!$studentId && isset($input['student']) && is_array($input['student'])) {
        $studentId = isset($input['student']['student_id']) ? (int) $input['student']['student_id'] : null;
    }
}

if (!$studentId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required - no student ID found']);
    exit;
}

$title = isset($input['title']) ? trim($input['title']) : 'Battery Maintenance';
$score = isset($input['score']) ? (float) $input['score'] : 0;
$completionStatus = isset($input['completion_status']) ? trim($input['completion_status']) : 'Completed';
$steps = isset($input['steps']) && is_array($input['steps']) ? $input['steps'] : [];
$timeElapsed = isset($input['time_elapsed_seconds']) ? (int) $input['time_elapsed_seconds'] : 0;
$currentStepIndex = isset($input['current_step_index']) ? (int) $input['current_step_index'] : null;
$stepInstrDone = isset($input['step_instr_done']) ? $input['step_instr_done'] : null;
$batteryNeedsReplacement = isset($input['battery_needs_replacement']) ? (bool) $input['battery_needs_replacement'] : null;
$sceneState = isset($input['scene_state']) ? $input['scene_state'] : null;

error_log("Saving simulation - student_id: $studentId, title: $title, score: $score, status: $completionStatus");

if ($title === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Simulation title is required']);
    exit;
}

$payload = [
    'time_elapsed_seconds' => $timeElapsed,
    'steps' => $steps,
    'saved_at' => date('c'),
    'current_step_index' => $currentStepIndex,
    'step_instr_done' => $stepInstrDone,
    'battery_needs_replacement' => $batteryNeedsReplacement,
    'scene_state' => $sceneState,
];
$description = json_encode($payload, JSON_UNESCAPED_UNICODE);
if ($description === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid step data']);
    exit;
}

$existingId = null;
$find = $mysqli->prepare(
    "SELECT simulation_id FROM simulation
     WHERE student_id = ? AND title = ? AND completion_status <> 'Locked'
     ORDER BY simulation_id DESC LIMIT 1"
);
$find->bind_param('is', $studentId, $title);
$find->execute();
$find->bind_result($existingId);
$find->fetch();
$find->close();

if ($existingId !== null) {
    error_log("Updating existing simulation_id: $existingId");
    $upd = $mysqli->prepare(
        'UPDATE simulation
         SET description = ?, date_attempted = NOW(), completion_status = ?, score = ?
         WHERE simulation_id = ? AND student_id = ?'
    );
    $upd->bind_param('ssdii', $description, $completionStatus, $score, $existingId, $studentId);
    $ok = $upd->execute();
    $simulationId = $existingId;
    $upd->close();
} else {
    $nextId = 1;
    $res = $mysqli->query('SELECT COALESCE(MAX(simulation_id), 0) + 1 AS next_id FROM simulation');
    if ($res) {
        $row = $res->fetch_assoc();
        $nextId = (int) $row['next_id'];
        $res->free();
    }

    error_log("Inserting new simulation_id: $nextId");
    $ins = $mysqli->prepare(
        'INSERT INTO simulation (simulation_id, student_id, title, description, date_attempted, completion_status, score)
         VALUES (?, ?, ?, ?, NOW(), ?, ?)'
    );
    $ins->bind_param('iisssd', $nextId, $studentId, $title, $description, $completionStatus, $score);
    $ok = $ins->execute();
    $simulationId = $nextId;
    $ins->close();
}

if (!$ok) {
    $error = $mysqli->error;
    error_log("Failed to save simulation: " . $error);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save simulation results: ' . $error]);
    $mysqli->close();
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Simulation results saved',
    'simulation_id' => $simulationId,
    'student_id' => $studentId,
]);

$mysqli->close();
