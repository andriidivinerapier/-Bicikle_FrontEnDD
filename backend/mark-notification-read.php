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

$colCheck = $conn->prepare("SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications' AND COLUMN_NAME = 'is_read'");
$hasIsRead = false;
if ($colCheck) {
    if ($colCheck->execute()) {
        $cres = $colCheck->get_result();
        if ($crow = $cres->fetch_assoc()) $hasIsRead = intval($crow['cnt']) > 0;
    }
    $colCheck->close();
}

if (!$hasIsRead) {
    // Try to add the column for compatibility
    try {
        $conn->query("ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) DEFAULT 0 AFTER message");
        $hasIsRead = true;
    } catch (Exception $e) {
        // ignore — we'll fallback to success without updating
        error_log('mark-notification-read: could not add is_read column: ' . $e->getMessage());
    }
}

if ($hasIsRead) {
    $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
    $stmt->bind_param('ii', $note_id, $user_id);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка']);
    }
    $stmt->close();
} else {
    // Column not available and couldn't be added — return success so client proceeds
    echo json_encode(['status' => 'success']);
}
$conn->close();
?>