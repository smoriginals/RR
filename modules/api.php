<?php
/**
 * API Router
 * Handles AJAX requests from the frontend
 * Single entry point for all API calls
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// CORS headers (restrict in production)
header('Access-Control-Allow-Origin: ' . (getenv('SITE_URL') ?: '*'));
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/affiliate.php';
require_once __DIR__ . '/notifications.php';

// Rate limiting (simple in-memory — use Redis in production)
session_start();
$rateKey = 'api_rate_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (!isset($_SESSION[$rateKey])) {
    $_SESSION[$rateKey] = ['count' => 0, 'window' => time()];
}
if (time() - $_SESSION[$rateKey]['window'] > 60) {
    $_SESSION[$rateKey] = ['count' => 0, 'window' => time()];
}
$_SESSION[$rateKey]['count']++;
if ($_SESSION[$rateKey]['count'] > 60) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please wait.']);
    exit;
}

// Get action from request
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// CSRF token validation for POST requests
function validateCSRF() {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || !isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid security token. Please refresh and try again.']);
        exit;
    }
}

function generateCSRFToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Route actions
switch ($action) {
    // ── Authentication ──
    case 'register':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        validateCSRF();
        $result = registerUser(
            $_POST['name'] ?? '',
            $_POST['email'] ?? '',
            $_POST['password'] ?? '',
            $_POST['phone'] ?? null,
            $_POST['referral_code'] ?? null
        );
        echo json_encode($result);
        break;

    case 'login':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        validateCSRF();
        $result = loginUser(
            $_POST['email'] ?? '',
            $_POST['password'] ?? ''
        );
        echo json_encode($result);
        break;

    case 'logout':
        logoutUser();
        echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
        break;

    case 'check_auth':
        echo json_encode([
            'logged_in' => isLoggedIn(),
            'user' => getCurrentUser(),
            'csrf_token' => generateCSRFToken(),
        ]);
        break;

    // ── Affiliate ──
    case 'affiliate_stats':
        if (!isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            break;
        }
        $stats = getAffiliateStats($_SESSION['user_id']);
        echo json_encode(['success' => true, 'stats' => $stats]);
        break;

    case 'referral_link':
        if (!isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            break;
        }
        $link = getReferralLink($_SESSION['user_id']);
        echo json_encode(['success' => true, 'link' => $link]);
        break;

    case 'recent_activity':
        if (!isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            break;
        }
        $limit = min((int)($_GET['limit'] ?? 10), 50);
        $activity = getRecentActivity($_SESSION['user_id'], $limit);
        echo json_encode(['success' => true, 'activity' => $activity]);
        break;

    case 'track_click':
        $code = $_GET['ref'] ?? $_POST['ref'] ?? '';
        if ($code) {
            trackReferralClick($code, $_SERVER['HTTP_REFERER'] ?? null);
        }
        echo json_encode(['success' => true]);
        break;

    case 'request_payout':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
        }
        if (!isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            break;
        }
        validateCSRF();
        $result = requestPayout(
            $_SESSION['user_id'],
            (float)($_POST['amount'] ?? 0),
            $_POST['payment_method'] ?? 'bank_transfer',
            $_POST['payment_details'] ?? null
        );
        echo json_encode($result);
        break;

    // ── Notifications ──
    case 'notifications':
        if (!isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            break;
        }
        $notifications = getUserNotifications($_SESSION['user_id']);
        $unreadCount = getUnreadCount($_SESSION['user_id']);
        echo json_encode([
            'success' => true,
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
        break;

    case 'mark_read':
        if (!isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            break;
        }
        $notifId = (int)($_POST['notification_id'] ?? 0);
        if ($notifId > 0) {
            markNotificationRead($notifId, $_SESSION['user_id']);
        }
        echo json_encode(['success' => true]);
        break;

    case 'mark_all_read':
        if (!isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Authentication required']);
            break;
        }
        $count = markAllNotificationsRead($_SESSION['user_id']);
        echo json_encode(['success' => true, 'marked' => $count]);
        break;

    // ── CSRF Token ──
    case 'csrf_token':
        echo json_encode(['token' => generateCSRFToken()]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Unknown action: ' . htmlspecialchars($action)]);
        break;
}
