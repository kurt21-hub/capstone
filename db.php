<?php
/**
 * MotoMaster Database Configuration
 * Centralized database connection for MySQL
 */

$dbHost = '127.0.0.1';
$dbUser = 'root';
$dbPass = '';
$dbName = 'motomaster';

if (!function_exists('motoMasterGetDbConnection')) {
    function motoMasterGetDbConnection(): mysqli {
        global $dbHost, $dbUser, $dbPass, $dbName;
        
        $mysqli = new mysqli($dbHost, $dbUser, $dbPass, $dbName);
        if ($mysqli->connect_errno) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $mysqli->connect_error
            ]);
            exit;
        }
        $mysqli->set_charset('utf8mb4');
        return $mysqli;
    }
}
