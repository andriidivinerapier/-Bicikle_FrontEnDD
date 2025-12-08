<?php
// backend/get-user-notifications.php — отримати нотифікації для користувача
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не автентифікований']);
    exit;
}

$user_id = intval($_SESSION['user']['id']);

$checkN = $conn->query("SHOW TABLES LIKE 'notifications'");
if ($checkN && $checkN->num_rows == 0) {
    echo json_encode(['status' => 'success', 'notifications' => []]);
    exit;
}

$stmt = $conn->prepare('SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result();
$notes = [];
while ($row = $res->fetch_assoc()) {
    $notes[] = $row;
}
$stmt->close();
$conn->close();

echo json_encode(['status' => 'success', 'notifications' => $notes]);
?>