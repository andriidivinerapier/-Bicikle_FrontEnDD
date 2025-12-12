<?php
// backend/get-recipe.php — повертає один рецепт з таблиці recipes або user_recipes за id
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'Невідомий id']);
    exit;
}

// Try to find in admin recipes table first
$stmt = $conn->prepare('SELECT id, user_id, title, category, ingredients, instructions, image_path, difficulty, cooking_time, created_at FROM recipes WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $id);
if ($stmt->execute()) {
    $res = $stmt->get_result();
    if ($row = $res->fetch_assoc()) {
        echo json_encode(['status' => 'success', 'recipe' => $row, 'source' => 'admin']);
        $stmt->close();
        $conn->close();
        exit;
    }
}
$stmt->close();

// Fallback: look into user_recipes
$stmt2 = $conn->prepare('SELECT id, user_id, title, category, ingredients, instructions, image_path, difficulty, created_at FROM user_recipes WHERE id = ? LIMIT 1');
$stmt2->bind_param('i', $id);
if ($stmt2->execute()) {
    $res2 = $stmt2->get_result();
    if ($row2 = $res2->fetch_assoc()) {
        echo json_encode(['status' => 'success', 'recipe' => $row2, 'source' => 'user']);
        $stmt2->close();
        $conn->close();
        exit;
    }
}
$stmt2->close();

echo json_encode(['status' => 'error', 'message' => 'Рецепт не знайдено']);
$conn->close();
?>
