<?php
// session.php — перевірка чи залогінений користувач
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

date_default_timezone_set('Europe/Kyiv');

$hasBlockedReason = false;
$blockedReasonExpr = "NULL AS blocked_reason";
$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'blocked_reason'");
if ($colCheck) {
    $dbName = $conn->real_escape_string($dbname ?? '');
    $colCheck->bind_param('s', $dbName);
    if ($colCheck->execute()) {
        $colCheck->bind_result($cnt);
        if ($colCheck->fetch()) {
            $hasBlockedReason = intval($cnt) > 0;
        }
    }
    $colCheck->close();
}
if ($hasBlockedReason) {
    $blockedReasonExpr = 'blocked_reason';
}

if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $user = $_SESSION['user'];
    // verify user still exists in DB (handles case when admin deleted the user)
    $uid = intval($user['id'] ?? 0);
    if ($uid > 0) {
        $stmt = $conn->prepare("SELECT id, username, role, blocked, blocked_until, $blockedReasonExpr FROM users WHERE id = ? LIMIT 1");
        if ($stmt) {
            $stmt->bind_param('i', $uid);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows === 1) {
                $stmt->bind_result($dbId, $dbUsername, $dbRole, $dbBlocked, $dbBlockedUntil, $dbBlockedReason);
                $stmt->fetch();
                $now = new DateTime();
                $expiredBlock = false;
                $blockedReason = $dbBlockedReason ? preg_replace('/[\r\n]+/u', ' ', trim($dbBlockedReason)) : '';
                $reasonSuffix = $blockedReason ? " Причина: $blockedReason" : '';
                if ($dbBlockedUntil) {
                    $blockedUntilDate = DateTime::createFromFormat('Y-m-d H:i:s', $dbBlockedUntil);
                    if ($blockedUntilDate && $blockedUntilDate > $now) {
                        $_SESSION = [];
                        if (ini_get('session.use_cookies')) {
                            $params = session_get_cookie_params();
                            setcookie(session_name(), '', time() - 42000,
                                $params['path'], $params['domain'], $params['secure'], $params['httponly']
                            );
                        }
                        session_destroy();
                        echo json_encode(['status' => 'blocked', 'message' => 'Акаунт заблоковано' . $reasonSuffix, 'blocked_until' => $dbBlockedUntil, 'blocked_reason' => $blockedReason]);
                        $stmt->close();
                        $conn->close();
                        exit;
                    }
                    $expiredBlock = true;
                }

                if ($expiredBlock) {
                    $update = $conn->prepare('UPDATE users SET blocked = 0, blocked_until = NULL, blocked_reason = NULL WHERE id = ?');
                    if ($update) {
                        $update->bind_param('i', $uid);
                        $update->execute();
                        $update->close();
                    }
                }

                if ($dbBlocked && !$dbBlockedUntil) {
                    $_SESSION = [];
                    if (ini_get('session.use_cookies')) {
                        $params = session_get_cookie_params();
                        setcookie(session_name(), '', time() - 42000,
                            $params['path'], $params['domain'], $params['secure'], $params['httponly']
                        );
                    }
                    session_destroy();
                    echo json_encode(['status' => 'blocked', 'message' => 'Акаунт заблоковано' . $reasonSuffix, 'blocked_reason' => $blockedReason]);
                    $stmt->close();
                    $conn->close();
                    exit;
                }

                echo json_encode([
                    'status' => 'logged',
                    'id' => intval($dbId ?? $uid),
                    'username' => $dbUsername ?? ($user['username'] ?? ''),
                    'role' => $dbRole ?? ($user['role'] ?? 'user')
                ]);
                $stmt->close();
                $conn->close();
                exit;
            }
            $stmt->close();
        }
    }

    // If we reach here, user doesn't exist anymore — destroy session
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']
        );
    }
    session_destroy();
    echo json_encode(['status' => 'logged_out']);
    $conn->close();
    exit;
} else {
    echo json_encode(['status' => 'logged_out']);
}
?>
