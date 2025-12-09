<?php
// backend/admin-get-user-recipes.php — отримати рецепти користувачів в статусі pending
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Перевірка, що користувач адмін
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонений']);
    exit;
}

// Ensure user_recipes table exists
$check = $conn->query("SHOW TABLES LIKE 'user_recipes'");
if ($check && $check->num_rows == 0) {
    echo json_encode(['status' => 'error', 'message' => 'Таблиця user_recipes не знайдена']);
    exit;
}

// Get pending user-submitted recipes from user_recipes table
$stmt = $conn->prepare("SELECT ur.id, ur.user_id, ur.title, ur.category, ur.created_at, ur.image_path, ur.ingredients, ur.instructions, ur.status, ur.review_reason, u.username, u.email FROM user_recipes ur LEFT JOIN users u ON ur.user_id = u.id WHERE ur.status = 'pending' ORDER BY ur.created_at DESC");
$stmt->execute();
$result = $stmt->get_result();
$recipes = [];
while ($row = $result->fetch_assoc()) {
    $recipes[] = $row;
}

echo json_encode(['status' => 'success', 'recipes' => $recipes]);
$stmt->close();
$conn->close();
?>