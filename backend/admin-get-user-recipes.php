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

// Ensure status column exists
$check = $conn->query("SHOW COLUMNS FROM recipes LIKE 'status'");
if ($check && $check->num_rows == 0) {
    $conn->query("ALTER TABLE recipes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'approved'");
}

$stmt = $conn->prepare("SELECT r.id, r.user_id, r.title, r.category, r.created_at, r.image_path, r.ingredients, r.instructions, r.status, r.review_reason, u.username, u.email FROM recipes r LEFT JOIN users u ON r.user_id = u.id WHERE r.status = 'pending' ORDER BY r.created_at DESC");
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