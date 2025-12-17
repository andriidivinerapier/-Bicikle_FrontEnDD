<?php
// backend/edit-comment.php — редагування коментаря (тільки власник або адмін)
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
$content = trim($_POST['content'] ?? '');

if (!$commentId || $content === '') {
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters']);
    exit;
}

// fetch comment
$stmt = $conn->prepare('SELECT id, user_id FROM comments WHERE id = ? LIMIT 1');
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'DB error']);
    exit;
}
$stmt->bind_param('i', $commentId);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row) {
    echo json_encode(['status' => 'error', 'message' => 'Comment not found']);
    exit;
}

$ownerId = intval($row['user_id']);
if ($ownerId !== $userId && $userRole !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Access denied']);
    exit;
}

$stmt2 = $conn->prepare('UPDATE comments SET content = ? WHERE id = ?');
if (!$stmt2) {
    echo json_encode(['status' => 'error', 'message' => 'DB error']);
    exit;
}
$stmt2->bind_param('si', $content, $commentId);
if ($stmt2->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Comment updated']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Update failed']);
}
$stmt2->close();
$conn->close();
exit;
?>
