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
$stmt = $conn->prepare('SELECT id, recipe_id, user_id, username, content, created_at FROM comments WHERE recipe_id = ? ORDER BY created_at DESC LIMIT ?');
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
