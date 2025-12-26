<?php
// backend/get-comments.php — повертає список коментарів для рецепту
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

$recipe_id = intval($_GET['recipe_id'] ?? 0);
$limit = intval($_GET['limit'] ?? 50);

if (!$recipe_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing recipe_id']);
    exit;
}

$comments = [];
// Use LEFT JOIN to obtain username from users table (comments table stores only user_id)
$stmt = $conn->prepare(
    'SELECT c.id, c.recipe_id, c.user_id, COALESCE(u.username, "User") AS username, c.content, c.created_at '
    . 'FROM comments c LEFT JOIN users u ON c.user_id = u.id '
    . 'WHERE c.recipe_id = ? ORDER BY c.created_at DESC LIMIT ?'
);
if ($stmt) {
    $stmt->bind_param('ii', $recipe_id, $limit);
    $stmt->execute();
    $stmt->bind_result($id, $r, $user_id, $username, $content, $created_at);
    while ($stmt->fetch()) {
        $comments[] = [
            'id' => intval($id),
            'recipe_id' => intval($r),
            'user_id' => intval($user_id),
            'username' => $username,
            'content' => $content,
            'created_at' => $created_at
        ];
    }
    $stmt->close();
}

echo json_encode(['status' => 'success', 'comments' => $comments]);
$conn->close();
exit;
?>
