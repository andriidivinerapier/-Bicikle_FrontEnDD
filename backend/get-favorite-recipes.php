<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';
session_start();

$session_user_id = null;
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $session_user_id = $_SESSION['user']['id'] ?? null;
} elseif (isset($_SESSION['user_id'])) {
    $session_user_id = $_SESSION['user_id'];
}

if (!$session_user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User not authenticated']);
    exit;
}

$user_id = intval($session_user_id);

// Return full recipe rows for user's favorites
$stmt = $conn->prepare('SELECT r.id, r.title, r.ingredients, r.instructions, r.category, r.image_path, r.created_at, u.username, u.id as user_id
    FROM favorites f
    JOIN recipes r ON f.recipe_id = r.id
    JOIN users u ON r.user_id = u.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC');

if ($stmt) {
    $stmt->bind_param('i', $user_id);
    if ($stmt->execute()) {
        $res = $stmt->get_result();
        $recipes = [];
        while ($row = $res->fetch_assoc()) {
            $recipes[] = $row;
        }
        echo json_encode(['status' => 'success', 'recipes' => $recipes]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to execute query']);
    }
    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to prepare statement']);
}

$conn->close();
?>
