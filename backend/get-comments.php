<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

$recipe_id = intval($_GET['recipe_id'] ?? 0);
if (!$recipe_id) {
    echo json_encode(['status' => 'error', 'message' => 'Невірний id рецепту']);
    exit;
}

// Ensure comments table exists
$create_sql = "CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    username VARCHAR(255) DEFAULT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
@$conn->query($create_sql);

$stmt = $conn->prepare('SELECT id, recipe_id, user_id, username, content, created_at FROM comments WHERE recipe_id = ? ORDER BY created_at DESC LIMIT 200');
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка підготовки запиту']);
    exit;
}
$stmt->bind_param('i', $recipe_id);
$stmt->execute();
$stmt->bind_result($id, $r_id, $u_id, $username, $content, $created_at);
$comments = [];
while ($stmt->fetch()) {
    $comments[] = [
        'id' => $id,
        'recipe_id' => $r_id,
        'user_id' => $u_id,
        'username' => $username,
        'content' => $content,
        'created_at' => $created_at
    ];
}
$stmt->close();

echo json_encode(['status' => 'success', 'comments' => $comments]);
$conn->close();
exit;
?>