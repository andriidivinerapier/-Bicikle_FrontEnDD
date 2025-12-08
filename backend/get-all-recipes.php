<?php
// backend/get-all-recipes.php — повертає всі рецепти всіх користувачів
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Ensure recipes table exists
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

// Ensure users table exists
$create_users_sql = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
$conn->query($create_users_sql);

// Get optional search parameter
$search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : '%';

// Get all recipes with user info, sorted by newest first
$stmt = $conn->prepare('
        SELECT r.id, r.title, r.ingredients, r.instructions, r.category, r.image_path, r.created_at, u.username, u.id as user_id
        FROM recipes r
        JOIN users u ON r.user_id = u.id
        WHERE (r.title LIKE ? OR r.category LIKE ? OR u.username LIKE ?)
            AND (r.status = 'approved' OR r.status IS NULL)
        ORDER BY r.created_at DESC
');

if ($stmt) {
    $stmt->bind_param('sss', $search, $search, $search);
    if ($stmt->execute()) {
        $res = $stmt->get_result();
        $recipes = [];
        while ($row = $res->fetch_assoc()) {
            $recipes[] = $row;
        }
        echo json_encode(['status' => 'success', 'recipes' => $recipes, 'count' => count($recipes)]);
    } else {
        echo json_encode(['status' => 'success', 'recipes' => [], 'count' => 0]);
    }
    $stmt->close();
} else {
    echo json_encode(['status' => 'success', 'recipes' => [], 'count' => 0]);
}

$conn->close();
?>
