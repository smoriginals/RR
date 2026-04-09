<?php
/**
 * Authentication Module
 * Handles user registration, login, session management
 * Designed to plug into existing flow without breaking it
 */

require_once __DIR__ . '/config.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Generate a unique referral code for a user
 */
function generateReferralCode($userId) {
    $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $code = 'EM';
    for ($i = 0; $i < 6; $i++) {
        $code .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $code;
}

/**
 * Register a new user
 * Returns: ['success' => bool, 'message' => string, 'user_id' => int|null]
 */
function registerUser($name, $email, $password, $phone = null, $referralCode = null) {
    $pdo = getDBConnection();
    
    // Validate inputs
    $name = trim($name);
    $email = trim(strtolower($email));
    
    if (empty($name) || empty($email) || empty($password)) {
        return ['success' => false, 'message' => 'All fields are required.'];
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Invalid email address.'];
    }
    
    if (strlen($password) < 8) {
        return ['success' => false, 'message' => 'Password must be at least 8 characters.'];
    }
    
    // Check if email exists
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        return ['success' => false, 'message' => 'An account with this email already exists.'];
    }
    
    // Find referrer if referral code provided
    $referredBy = null;
    if ($referralCode) {
        $referralCode = trim($referralCode);
        if (preg_match('/^[a-zA-Z0-9_-]+$/', $referralCode)) {
            $stmt = $pdo->prepare('SELECT id FROM users WHERE referral_code = ?');
            $stmt->execute([$referralCode]);
            $referrer = $stmt->fetch();
            if ($referrer) {
                $referredBy = $referrer['id'];
            }
        }
    }
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    
    try {
        $pdo->beginTransaction();
        
        // Insert user
        $stmt = $pdo->prepare('
            INSERT INTO users (name, email, phone, password_hash, referred_by, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([$name, $email, $phone, $passwordHash, $referredBy, 'user']);
        $userId = (int) $pdo->lastInsertId();
        
        // Generate and set referral code
        $userReferralCode = generateReferralCode($userId);
        $stmt = $pdo->prepare('UPDATE users SET referral_code = ? WHERE id = ?');
        $stmt->execute([$userReferralCode, $userId]);
        
        // Create welcome notification
        if (isFeatureEnabled('notifications')) {
            $stmt = $pdo->prepare('
                INSERT INTO notifications (user_id, type, icon, message)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([
                $userId,
                'info',
                'fas fa-hand-wave',
                'Welcome to Richer! Start exploring courses and earn through our affiliate program.'
            ]);
        }
        
        // Notify referrer
        if ($referredBy && isFeatureEnabled('notifications')) {
            $stmt = $pdo->prepare('
                INSERT INTO notifications (user_id, type, icon, message)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([
                $referredBy,
                'referral',
                'fas fa-user-plus',
                $name . ' signed up using your referral link!'
            ]);
        }
        
        $pdo->commit();
        
        return [
            'success' => true,
            'message' => 'Account created successfully!',
            'user_id' => $userId,
            'referral_code' => $userReferralCode,
        ];
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Registration error: ' . $e->getMessage());
        return ['success' => false, 'message' => 'Registration failed. Please try again.'];
    }
}

/**
 * Login a user
 * Returns: ['success' => bool, 'message' => string, 'user' => array|null]
 */
function loginUser($email, $password) {
    $pdo = getDBConnection();
    
    $email = trim(strtolower($email));
    
    if (empty($email) || empty($password)) {
        return ['success' => false, 'message' => 'Email and password are required.'];
    }
    
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['success' => false, 'message' => 'Invalid email or password.'];
    }
    
    // Create session
    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['referral_code'] = $user['referral_code'];
    $_SESSION['login_time'] = time();
    
    // Store session in database
    try {
        $stmt = $pdo->prepare('
            INSERT INTO user_sessions (id, user_id, ip_address, user_agent)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE last_activity = CURRENT_TIMESTAMP
        ');
        $stmt->execute([
            session_id(),
            $user['id'],
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
        ]);
    } catch (PDOException $e) {
        error_log('Session storage error: ' . $e->getMessage());
    }
    
    // Remove sensitive data before returning
    unset($user['password_hash']);
    
    return [
        'success' => true,
        'message' => 'Login successful!',
        'user' => $user,
    ];
}

/**
 * Logout user
 */
function logoutUser() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Remove session from database
    if (isset($_SESSION['user_id'])) {
        try {
            $pdo = getDBConnection();
            $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE id = ?');
            $stmt->execute([session_id()]);
        } catch (PDOException $e) {
            error_log('Session cleanup error: ' . $e->getMessage());
        }
    }
    
    $_SESSION = [];
    
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(), '', time() - 42000,
            $params['path'], $params['domain'],
            $params['secure'], $params['httponly']
        );
    }
    
    session_destroy();
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current user data
 */
function getCurrentUser() {
    if (!isLoggedIn()) return null;
    
    return [
        'id'            => $_SESSION['user_id'],
        'name'          => $_SESSION['user_name'],
        'email'         => $_SESSION['user_email'],
        'role'          => $_SESSION['user_role'],
        'referral_code' => $_SESSION['referral_code'] ?? null,
    ];
}

/**
 * Require authentication — redirect if not logged in
 */
function requireAuth($redirectTo = 'signin.html') {
    if (!isLoggedIn()) {
        header('Location: ' . $redirectTo);
        exit;
    }
}
