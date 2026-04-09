<?php
/**
 * Affiliate Module
 * Handles referral tracking, commission calculation, and payouts
 * Plugs into existing user system as a separate module
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

/**
 * Track a referral link click
 */
function trackReferralClick($referralCode, $pageUrl = null) {
    if (!isFeatureEnabled('referral_tracking')) return false;
    
    $pdo = getDBConnection();
    
    // Validate referral code
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $referralCode)) return false;
    
    // Find referrer
    $stmt = $pdo->prepare('SELECT id FROM users WHERE referral_code = ? AND is_active = 1');
    $stmt->execute([$referralCode]);
    $referrer = $stmt->fetch();
    
    if (!$referrer) return false;
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO referral_clicks (referrer_id, referral_code, ip_address, user_agent, page_url)
            VALUES (?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $referrer['id'],
            $referralCode,
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
            $pageUrl ? substr($pageUrl, 0, 500) : null,
        ]);
        return true;
    } catch (PDOException $e) {
        error_log('Referral click tracking error: ' . $e->getMessage());
        return false;
    }
}

/**
 * Record a referral conversion (when referred user makes a purchase)
 */
function recordConversion($referrerId, $referredUserId, $orderAmount, $orderId = null) {
    if (!isFeatureEnabled('affiliate_system')) return false;
    
    $pdo = getDBConnection();
    
    // Calculate commission based on tier
    $commissionRate = getCommissionRate($referrerId);
    $commission = round($orderAmount * ($commissionRate / 100), 2);
    
    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare('
            INSERT INTO referral_conversions 
            (referrer_id, referred_user_id, order_id, amount, commission, commission_rate, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $referrerId,
            $referredUserId,
            $orderId,
            $orderAmount,
            $commission,
            $commissionRate,
            'pending',
        ]);
        
        // Notify referrer about earning
        if (isFeatureEnabled('notifications')) {
            $stmt = $pdo->prepare('
                INSERT INTO notifications (user_id, type, icon, message)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([
                $referrerId,
                'earning',
                'fas fa-rupee-sign',
                'You earned ₹' . number_format($commission) . ' from a referral purchase!',
            ]);
        }
        
        $pdo->commit();
        return ['success' => true, 'commission' => $commission];
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log('Conversion recording error: ' . $e->getMessage());
        return ['success' => false, 'error' => 'Failed to record conversion'];
    }
}

/**
 * Get commission rate based on referrer tier
 * Bronze: ₹0 - ₹5000    → 10%
 * Silver: ₹5001 - ₹25000 → 15%
 * Gold:   ₹25001+         → 20%
 */
function getCommissionRate($userId) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('
        SELECT COALESCE(SUM(commission), 0) as total_earned
        FROM referral_conversions
        WHERE referrer_id = ? AND status IN ("approved", "paid")
    ');
    $stmt->execute([$userId]);
    $result = $stmt->fetch();
    $totalEarned = (float) $result['total_earned'];
    
    if ($totalEarned >= 25000) return 20.0;
    if ($totalEarned >= 5000) return 15.0;
    return 10.0;
}

/**
 * Get affiliate dashboard stats for a user
 */
function getAffiliateStats($userId) {
    $pdo = getDBConnection();
    
    // Total clicks
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM referral_clicks WHERE referrer_id = ?');
    $stmt->execute([$userId]);
    $clicks = (int) $stmt->fetch()['total'];
    
    // Total conversions
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM referral_conversions WHERE referrer_id = ?');
    $stmt->execute([$userId]);
    $conversions = (int) $stmt->fetch()['total'];
    
    // Total earnings
    $stmt = $pdo->prepare('
        SELECT COALESCE(SUM(commission), 0) as total
        FROM referral_conversions
        WHERE referrer_id = ? AND status IN ("approved", "paid")
    ');
    $stmt->execute([$userId]);
    $earnings = (float) $stmt->fetch()['total'];
    
    // Pending earnings
    $stmt = $pdo->prepare('
        SELECT COALESCE(SUM(commission), 0) as total
        FROM referral_conversions
        WHERE referrer_id = ? AND status = "pending"
    ');
    $stmt->execute([$userId]);
    $pending = (float) $stmt->fetch()['total'];
    
    // Active referrals (users who signed up through this user)
    $stmt = $pdo->prepare('SELECT COUNT(*) as total FROM users WHERE referred_by = ?');
    $stmt->execute([$userId]);
    $activeReferrals = (int) $stmt->fetch()['total'];
    
    // Conversion rate
    $conversionRate = $clicks > 0 ? round(($conversions / $clicks) * 100, 1) : 0;
    
    // Current tier
    $commissionRate = getCommissionRate($userId);
    $tier = 'Bronze';
    if ($commissionRate >= 20) $tier = 'Gold';
    elseif ($commissionRate >= 15) $tier = 'Silver';
    
    // Monthly earnings (last 12 months)
    $stmt = $pdo->prepare('
        SELECT 
            DATE_FORMAT(created_at, "%Y-%m") as month,
            SUM(commission) as earnings
        FROM referral_conversions
        WHERE referrer_id = ? AND status IN ("approved", "paid")
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, "%Y-%m")
        ORDER BY month
    ');
    $stmt->execute([$userId]);
    $monthlyEarnings = $stmt->fetchAll();
    
    return [
        'total_clicks'     => $clicks,
        'conversions'      => $conversions,
        'earnings'         => $earnings,
        'pending_earnings'  => $pending,
        'active_referrals' => $activeReferrals,
        'conversion_rate'  => $conversionRate,
        'commission_rate'  => $commissionRate,
        'tier'             => $tier,
        'monthly_earnings' => $monthlyEarnings,
    ];
}

/**
 * Get recent referral activity for a user
 */
function getRecentActivity($userId, $limit = 10) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('
        SELECT 
            rc.created_at,
            rc.amount,
            rc.commission,
            rc.status,
            u.name as referred_user_name
        FROM referral_conversions rc
        JOIN users u ON rc.referred_user_id = u.id
        WHERE rc.referrer_id = ?
        ORDER BY rc.created_at DESC
        LIMIT ?
    ');
    $stmt->execute([$userId, $limit]);
    return $stmt->fetchAll();
}

/**
 * Request a payout
 */
function requestPayout($userId, $amount, $paymentMethod = 'bank_transfer', $paymentDetails = null) {
    $pdo = getDBConnection();
    
    // Check minimum payout
    if ($amount < 500) {
        return ['success' => false, 'message' => 'Minimum payout amount is ₹500.'];
    }
    
    // Check available balance
    $stats = getAffiliateStats($userId);
    $availableBalance = $stats['earnings'] - $stats['pending_earnings'];
    
    // Get total paid out
    $stmt = $pdo->prepare('
        SELECT COALESCE(SUM(amount), 0) as total
        FROM affiliate_payouts
        WHERE user_id = ? AND status IN ("pending", "processing", "completed")
    ');
    $stmt->execute([$userId]);
    $totalPaid = (float) $stmt->fetch()['total'];
    
    $withdrawable = $stats['earnings'] - $totalPaid;
    
    if ($amount > $withdrawable) {
        return ['success' => false, 'message' => 'Insufficient balance. Available: ₹' . number_format($withdrawable)];
    }
    
    try {
        $stmt = $pdo->prepare('
            INSERT INTO affiliate_payouts (user_id, amount, payment_method, payment_details, status)
            VALUES (?, ?, ?, ?, ?)
        ');
        
        // Sanitize payment details
        $safeDetails = $paymentDetails ? json_encode(array_map('htmlspecialchars', (array) $paymentDetails)) : null;
        
        $stmt->execute([$userId, $amount, $paymentMethod, $safeDetails, 'pending']);
        
        return ['success' => true, 'message' => 'Payout request submitted successfully!'];
    } catch (PDOException $e) {
        error_log('Payout request error: ' . $e->getMessage());
        return ['success' => false, 'message' => 'Failed to submit payout request.'];
    }
}

/**
 * Get user's referral link
 */
function getReferralLink($userId) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('SELECT referral_code FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user || !$user['referral_code']) return null;
    
    global $site_config;
    return rtrim($site_config['url'], '/') . '/?ref=' . urlencode($user['referral_code']);
}
