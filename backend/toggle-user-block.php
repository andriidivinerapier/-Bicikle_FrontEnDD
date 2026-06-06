<?php
// toggle-user-block.php — блокування / розблокування користувача адміністратором
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '0');
session_start();
require_once 'db.php';

date_default_timezone_set('Europe/Kyiv');

if (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонено']);
    $conn->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
    $conn->close();
    exit;
}

$targetId = intval($_POST['user_id'] ?? 0);
$action = trim($_POST['action'] ?? '');
$durationHours = isset($_POST['duration_hours']) ? intval($_POST['duration_hours']) : null;
$blockReason = isset($_POST['reason']) ? trim($_POST['reason']) : '';
if ($targetId <= 0 || !in_array($action, ['block', 'unblock'], true)) {
    echo json_encode(['status' => 'error', 'message' => 'Невірні дані']);
    $conn->close();
    exit;
}
if ($action === 'block' && $durationHours !== null && ($durationHours < 24 || $durationHours > 240)) {
    echo json_encode(['status' => 'error', 'message' => 'Термін блокування має бути від 1 до 10 днів']);
    $conn->close();
    exit;
}

$adminId = intval($_SESSION['user']['id'] ?? 0);
if ($targetId === $adminId) {
    echo json_encode(['status' => 'error', 'message' => 'Ви не можете змінювати статус власного облікового запису']);
    $conn->close();
    exit;
}

$hasBlockedReason = false;
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
if (!$hasBlockedReason) {
    if ($conn->query("ALTER TABLE users ADD COLUMN blocked_reason TEXT NULL DEFAULT NULL") === FALSE) {
        error_log('toggle-user-block.php alter error: ' . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Помилка серверу при оновленні схеми']);
        $conn->close();
        exit;
    }
}

$stmt = $conn->prepare('SELECT role, blocked FROM users WHERE id = ? LIMIT 1');
if (!$stmt) {
    error_log('toggle-user-block.php prepare error: ' . $conn->error);
    echo json_encode(['status' => 'error', 'message' => 'Помилка серверу']);
    $conn->close();
    exit;
}
$stmt->bind_param('i', $targetId);
if (!$stmt->execute()) {
    error_log('toggle-user-block.php execute error: ' . $stmt->error);
    echo json_encode(['status' => 'error', 'message' => 'Помилка виконання запиту']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->store_result();
if ($stmt->num_rows !== 1) {
    echo json_encode(['status' => 'error', 'message' => 'Користувача не знайдено']);
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->bind_result($role, $currentBlocked);
$stmt->fetch();
$stmt->close();

if ($role === 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Не можна змінювати статус іншого адміністратора']);
    $conn->close();
    exit;
}

if ($action === 'block') {
    $newBlocked = 1;
    if ($durationHours === null || $durationHours === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Потрібно вказати термін блокування від 1 до 10 днів']);
        $conn->close();
        exit;
    }
    if ($blockReason === '') {
        echo json_encode(['status' => 'error', 'message' => 'Потрібно вказати причину блокування']);
        $conn->close();
        exit;
    }
    if (mb_strlen($blockReason) > 500) {
        echo json_encode(['status' => 'error', 'message' => 'Причина блокування не має перевищувати 500 символів']);
        $conn->close();
        exit;
    }
    $blockReason = preg_replace('/[\r\n]+/u', ' ', $blockReason);
    {
        $date = new DateTime('now', new DateTimeZone('Europe/Kyiv'));
        $date->modify("+{$durationHours} hours");
        $blockedUntil = $date->format('Y-m-d H:i:s');
        if ($durationHours % 24 === 0) {
            $days = intdiv($durationHours, 24);
            $dayWord = $days === 1 ? 'день' : 'дні';
            $message = "Користувача заблоковано на $days $dayWord.";
        } else {
            $message = "Користувача заблоковано на $durationHours год.";
        }
        $message .= " Причина: $blockReason";
    }
} else {
    $newBlocked = 0;
    $blockedUntil = null;
    $blockReason = null;
    $message = 'Користувача розблоковано';
}

$update = $conn->prepare('UPDATE users SET blocked = ?, blocked_until = ?, blocked_reason = ? WHERE id = ?');
if (!$update) {
    error_log('toggle-user-block.php update prepare error: ' . $conn->error);
    echo json_encode(['status' => 'error', 'message' => 'Помилка серверу']);
    $conn->close();
    exit;
}
$update->bind_param('issi', $newBlocked, $blockedUntil, $blockReason, $targetId);
if (!$update->execute()) {
    error_log('toggle-user-block.php update execute error: ' . $update->error);
    echo json_encode(['status' => 'error', 'message' => 'Не вдалося оновити статус користувача']);
    $update->close();
    $conn->close();
    exit;
}
$update->close();

echo json_encode(['status' => 'success', 'message' => $message]);
$conn->close();
exit;
?>