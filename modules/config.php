<?php
/**
 * Database Configuration
 * Central configuration for database connection
 * Uses environment variables with fallback defaults
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(__DIR__));
}

// Database configuration
$db_config = [
    'host'     => getenv('DB_HOST') ?: 'localhost',
    'dbname'   => getenv('DB_NAME') ?: 'Richer_db',
    'username' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASS') ?: '',
    'charset'  => 'utf8mb4',
    'port'     => getenv('DB_PORT') ?: 3306,
];

// Site configuration
$site_config = [
    'name'         => 'Richer',
    'url'          => getenv('SITE_URL') ?: 'http://localhost',
    'version'      => '2.0.0',
    'timezone'     => 'Asia/Kolkata',
    'currency'     => 'INR',
    'currency_sym' => '₹',
];

// Feature flags (server-side)
$feature_flags = [
    'affiliate_system'   => true,
    'notifications'      => true,
    'otp_verification'   => false,  // Set to true when OTP provider is configured
    'referral_tracking'  => true,
    'email_notifications'=> false,  // Set to true when SMTP is configured
];

// Set timezone
date_default_timezone_set($site_config['timezone']);

/**
 * Get PDO database connection
 * Uses singleton pattern to reuse connections
 */
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        global $db_config;
        
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $db_config['host'],
            $db_config['port'],
            $db_config['dbname'],
            $db_config['charset']
        );
        
        try {
            $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    
    return $pdo;
}

/**
 * Check if a feature flag is enabled
 */
function isFeatureEnabled($flag) {
    global $feature_flags;
    return isset($feature_flags[$flag]) && $feature_flags[$flag] === true;
}
