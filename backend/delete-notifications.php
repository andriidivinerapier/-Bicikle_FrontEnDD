<?php
// backend/delete-notifications.php — видалити нотифікації користувача (все або за списком id)
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не автентифікований']);
    exit;
}

$user_id = intval($_SESSION['user']['id']);

// If 'all' flag is set, delete all notifications for the user
if (isset($_POST['all']) && $_POST['all'] == '1') {
    $stmt = $conn->prepare('DELETE FROM notifications WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    if ($stmt->execute()) {
        $deleted = $conn->affected_rows;
        echo json_encode(['status' => 'success', 'deleted' => $deleted]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при видаленні']);
    }
    $stmt->close();
    $conn->close();
    exit;
}

// Otherwise, accept optional ids[] to delete specific notifications
if (isset($_POST['ids']) && is_array($_POST['ids'])) {
    $ids = array_map('intval', $_POST['ids']);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    // Build types string
    $types = str_repeat('i', count($ids) + 1); // +1 for user_id
    $sql = "DELETE FROM notifications WHERE user_id = ? AND id IN ($placeholders)";
    $stmt = $conn->prepare($sql);
    $params = array_merge([$user_id], $ids);
    // bind_param requires references
    $refs = [];
    foreach ($params as $k => $v) $refs[$k] = &$params[$k];
    array_unshift($refs, $types);
    call_user_func_array([$stmt, 'bind_param'], $refs);
    if ($stmt->execute()) {
        $deleted = $conn->affected_rows;
        echo json_encode(['status' => 'success', 'deleted' => $deleted]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при видаленні конкретних сповіщень']);
    }
    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Невідомий запит']);
$conn->close();
?>
