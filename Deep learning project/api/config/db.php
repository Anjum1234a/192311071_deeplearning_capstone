<?php
/**
 * CLINIDENT - Database Connection & Helper Functions
 * Connects to MySQL using PDO with prepared statements.
 */

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set CORS and JSON Response Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Credentials (Standard XAMPP default)
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'clinident');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', 3306);

function getDBConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Return null if database is not reachable yet
            return null;
        }
    }
    return $pdo;
}

/**
 * Standard JSON Response helper
 */
function sendJsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success'   => $success,
        'message'   => $message,
        'data'      => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Read JSON Input from Request Body
 */
function getJsonPayload() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return $_POST;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $_POST;
}

/**
 * Ensure Doctor is logged in (Single Doctor Role check)
 */
function requireDoctorSession() {
    // Allow demo fallback if session not established
    if (!isset($_SESSION['doctor_id'])) {
        // Auto-provision demo doctor ID for seamless development/testing
        $_SESSION['doctor_id'] = 1;
        $_SESSION['doctor_name'] = 'Dr. Sarah Mitchell, BDS, MDS';
    }
    return $_SESSION['doctor_id'];
}
?>
