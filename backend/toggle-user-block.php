<?php
// toggle-user-block.php — блокування / розблокування користувача адміністратором
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '0');
session_start();
require_once 'db.php';

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
if ($targetId <= 0 || !in_array($action, ['block', 'unblock'], true)) {
    echo json_encode(['status' => 'error', 'message' => 'Невірні дані']);
    $conn->close();
    exit;
}
if ($action === 'block' && $durationHours !== null && ($durationHours < 0 || $durationHours > 168)) {
    echo json_encode(['status' => 'error', 'message' => 'Термін блокування має бути від 0 до 168 годин']);
    $conn->close();
    exit;
}

$adminId = intval($_SESSION['user']['id'] ?? 0);
if ($targetId === $adminId) {
    echo json_encode(['status' => 'error', 'message' => 'Ви не можете змінювати статус власного облікового запису']);
    $conn->close();
    exit;
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
    if ($durationHours === null) {
        echo json_encode(['status' => 'error', 'message' => 'Потрібно вказати термін блокування']);
        $conn->close();
        exit;
    }
    if ($durationHours === 0) {
        $blockedUntil = null;
        $message = 'Користувача заблоковано без терміну';
    } else {
        $date = new DateTime();
        $date->modify("+{$durationHours} hours");
        $blockedUntil = $date->format('Y-m-d H:i:s');
        $message = "Користувача заблоковано на $durationHours год.";
    }
} else {
    $newBlocked = 0;
    $blockedUntil = null;
    $message = 'Користувача розблоковано';
}

$update = $conn->prepare('UPDATE users SET blocked = ?, blocked_until = ? WHERE id = ?');
if (!$update) {
    error_log('toggle-user-block.php update prepare error: ' . $conn->error);
    echo json_encode(['status' => 'error', 'message' => 'Помилка серверу']);
    $conn->close();
    exit;
}
$update->bind_param('isi', $newBlocked, $blockedUntil, $targetId);
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