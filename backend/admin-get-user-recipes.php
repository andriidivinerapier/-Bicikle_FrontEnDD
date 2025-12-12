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

// Ensure user_recipes table exists and has necessary columns
$check = $conn->query("SHOW TABLES LIKE 'user_recipes'");
if ($check && $check->num_rows == 0) {
    echo json_encode(['status' => 'error', 'message' => 'Таблиця user_recipes не знайдена']);
    exit;
}

// Ensure difficulty and time columns exist
$columns_to_add = [
    'difficulty' => "VARCHAR(50) DEFAULT ''",
    'time' => 'INT DEFAULT 0'
];

foreach ($columns_to_add as $col_name => $col_def) {
    $check = $conn->query("SHOW COLUMNS FROM user_recipes LIKE '$col_name'");
    if ($check && $check->num_rows == 0) {
        $conn->query("ALTER TABLE user_recipes ADD COLUMN $col_name $col_def");
    }
}

// Get all user-submitted recipes (both pending and approved)
$stmt = $conn->prepare("SELECT ur.id, ur.user_id, ur.title, ur.category, ur.difficulty, ur.time, ur.created_at, ur.image_path, ur.ingredients, ur.instructions, ur.status, ur.review_reason, u.username, u.email FROM user_recipes ur LEFT JOIN users u ON ur.user_id = u.id WHERE ur.status IN ('pending', 'approved') ORDER BY ur.created_at DESC");
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка SQL', 'sql_error' => $conn->error]);
    exit;
}
$stmt->execute();
$result = $stmt->get_result();
$recipes = [];
while ($row = $result->fetch_assoc()) {
    $recipes[] = $row;
}

echo json_encode(['status' => 'success', 'recipes' => $recipes, 'count' => count($recipes)]);
$stmt->close();
$conn->close();
?>