<?php
header('Content-Type: application/json; charset=utf-8');

$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '';
$dbName = 'motomaster';

$mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);

if ($mysqli->connect_errno) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $mysqli->connect_error]);
    exit;
}

// Try to insert a test record
$testTitle = 'Test Battery Maintenance';
$testScore = 85.5;
$testStatus = 'Completed';
$testSteps = json_encode([
    ['title' => 'Step 1', 'correct' => ['Task A'], 'mistakes' => [], 'score' => 100],
    ['title' => 'Step 2', 'correct' => ['Task B'], 'mistakes' => [], 'score' => 100]
]);

$testPayload = [
    'time_elapsed_seconds' => 120,
    'steps' => json_decode($testSteps, true),
    'saved_at' => date('c')
];
$testDescription = json_encode($testPayload, JSON_UNESCAPED_UNICODE);

// Use student_id = 1 for testing (assuming there's a student with ID 1)
$testStudentId = 1;

// Check if student exists
$checkStudent = $mysqli->prepare("SELECT student_id FROM students WHERE student_id = ?");
$checkStudent->bind_param('i', $testStudentId);
$checkStudent->execute();
$checkStudent->store_result();

if ($checkStudent->num_rows == 0) {
    echo json_encode(['success' => false, 'message' => 'Test student (ID 1) does not exist. Please create a student account first.']);
    $checkStudent->close();
    $mysqli->close();
    exit;
}
$checkStudent->close();

// Delete any existing test record for this student
$deleteTest = $mysqli->prepare("DELETE FROM simulation WHERE student_id = ? AND title = ?");
$deleteTest->bind_param('is', $testStudentId, $testTitle);
$deleteTest->execute();
$deleteTest->close();

// Insert test record
$insert = $mysqli->prepare(
    'INSERT INTO simulation (simulation_id, student_id, title, description, date_attempted, completion_status, score)
     VALUES (?, ?, ?, ?, NOW(), ?, ?)'
);

$testSimId = 999; // Use a fixed test ID
$insert->bind_param('iisssd', $testSimId, $testStudentId, $testTitle, $testDescription, $testStatus, $testScore);

if ($insert->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Test record inserted successfully',
        'simulation_id' => $testSimId,
        'student_id' => $testStudentId,
        'title' => $testTitle,
        'score' => $testScore
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to insert test record: ' . $mysqli->error
    ]);
}

$insert->close();
$mysqli->close();
?>
