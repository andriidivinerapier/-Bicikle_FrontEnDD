<?php
require_once 'db.php';
session_start();

$session_user_id = null;
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $session_user_id = $_SESSION['user']['id'] ?? null;
} elseif (isset($_SESSION['user_id'])) {
    $session_user_id = $_SESSION['user_id'];
}

if (!$session_user_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing user id']);
    exit;
}

$user_id = intval($session_user_id);

$stmt = $conn->prepare('SELECT recipe_id FROM favorites WHERE user_id = ?');
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

$favorites = [];
while ($row = $result->fetch_assoc()) {
    $favorites[] = $row['recipe_id'];
}

echo json_encode(['favorites' => $favorites]);

$stmt->close();
$conn->close();
?>
