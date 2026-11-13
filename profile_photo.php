<?php
header('Content-Type: application/json');
require_once __DIR__ . '/auth_session.php';

$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '';
$dbName = 'motomaster';

const DEFAULT_PROFILE_PHOTO = 'images/userprofile.jpg';
const MAX_PHOTO_BYTES = 5242880; // 5 MB

$ROLE_TABLES = [
    'Student' => ['table' => 'students', 'id' => 'student_id', 'prefix' => 'student'],
    'Teacher' => ['table' => 'instructors', 'id' => 'instructor_id', 'prefix' => 'teacher'],
    'Admin' => ['table' => 'admin', 'id' => 'admin_id', 'prefix' => 'admin'],
];

function photoFail(string $message, int $statusCode = 400): void
{
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

$user = motoMasterRequireAuthenticatedUser();
$roleCfg = $ROLE_TABLES[$user['role']] ?? null;
if (!$roleCfg) {
    photoFail('Unsupported role', 403);
}

$mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
if ($mysqli->connect_errno) {
    photoFail('Database connection failed', 500);
}
$mysqli->set_charset('utf8mb4');

$table = $roleCfg['table'];
$idColumn = $roleCfg['id'];
$userId = (int) $user['user_id'];

motoMasterEnsureProfilePhotoColumn($mysqli, $table);

function getStoredPhoto(mysqli $mysqli, string $table, string $idColumn, int $userId): ?string
{
    $stmt = $mysqli->prepare("SELECT profile_photo FROM {$table} WHERE {$idColumn} = ? LIMIT 1");
    if (!$stmt) {
        return null;
    }
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stmt->bind_result($photo);
    $found = $stmt->fetch();
    $stmt->close();
    if (!$found || $photo === null || $photo === '') {
        return null;
    }
    return $photo;
}

function getStoredNames(mysqli $mysqli, string $table, string $idColumn, int $userId): ?array
{
    $stmt = $mysqli->prepare("SELECT first_name, last_name FROM {$table} WHERE {$idColumn} = ? LIMIT 1");
    if (!$stmt) {
        return null;
    }
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $stmt->bind_result($firstName, $lastName);
    $found = $stmt->fetch();
    $stmt->close();
    if (!$found) {
        return null;
    }
    return [
        'first_name' => $firstName ?? '',
        'last_name' => $lastName ?? '',
    ];
}

function deleteUploadedPhotos(string $prefix, int $userId, string $keepFilename = ''): void
{
    $dir = __DIR__ . '/uploads/avatars';
    foreach (glob($dir . '/' . $prefix . '_' . $userId . '_*.*') ?: [] as $old) {
        if (is_file($old) && basename($old) !== $keepFilename) {
            @unlink($old);
        }
    }
}

function saveStoredPhoto(mysqli $mysqli, string $table, string $idColumn, int $userId, ?string $photo): bool
{
    $stmt = $mysqli->prepare("UPDATE {$table} SET profile_photo = ? WHERE {$idColumn} = ?");
    if (!$stmt) {
        return false;
    }
    $stmt->bind_param('si', $photo, $userId);
    $ok = $stmt->execute();
    $stmt->close();
    return $ok;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $photo = getStoredPhoto($mysqli, $table, $idColumn, $userId) ?: DEFAULT_PROFILE_PHOTO;
    $names = getStoredNames($mysqli, $table, $idColumn, $userId) ?: ['first_name' => '', 'last_name' => ''];
    echo json_encode([
        'success' => true,
        'profile_photo' => $photo,
        'is_default' => $photo === DEFAULT_PROFILE_PHOTO,
        'first_name' => $names['first_name'],
        'last_name' => $names['last_name'],
        'name' => trim($names['first_name'] . ' ' . $names['last_name']),
    ]);
    $mysqli->close();
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Reset back to the default photo
    if (is_array($input) && ($input['action'] ?? '') === 'reset') {
        deleteUploadedPhotos($roleCfg['prefix'], $userId);
        saveStoredPhoto($mysqli, $table, $idColumn, $userId, null);
        echo json_encode([
            'success' => true,
            'profile_photo' => DEFAULT_PROFILE_PHOTO,
            'is_default' => true,
        ]);
        $mysqli->close();
        exit;
    }

    if (empty($_FILES['photo']) || !is_uploaded_file($_FILES['photo']['tmp_name'])) {
        photoFail('No photo uploaded');
    }
    if (($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        photoFail('Photo upload failed');
    }
    if ($_FILES['photo']['size'] > MAX_PHOTO_BYTES) {
        photoFail('Photo is too large (max 5 MB)');
    }

    $mime = '';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = (string) finfo_file($finfo, $_FILES['photo']['tmp_name']);
        finfo_close($finfo);
    } else {
        $mime = (string) ($_FILES['photo']['type'] ?? '');
    }

    $extByMime = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];
    if (!isset($extByMime[$mime])) {
        photoFail('Only JPG, PNG, GIF, or WebP images are allowed');
    }
    $ext = $extByMime[$mime];

    $uploadDir = __DIR__ . '/uploads/avatars';
    if (!is_dir($uploadDir) && !@mkdir($uploadDir, 0775, true)) {
        photoFail('Could not create upload directory', 500);
    }

    $filename = $roleCfg['prefix'] . '_' . $userId . '_' . time() . '.' . $ext;
    $dest = $uploadDir . '/' . $filename;
    if (!move_uploaded_file($_FILES['photo']['tmp_name'], $dest)) {
        photoFail('Could not save uploaded photo', 500);
    }

    deleteUploadedPhotos($roleCfg['prefix'], $userId, $filename); // keep only the newest
    $relativePath = 'uploads/avatars/' . $filename;

    if (!saveStoredPhoto($mysqli, $table, $idColumn, $userId, $relativePath)) {
        @unlink($dest);
        photoFail('Could not save photo reference', 500);
    }

    echo json_encode([
        'success' => true,
        'profile_photo' => $relativePath,
        'is_default' => false,
    ]);
    $mysqli->close();
    exit;
}

photoFail('Method not allowed', 405);
