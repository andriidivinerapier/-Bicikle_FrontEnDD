<?php
// backend/admin-review-recipe.php — адмін схвалює або відхиляє рецепт
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
action:
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

// Get recipe info
$stmt = $conn->prepare('SELECT id, user_id, title FROM recipes WHERE id = ?');
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

$upd = $conn->prepare('UPDATE recipes SET status = ?, review_reason = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?');
$upd->bind_param('sisi', $new_status, $reason, $admin_id, $recipe_id);
if (!$upd->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка оновлення рецепту']);
    $upd->close();
    $conn->close();
    exit;
}
$upd->close();

// Create notification for user
$user_id = intval($recipe['user_id']);
if ($user_id) {
    if ($new_status === 'approved') {
        $msg = "Ваш рецепт \"" . $conn->real_escape_string($recipe['title']) . "\" був схвалений.";
    } else {
        $msg = "Ваш рецепт \"" . $conn->real_escape_string($recipe['title']) . "\" був відхилений.";
        if ($reason) $msg .= " Причина: " . $conn->real_escape_string($reason);
    }

    $ins = $conn->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
    $ins->bind_param('is', $user_id, $msg);
    $ins->execute();
    $ins->close();
}

echo json_encode(['status' => 'success', 'message' => 'Оновлено']);
$conn->close();
?>