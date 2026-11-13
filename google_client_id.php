<?php
header('Content-Type: application/json');
header('Cache-Control: no-store');

require_once __DIR__ . '/google_config.php';

$clientId = defined('GOOGLE_CLIENT_ID') ? GOOGLE_CLIENT_ID : '';
$configured = $clientId !== ''
    && strpos($clientId, 'YOUR_') === false
    && strpos($clientId, 'apps.googleusercontent.com') !== false;

echo json_encode([
    'configured' => $configured,
    'client_id' => $configured ? $clientId : '',
]);
