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

// Check if simulation table exists
$checkTable = $mysqli->query("SHOW TABLES LIKE 'simulation'");
if ($checkTable->num_rows == 0) {
    echo json_encode(['success' => false, 'message' => 'Simulation table does not exist']);
    exit;
}

// Check table structure
$structure = $mysqli->query("DESCRIBE simulation");
$columns = [];
while ($row = $structure->fetch_assoc()) {
    $columns[] = $row;
}

// Count records in simulation table
$countQuery = $mysqli->query("SELECT COUNT(*) as total FROM simulation");
$count = $countQuery->fetch_assoc();

// Get recent records
$recentQuery = $mysqli->query("SELECT simulation_id, student_id, title, score, completion_status, date_attempted FROM simulation ORDER BY date_attempted DESC LIMIT 5");
$recent = [];
while ($row = $recentQuery->fetch_assoc()) {
    $recent[] = $row;
}

echo json_encode([
    'success' => true,
    'message' => 'Simulation table exists',
    'table_structure' => $columns,
    'total_records' => $count['total'],
    'recent_records' => $recent
]);

$mysqli->close();
?>
