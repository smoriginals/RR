<?php
/**
 * Notifications Module
 * Handles creating, reading, and managing user notifications
 * Works with existing session system
 */

require_once __DIR__ . '/config.php';

/**
 * Get notifications for a user
 */
function getUserNotifications($userId, $limit = 20, $unreadOnly = false) {
    $pdo = getDBConnection();
    
    $sql = 'SELECT * FROM notifications WHERE user_id = ?';
    $params = [$userId];
    
    if ($unreadOnly) {
        $sql .= ' AND is_read = 0';
    }
    
    $sql .= ' ORDER BY created_at DESC LIMIT ?';
    $params[] = $limit;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

/**
 * Get unread notification count
 */
function getUnreadCount($userId) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$userId]);
    return (int) $stmt->fetch()['count'];
}

/**
 * Mark a notification as read
 */
function markNotificationRead($notificationId, $userId) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
    $stmt->execute([$notificationId, $userId]);
    return $stmt->rowCount() > 0;
}

/**
 * Mark all notifications as read for a user
 */
function markAllNotificationsRead($userId) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$userId]);
    return $stmt->rowCount();
}

/**
 * Create a notification
 */
function createNotification($userId, $type, $message, $icon = 'fas fa-bell', $actionUrl = null) {
    if (!isFeatureEnabled('notifications')) return false;
    
    $pdo = getDBConnection();
    
    // Sanitize message
    $message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO notifications (user_id, type, icon, message, action_url)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([$userId, $type, $icon, $message, $actionUrl]);
        return (int) $pdo->lastInsertId();
    } catch (PDOException $e) {
        error_log('Notification creation error: ' . $e->getMessage());
        return false;
    }
}

/**
 * Delete old notifications (cleanup)
 */
function cleanupOldNotifications($daysOld = 30) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('
        DELETE FROM notifications 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND is_read = 1
    ');
    $stmt->execute([$daysOld]);
    return $stmt->rowCount();
}
