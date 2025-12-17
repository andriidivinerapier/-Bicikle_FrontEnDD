<?php
// backend/delete-comment.php — видалення коментаря (тільки власник або адмін)
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
    exit;
}

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$userId = intval($_SESSION['user']['id']);
$userRole = $_SESSION['user']['role'] ?? 'user';

$commentId = intval($_POST['comment_id'] ?? 0);
if (!$commentId) {
    echo json_encode(['status' => 'error', 'message' => 'Missing comment_id']);
    exit;
}

// fetch comment owner
$stmt = $conn->prepare('SELECT id, user_id FROM comments WHERE id = ? LIMIT 1');
if (!$stmt) { echo json_encode(['status' => 'error', 'message' => 'DB error']); exit; }
$stmt->bind_param('i', $commentId);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row) { echo json_encode(['status' => 'error', 'message' => 'Comment not found']); exit; }

$ownerId = intval($row['user_id']);
if ($ownerId !== $userId && $userRole !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Access denied']);
    exit;
}

$del = $conn->prepare('DELETE FROM comments WHERE id = ?');
if (!$del) {
    $err = $conn->error;
    error_log('delete-comment prepare failed: ' . $err);
    echo json_encode(['status' => 'error', 'message' => 'DB prepare error', 'db_error' => $err]);
    exit;
}
$del->bind_param('i', $commentId);
if (!$del->execute()) {
    $err = $del->error ?: $conn->error;
    error_log('delete-comment execute failed: ' . $err);
    echo json_encode(['status' => 'error', 'message' => 'Execute failed', 'db_error' => $err]);
    $del->close();
    $conn->close();
    exit;
}
$affected = $del->affected_rows;
$del->close();
if ($affected > 0) {
    echo json_encode(['status' => 'success', 'message' => 'Comment deleted', 'affected' => $affected]);
} else {
    // no rows affected — maybe comment already deleted or wrong id
    error_log('delete-comment: no rows affected for id=' . $commentId . ' user=' . $userId);
    echo json_encode(['status' => 'error', 'message' => 'No rows deleted (not found or permission)', 'affected' => $affected]);
}
$conn->close();
exit;
?>
