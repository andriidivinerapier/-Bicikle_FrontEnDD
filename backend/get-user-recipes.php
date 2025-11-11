<?php
// backend/get-user-recipes.php — повертає рецепти поточного користувача
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не автентифікований']);
    exit;
}

$user_id = intval($_SESSION['user']['id'] ?? 0);
if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Невідомий користувач']);
    exit;
}

// Ensure recipes table exists (safe to run many times)
$create_sql = "CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    category VARCHAR(100) DEFAULT '',
    image_path VARCHAR(255) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
$conn->query($create_sql);

$stmt = $conn->prepare('SELECT id, title, ingredients, instructions, category, image_path, created_at FROM recipes WHERE user_id = ? ORDER BY created_at DESC');
$stmt->bind_param('i', $user_id);
if ($stmt->execute()) {
    $res = $stmt->get_result();
    $recipes = [];
    while ($row = $res->fetch_assoc()) {
        $recipes[] = $row;
    }
    echo json_encode(['status' => 'success', 'recipes' => $recipes]);
} else {
    // If query failed, return empty list instead of fatal error
    echo json_encode(['status' => 'success', 'recipes' => []]);
}

$stmt->close();
$conn->close();
?>
