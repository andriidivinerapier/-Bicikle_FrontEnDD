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

// Get recipes from user_recipes table (all statuses - user can see pending, approved, and rejected)
$stmt = $conn->prepare('SELECT id, title, ingredients, instructions, category, image_path, status, created_at, "user" as source FROM user_recipes WHERE user_id = ? ORDER BY created_at DESC');
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
