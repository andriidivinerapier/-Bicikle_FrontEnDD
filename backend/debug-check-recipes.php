<?php
// debug-check-recipes.php — діагностика БД
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Перевіримо, чи таблиця існує
$tables_result = $conn->query("SHOW TABLES LIKE 'user_recipes'");
$table_exists = $tables_result && $tables_result->num_rows > 0;

// Отримаємо кількість рецептів
$count_result = $conn->query("SELECT COUNT(*) as cnt FROM user_recipes");
$count_row = $count_result ? $count_result->fetch_assoc() : null;

// Отримаємо останні 5 рецептів
$recipes_result = $conn->query("SELECT id, user_id, title, status, created_at FROM user_recipes ORDER BY created_at DESC LIMIT 5");
$recipes = [];
if ($recipes_result) {
    while ($row = $recipes_result->fetch_assoc()) {
        $recipes[] = $row;
    }
}

echo json_encode([
    'table_exists' => $table_exists,
    'total_count' => $count_row ? intval($count_row['cnt']) : 0,
    'last_recipes' => $recipes,
    'error' => $conn->error ?: null
]);

$conn->close();
?>
