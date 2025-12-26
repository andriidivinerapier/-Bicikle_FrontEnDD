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

// Some older DBs may have a different notifications schema (missing is_read).
// Detect whether `is_read` column exists and adapt the SELECT accordingly.
$dbName = $conn->real_escape_string($conn->query('SELECT DATABASE()')->fetch_row()[0]);
$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_read'");
$hasIsRead = false;
if ($colCheck) {
    $colCheck->bind_param('s', $dbName);
    if ($colCheck->execute()) {
        $cres = $colCheck->get_result();
        if ($crow = $cres->fetch_assoc()) {
            $hasIsRead = intval($crow['cnt']) > 0;
        }
    }
    $colCheck->close();
}

if ($hasIsRead) {
    $stmt = $conn->prepare('SELECT id, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC');
} else {
    // fallback: return is_read = 0 for compatibility
    $stmt = $conn->prepare('SELECT id, message, 0 AS is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC');
}
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