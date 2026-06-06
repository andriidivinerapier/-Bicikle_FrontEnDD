<?php
// login.php — логінізація користувача
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

// Приймаємо POST-запит
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Перевірка на порожні поля
    if (!$email || !$password) {
        echo json_encode(['status' => 'error', 'message' => 'Всі поля обовʼязкові']);
        exit;
    }

    // Пошук користувача за email
    $stmt = $conn->prepare("SELECT id, username, password, role, blocked, blocked_until, $blockedReasonExpr FROM users WHERE email = ?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 1) {
        $stmt->bind_result($id, $username, $hashed_password, $role, $blocked, $blocked_until, $blocked_reason);
        $stmt->fetch();
        // Перевірка пароля
        if (password_verify($password, $hashed_password)) {
            $now = new DateTime();
            $expiredBlock = false;
            $blockedReason = $blocked_reason ? preg_replace('/[\r\n]+/u', ' ', trim($blocked_reason)) : '';
            $reasonSuffix = $blockedReason ? " Причина: $blockedReason" : '';
            if ($blocked_until) {
                $blockedUntilDate = DateTime::createFromFormat('Y-m-d H:i:s', $blocked_until);
                if ($blockedUntilDate && $blockedUntilDate > $now) {
                    $remaining = $now->diff($blockedUntilDate);
                    $totalHours = ($remaining->days * 24) + $remaining->h;
                    if ($totalHours >= 24) {
                        $daysLeft = (int) ceil($totalHours / 24);
                        echo json_encode(['status' => 'error', 'message' => "Ваш акаунт заблоковано ще $daysLeft дн.$reasonSuffix"]);
                    } elseif ($totalHours >= 1) {
                        echo json_encode(['status' => 'error', 'message' => "Ваш акаунт заблоковано ще $totalHours год.$reasonSuffix"]);
                    } else {
                        echo json_encode(['status' => 'error', 'message' => 'Ваш акаунт заблоковано ще менше години' . $reasonSuffix]);
                    }
                    $stmt->close();
                    $conn->close();
                    exit;
                }
                $expiredBlock = true;
            }

            if ($blocked && !$blocked_until) {
                echo json_encode(['status' => 'error', 'message' => 'Ваш акаунт заблоковано' . $reasonSuffix]);
                $stmt->close();
                $conn->close();
                exit;
            }

            if ($expiredBlock) {
                $update = $conn->prepare('UPDATE users SET blocked = 0, blocked_until = NULL, blocked_reason = NULL WHERE id = ?');
                if ($update) {
                    $update->bind_param('i', $id);
                    $update->execute();
                    $update->close();
                }
                $blocked = 0;
                $blocked_until = null;
            }

            $_SESSION['user'] = [
                'id' => $id,
                'username' => $username,
                'email' => $email,
                'role' => $role
            ]; // Зберігаємо користувача в сесії
            echo json_encode(['status' => 'success', 'username' => $username, 'role' => $role]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Невірний логін або пароль']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Невірний логін або пароль']);
    }
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}
?>
