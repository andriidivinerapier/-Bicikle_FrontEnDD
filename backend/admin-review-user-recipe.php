<?php
// backend/admin-review-user-recipe.php — адмін схвалює або відхиляє рецепт користувача
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонений']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
    exit;
}

$recipe_id = intval($_POST['recipe_id'] ?? 0);
$action = trim($_POST['action'] ?? ''); // 'approve' or 'reject'
$reason = trim($_POST['reason'] ?? '');

if (!$recipe_id || !in_array($action, ['approve','reject'])) {
    echo json_encode(['status' => 'error', 'message' => 'Невірні дані']);
    exit;
}

// Ensure notifications table exists
$checkN = $conn->query("SHOW TABLES LIKE 'notifications'");
if ($checkN && $checkN->num_rows == 0) {
    $createN = "CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    $conn->query($createN);
}

// Get user recipe info
$stmt = $conn->prepare('SELECT id, user_id, title FROM user_recipes WHERE id = ?');
$stmt->bind_param('i', $recipe_id);
$stmt->execute();
$res = $stmt->get_result();
$recipe = $res->fetch_assoc();
$stmt->close();

if (!$recipe) {
    echo json_encode(['status' => 'error', 'message' => 'Рецепт не знайдено']);
    exit;
}

$new_status = $action === 'approve' ? 'approved' : 'rejected';
$admin_id = intval($_SESSION['user']['id']);

// Update user_recipes table
$upd = $conn->prepare('UPDATE user_recipes SET status = ?, review_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?');
$upd->bind_param('sisi', $new_status, $reason, $admin_id, $recipe_id);
if (!$upd->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка оновлення рецепту']);
    $upd->close();
    $conn->close();
    exit;
}
$upd->close();

// If approved, copy recipe to main recipes table
if ($new_status === 'approved') {
    // Get full recipe details from user_recipes
    $get_recipe = $conn->prepare('SELECT user_id, title, ingredients, instructions, category, difficulty, time, image_path FROM user_recipes WHERE id = ?');
    $get_recipe->bind_param('i', $recipe_id);
    $get_recipe->execute();
    $recipe_data = $get_recipe->get_result()->fetch_assoc();
    $get_recipe->close();
    
    if ($recipe_data) {
        // Insert into recipes table with approved status
        $ins = $conn->prepare('INSERT INTO recipes (user_id, title, ingredients, instructions, category, difficulty, time, image_path, status, reviewed_by, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        $approved_status = 'approved';
        $ins->bind_param('isssssissi', 
            $recipe_data['user_id'], 
            $recipe_data['title'], 
            $recipe_data['ingredients'], 
            $recipe_data['instructions'],
            $recipe_data['category'],
            $recipe_data['difficulty'],
            $recipe_data['time'],
            $recipe_data['image_path'],
            $approved_status,
            $admin_id
        );
        $ins->execute();
        $ins->close();
    }
}

// Create notification for user
$user_id = intval($recipe['user_id']);
if ($user_id) {
    if ($new_status === 'approved') {
        $msg = "Ваш рецепт \"" . $conn->real_escape_string($recipe['title']) . "\" був схвалений і тепер видно на сайті.";
    } else {
        $msg = "Ваш рецепт \"" . $conn->real_escape_string($recipe['title']) . "\" був відхилений.";
        if ($reason) $msg .= " Причина: " . $conn->real_escape_string($reason);
    }

    $ins = $conn->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
    $ins->bind_param('is', $user_id, $msg);
    $ins->execute();
    $ins->close();
}

echo json_encode(['status' => 'success', 'message' => 'Рецепт оновлено']);
$conn->close();
?>
