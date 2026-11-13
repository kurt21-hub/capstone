<?php
header('Content-Type: application/json');
require_once __DIR__ . '/auth_session.php';
require_once __DIR__ . '/google_config.php';

motoMasterStartSession();

function googleAuthFail(string $message, int $statusCode = 400): void
{
    http_response_code($statusCode);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

function googleAuthHttpGet(string $url): ?string
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $body = curl_exec($ch);
        $ok = curl_errno($ch) === 0;
        curl_close($ch);
        return ($ok && is_string($body)) ? $body : null;
    }

    $ctx = stream_context_create(['http' => ['timeout' => 10]]);
    $body = @file_get_contents($url, false, $ctx);
    return is_string($body) ? $body : null;
}

/**
 * Google's public signing certificates (PEM keyed by kid), cached for 1h.
 */
function googleAuthCerts(bool $refresh = false): array
{
    $cacheFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'motomaster_google_certs.json';
    $cached = [];
    $mtime = 0;
    if (is_file($cacheFile)) {
        $mtime = (int) @filemtime($cacheFile);
        $decoded = json_decode((string) @file_get_contents($cacheFile), true);
        if (is_array($decoded)) {
            $cached = $decoded;
        }
    }

    if (!$refresh && $cached && (time() - $mtime) < 3600) {
        return $cached;
    }

    $body = googleAuthHttpGet('https://www.googleapis.com/oauth2/v1/certs');
    $fresh = $body ? json_decode($body, true) : null;
    if (is_array($fresh) && $fresh) {
        @file_put_contents($cacheFile, json_encode($fresh));
        return $fresh;
    }

    return $cached;
}

function googleAuthB64Decode(string $segment): ?string
{
    $remainder = strlen($segment) % 4;
    if ($remainder) {
        $segment .= str_repeat('=', 4 - $remainder);
    }
    $out = base64_decode(strtr($segment, '-_', '+/'), true);
    return $out === false ? null : $out;
}

/**
 * Verifies a Google ID token (JWT) locally against Google's public certs.
 * Returns the verified profile on success, exits with JSON error otherwise.
 */
function googleAuthVerifyIdToken(string $idToken): array
{
    $parts = explode('.', $idToken);
    if (count($parts) !== 3) {
        googleAuthFail('Invalid Google credential', 401);
    }
    [$h, $p, $s] = $parts;

    $header = json_decode((string) googleAuthB64Decode($h), true);
    $payload = json_decode((string) googleAuthB64Decode($p), true);
    $signature = googleAuthB64Decode($s);

    if (!is_array($header) || !is_array($payload) || $signature === null) {
        googleAuthFail('Invalid Google credential', 401);
    }
    if (($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) {
        googleAuthFail('Unsupported Google credential', 401);
    }

    $certs = googleAuthCerts();
    $cert = $certs[$header['kid']] ?? null;
    if ($cert === null) {
        $certs = googleAuthCerts(true);
        $cert = $certs[$header['kid']] ?? null;
    }
    if ($cert === null) {
        googleAuthFail('Could not verify Google credential', 401);
    }

    $verified = openssl_verify($h . '.' . $p, $signature, $cert, OPENSSL_ALGO_SHA256);
    if ($verified !== 1) {
        googleAuthFail('Invalid Google credential signature', 401);
    }

    $iss = (string) ($payload['iss'] ?? '');
    if (!in_array($iss, ['accounts.google.com', 'https://accounts.google.com'], true)) {
        googleAuthFail('Invalid token issuer', 401);
    }
    if (($payload['aud'] ?? '') !== GOOGLE_CLIENT_ID) {
        googleAuthFail('Token was not issued for this application', 401);
    }
    if (empty($payload['exp']) || time() >= (int) $payload['exp']) {
        googleAuthFail('Google credential expired', 401);
    }

    $email = trim((string) ($payload['email'] ?? ''));
    if ($email === '' || empty($payload['email_verified'])) {
        googleAuthFail('Google account email is not verified', 401);
    }

    $first = trim((string) ($payload['given_name'] ?? ''));
    $last = trim((string) ($payload['family_name'] ?? ''));
    if ($first === '' && $last === '') {
        $name = trim((string) ($payload['name'] ?? ''));
        if ($name !== '') {
            $nameParts = preg_split('/\s+/', $name, 2);
            $first = $nameParts[0];
            $last = $nameParts[1] ?? '';
        }
    }
    if ($first === '') {
        $first = strstr($email, '@', true) ?: 'User';
    }

    return [
        'email' => $email,
        'first_name' => mb_substr($first, 0, 50),
        'last_name' => mb_substr($last, 0, 50),
    ];
}

function googleAuthConnect(): mysqli
{
    $mysqli = new mysqli('127.0.0.1', 'root', '', 'motomaster');
    if ($mysqli->connect_errno) {
        googleAuthFail('Database connection failed', 500);
    }
    $mysqli->set_charset('utf8mb4');
    return $mysqli;
}

function googleAuthRandomPasswordHash(): string
{
    return password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);
}

/* ─────────────────────────── Students ─────────────────────────── */

function googleAuthEnsureStudentsTable(mysqli $mysqli): void
{
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS students (
            student_id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            section VARCHAR(50) NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $mysqli->query('ALTER TABLE students MODIFY password VARCHAR(255) NOT NULL');
    motoMasterEnsureProfilePhotoColumn($mysqli, 'students');
}

function googleAuthStudent(mysqli $mysqli, array $profile, string $section = ''): void
{
    googleAuthEnsureStudentsTable($mysqli);
    $email = $profile['email'];

    $stmt = $mysqli->prepare('SELECT student_id, first_name, last_name, email, section, profile_photo FROM students WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        if (!GOOGLE_AUTH_AUTO_PROVISION_STUDENTS) {
            googleAuthFail('Account not registered. Please sign up first.', 401);
        }
        $hash = googleAuthRandomPasswordHash();
        $ins = $mysqli->prepare('INSERT INTO students (first_name, last_name, email, password, section) VALUES (?, ?, ?, ?, ?)');
        $ins->bind_param('sssss', $profile['first_name'], $profile['last_name'], $email, $hash, $section);
        if (!$ins->execute()) {
            googleAuthFail('Failed to create student account', 500);
        }
        $row = [
            'student_id' => (int) $mysqli->insert_id,
            'first_name' => $profile['first_name'],
            'last_name' => $profile['last_name'],
            'email' => $email,
            'section' => $section,
        ];
        $ins->close();
    } elseif ($row['section'] === '' && $section !== '') {
        // Earlier Google sign-ups stored no section — pick up the one the
        // student selects now so teachers can actually see the account.
        $upd = $mysqli->prepare('UPDATE students SET section = ? WHERE student_id = ?');
        $upd->bind_param('si', $section, $row['student_id']);
        $upd->execute();
        $upd->close();
        $row['section'] = $section;
    }

    session_regenerate_id(true);
    $_SESSION['role'] = 'Student';
    $_SESSION['student_id'] = (int) $row['student_id'];
    $_SESSION['student_email'] = $row['email'];
    $_SESSION['student_name'] = trim($row['first_name'] . ' ' . $row['last_name']);

    echo json_encode([
        'success' => true,
        'message' => 'Authenticated',
        'student' => [
            'student_id' => (int) $row['student_id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'section' => $row['section'],
            'profile_photo' => $row['profile_photo'] ?? 'images/userprofile.jpg',
            'role' => 'Student',
        ],
    ]);
}

/* ─────────────────────────── Teachers ─────────────────────────── */

function googleAuthEnsureInstructorsTable(mysqli $mysqli): void
{
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS instructors (
            instructor_id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            specialization VARCHAR(100) NOT NULL DEFAULT '',
            contact_number VARCHAR(20) NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $mysqli->query('ALTER TABLE instructors MODIFY password VARCHAR(255) NOT NULL');
    motoMasterEnsureProfilePhotoColumn($mysqli, 'instructors');
}

function googleAuthTeacher(mysqli $mysqli, array $profile): void
{
    googleAuthEnsureInstructorsTable($mysqli);
    $email = $profile['email'];

    $stmt = $mysqli->prepare('SELECT instructor_id, first_name, last_name, email, specialization, contact_number, profile_photo FROM instructors WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        if (!GOOGLE_AUTH_AUTO_PROVISION_TEACHERS) {
            googleAuthFail('Account not registered. Please sign up first.', 401);
        }
        $hash = googleAuthRandomPasswordHash();
        $blank = '';
        $ins = $mysqli->prepare('INSERT INTO instructors (first_name, last_name, email, password, specialization, contact_number) VALUES (?, ?, ?, ?, ?, ?)');
        $ins->bind_param('ssssss', $profile['first_name'], $profile['last_name'], $email, $hash, $blank, $blank);
        if (!$ins->execute()) {
            googleAuthFail('Failed to create teacher account', 500);
        }
        $row = [
            'instructor_id' => (int) $mysqli->insert_id,
            'first_name' => $profile['first_name'],
            'last_name' => $profile['last_name'],
            'email' => $email,
            'specialization' => '',
            'contact_number' => '',
        ];
        $ins->close();
    }

    session_regenerate_id(true);
    $_SESSION['role'] = 'Teacher';
    $_SESSION['teacher_id'] = (int) $row['instructor_id'];
    $_SESSION['teacher_email'] = $row['email'];
    $_SESSION['teacher_name'] = trim($row['first_name'] . ' ' . $row['last_name']);

    echo json_encode([
        'success' => true,
        'message' => 'Authenticated',
        'teacher' => [
            'instructor_id' => (int) $row['instructor_id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'specialization' => $row['specialization'],
            'contact_number' => $row['contact_number'],
            'profile_photo' => $row['profile_photo'] ?? 'images/userprofile.jpg',
            'role' => 'Teacher',
        ],
    ]);
}

/* ─────────────────────────── Admins ─────────────────────────── */

function googleAuthEnsureAdminTable(mysqli $mysqli): void
{
    $mysqli->query(
        "CREATE TABLE IF NOT EXISTS admin (
            admin_id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(50) NOT NULL,
            last_name VARCHAR(50) NOT NULL,
            email VARCHAR(150) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $mysqli->query('ALTER TABLE admin MODIFY password VARCHAR(255) NOT NULL');
    motoMasterEnsureProfilePhotoColumn($mysqli, 'admin');
}

function googleAuthAdmin(mysqli $mysqli, array $profile): void
{
    googleAuthEnsureAdminTable($mysqli);
    $email = $profile['email'];

    $stmt = $mysqli->prepare('SELECT admin_id, first_name, last_name, email, profile_photo FROM admin WHERE email = ? LIMIT 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        if (!GOOGLE_AUTH_AUTO_PROVISION_ADMINS) {
            googleAuthFail('No admin account exists for this Google email.', 403);
        }
        $hash = googleAuthRandomPasswordHash();
        $ins = $mysqli->prepare('INSERT INTO admin (first_name, last_name, email, password) VALUES (?, ?, ?, ?)');
        $ins->bind_param('ssss', $profile['first_name'], $profile['last_name'], $email, $hash);
        if (!$ins->execute()) {
            googleAuthFail('Failed to create admin account', 500);
        }
        $row = [
            'admin_id' => (int) $mysqli->insert_id,
            'first_name' => $profile['first_name'],
            'last_name' => $profile['last_name'],
            'email' => $email,
        ];
        $ins->close();
    }

    session_regenerate_id(true);
    $_SESSION['role'] = 'Admin';
    $_SESSION['admin_id'] = (int) $row['admin_id'];
    $_SESSION['admin_email'] = $row['email'];
    $_SESSION['admin_name'] = trim($row['first_name'] . ' ' . $row['last_name']);

    echo json_encode([
        'success' => true,
        'message' => 'Authenticated',
        'admin' => [
            'admin_id' => (int) $row['admin_id'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'profile_photo' => $row['profile_photo'] ?? 'images/userprofile.jpg',
            'role' => 'Admin',
        ],
    ]);
}

/* ─────────────────────────── Entry point ─────────────────────────── */

$clientId = defined('GOOGLE_CLIENT_ID') ? GOOGLE_CLIENT_ID : '';
if ($clientId === '' || strpos($clientId, 'YOUR_') === 0) {
    googleAuthFail('Google sign-in is not configured on this server.', 500);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$credential = trim((string) ($input['credential'] ?? ''));
$role = strtolower(trim((string) ($input['role'] ?? '')));
$section = strtoupper(trim((string) ($input['section'] ?? '')));
if (!preg_match('/^[A-Z]$/', $section)) {
    $section = '';
}

if ($credential === '') {
    googleAuthFail('Missing Google credential');
}
if (!in_array($role, ['student', 'teacher', 'admin'], true)) {
    googleAuthFail('Invalid role');
}

$profile = googleAuthVerifyIdToken($credential);
$mysqli = googleAuthConnect();

switch ($role) {
    case 'student':
        googleAuthStudent($mysqli, $profile, $section);
        break;
    case 'teacher':
        googleAuthTeacher($mysqli, $profile);
        break;
    case 'admin':
        googleAuthAdmin($mysqli, $profile);
        break;
}

$mysqli->close();
