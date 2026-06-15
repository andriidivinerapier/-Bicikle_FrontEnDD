<?php
// backend/ban-user.php — блокування користувача з адмін-панелі
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']['id']) || !isset($_SESSION['user']['role']) || $_SESSION['user']['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонено.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту.']);
    exit;
}

$targetUserId = intval($_POST['user_id'] ?? 0);
if ($targetUserId <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Невідомий користувач.']);
    exit;
}

$adminId = intval($_SESSION['user']['id'] ?? 0);
if ($targetUserId === $adminId) {
    echo json_encode(['status' => 'error', 'message' => 'Ви не можете заблокувати власний акаунт.']);
    exit;
}

// Ensure blocking columns exist
$columns = [
    'blocked' => 'TINYINT(1) NOT NULL DEFAULT 0',
    'blocked_until' => 'DATETIME NULL DEFAULT NULL',
    'blocked_reason' => 'TEXT NULL DEFAULT NULL'
];
foreach ($columns as $name => $def) {
    $check = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = ?");
    if ($check) {
        $dbName = $conn->real_escape_string($dbname ?? '');
        $check->bind_param('ss', $dbName, $name);
        if ($check->execute()) {
            $result = $check->get_result();
            $row = $result->fetch_assoc();
            if (intval($row['cnt'] ?? 0) === 0) {
                $conn->query("ALTER TABLE users ADD COLUMN $name $def");
            }
        }
        $check->close();
    }
}

// Cannot ban another admin
$stmt = $conn->prepare('SELECT role FROM users WHERE id = ? LIMIT 1');
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка серверу.']);
    exit;
}
$stmt->bind_param('i', $targetUserId);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['status' => 'error', 'message' => 'Користувача не знайдено.']);
    exit;
}
if (($user['role'] ?? '') === 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Не можна блокувати іншого адміністратора.']);
    exit;
}

$durationDays = 30;
$date = new DateTime('now', new DateTimeZone('Europe/Kyiv'));
$date->modify("+{$durationDays} days");
$blockedUntil = $date->format('Y-m-d H:i:s');
$blockedReason = 'Заблоковано адміністратором через порушення правил.';

$update = $conn->prepare('UPDATE users SET blocked = 1, blocked_until = ?, blocked_reason = ? WHERE id = ?');
if (!$update) {
    echo json_encode(['status' => 'error', 'message' => 'Не вдалося заблокувати користувача.']);
    exit;
}
$update->bind_param('ssi', $blockedUntil, $blockedReason, $targetUserId);
if (!$update->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка при блокуванні користувача.']);
    $update->close();
    exit;
}
$update->close();

$checkN = $conn->query("SHOW TABLES LIKE 'notifications'");
if ($checkN && $checkN->num_rows === 0) {
    $conn->query("CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(100) DEFAULT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
}
$notif = $conn->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
if ($notif) {
    $msg = 'Ваш обліковий запис було заблоковано на ' . $durationDays . ' днів. Причина: ' . $blockedReason;
    $notif->bind_param('is', $targetUserId, $msg);
    $notif->execute();
    $notif->close();
}

echo json_encode(['status' => 'success', 'message' => 'Користувача заблоковано на ' . $durationDays . ' днів.']);
$conn->close();
exit;
