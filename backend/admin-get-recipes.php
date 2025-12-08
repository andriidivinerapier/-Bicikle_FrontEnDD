<?php
// backend/admin-get-recipes.php — отримання всіх рецептів для адміна
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Перевірка, що користувач адмін
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонений']);
    exit;
}

$stmt = $conn->prepare('SELECT id, user_id, title, category, created_at, image_path FROM recipes ORDER BY created_at DESC');
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
