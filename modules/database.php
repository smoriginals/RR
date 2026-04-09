<?php
/**
 * Database Schema Setup
 * Run once to create tables — does NOT drop or modify existing tables
 * Uses IF NOT EXISTS to be safe for re-runs
 */

require_once __DIR__ . '/config.php';

function setupDatabase() {
    $pdo = getDBConnection();
    
    $queries = [];
    
    // Users table — core user data
    $queries[] = "
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar VARCHAR(500) DEFAULT NULL,
        role ENUM('user', 'affiliate', 'admin') DEFAULT 'user',
        referral_code VARCHAR(20) UNIQUE,
        referred_by INT DEFAULT NULL,
        email_verified TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_email (email),
        INDEX idx_referral_code (referral_code),
        INDEX idx_referred_by (referred_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    // OTP table — for email/phone verification
    $queries[] = "
    CREATE TABLE IF NOT EXISTS otp_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        code VARCHAR(6) NOT NULL,
        type ENUM('email', 'phone', 'login') DEFAULT 'email',
        expires_at TIMESTAMP NOT NULL,
        used TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_type (user_id, type),
        INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    // Referral clicks — track every referral link click
    $queries[] = "
    CREATE TABLE IF NOT EXISTS referral_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id INT NOT NULL,
        referral_code VARCHAR(20) NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        page_url VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_referrer (referrer_id),
        INDEX idx_code (referral_code),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    // Referral conversions — when a referred user makes a purchase
    $queries[] = "
    CREATE TABLE IF NOT EXISTS referral_conversions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        referrer_id INT NOT NULL,
        referred_user_id INT NOT NULL,
        order_id INT DEFAULT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        commission DECIMAL(10,2) NOT NULL DEFAULT 0,
        commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        status ENUM('pending', 'approved', 'paid', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_referrer (referrer_id),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    // Affiliate payouts
    $queries[] = "
    CREATE TABLE IF NOT EXISTS affiliate_payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'bank_transfer',
        payment_details TEXT DEFAULT NULL,
        status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
        processed_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    // Notifications
    $queries[] = "
    CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type ENUM('earning', 'referral', 'system', 'info', 'warning') DEFAULT 'info',
        icon VARCHAR(50) DEFAULT 'fas fa-bell',
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        action_url VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_read (user_id, is_read),
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    // Sessions table for server-side session management
    $queries[] = "
    CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(128) PRIMARY KEY,
        user_id INT NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_activity (last_activity)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    // Execute all queries
    $results = [];
    foreach ($queries as $i => $query) {
        try {
            $pdo->exec($query);
            $results[] = "Query " . ($i + 1) . ": SUCCESS";
        } catch (PDOException $e) {
            $results[] = "Query " . ($i + 1) . ": FAILED - " . $e->getMessage();
        }
    }
    
    return $results;
}

// Run if called directly
if (php_sapi_name() === 'cli' || (isset($_GET['setup']) && $_GET['setup'] === 'true')) {
    $results = setupDatabase();
    foreach ($results as $result) {
        echo $result . "\n";
    }
    echo "\nDatabase setup complete.\n";
}
