<?php
// backend/get-user-comments.php — повертає список коментарів користувача
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

$per_page = intval($_GET['per_page'] ?? 10);
$page = intval($_GET['page'] ?? 1);
if ($per_page <= 0) $per_page = 10;
if ($page <= 0) $page = 1;

if (!isset($_SESSION['user']) || !is_array($_SESSION['user']) || empty($_SESSION['user']['id'])) {
    echo json_encode(['status' => 'logged_out']);
    $conn->close();
    exit;
}

$user_id = intval($_SESSION['user']['id']);

// get total count
$total = 0;
$cstmt = $conn->prepare('SELECT COUNT(*) FROM comments WHERE user_id = ?');
if ($cstmt) {
    $cstmt->bind_param('i', $user_id);
    $cstmt->execute();
    $cstmt->bind_result($total);
    $cstmt->fetch();
    $cstmt->close();
}

$offset = ($page - 1) * $per_page;
$comments = [];
$stmt = $conn->prepare('SELECT c.id, c.recipe_id, c.content, c.created_at, COALESCE(r.title, ur.title, "") AS recipe_title FROM comments c LEFT JOIN recipes r ON c.recipe_id = r.id LEFT JOIN user_recipes ur ON c.recipe_id = ur.id WHERE c.user_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?');
if ($stmt) {
    $stmt->bind_param('iii', $user_id, $per_page, $offset);
    $stmt->execute();
    $stmt->bind_result($id, $recipe_id, $content, $created_at, $recipe_title);
    while ($stmt->fetch()) {
        $comments[] = [
            'id' => intval($id),
            'recipe_id' => intval($recipe_id),
            'content' => $content,
            'created_at' => $created_at,
            'recipe_title' => $recipe_title
        ];
    }
    $stmt->close();
}

$total = intval($total);
$pages = $per_page > 0 ? intval(ceil($total / $per_page)) : 1;

echo json_encode([
    'status' => 'success',
    'comments' => $comments,
    'total' => $total,
    'page' => $page,
    'per_page' => $per_page,
    'pages' => $pages
]);
$conn->close();
exit;
?>
