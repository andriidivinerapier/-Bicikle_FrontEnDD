<?php
// backend/mark-notification-read.php — відмітити нотифікацію як прочитану
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не автентифікований']);
    exit;
}

$user_id = intval($_SESSION['user']['id']);
$note_id = intval($_POST['id'] ?? 0);
if (!$note_id) {
    echo json_encode(['status' => 'error', 'message' => 'Невідома нотифікація']);
    exit;
}

$stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
$stmt->bind_param('ii', $note_id, $user_id);
if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Помилка']);
}
$stmt->close();
$conn->close();
?>