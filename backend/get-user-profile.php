<?php
// backend/get-user-profile.php — отримання даних профілю користувача
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Перевірка, чи користувач залогінений
if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не залогінений']);
    exit;
}

$user_id = intval($_SESSION['user']['id'] ?? 0);
$username = $_SESSION['user']['username'] ?? '';
$email = $_SESSION['user']['email'] ?? '';

error_log("DEBUG: get-user-profile.php called for user_id=$user_id");

// Якщо ID є, завантажимо додаткові дані з бази
if ($user_id) {
    // refresh username/email from users table if present
    $stmt = $conn->prepare('SELECT username, email FROM users WHERE id = ? LIMIT 1');
    if ($stmt) {
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $stmt->bind_result($db_username, $db_email);
        if ($stmt->fetch()) {
            $username = $db_username ?: $username;
            $email = $db_email ?: $email;
        }
        $stmt->close();
    }

    // Count user_recipes
    $recipes_count = 0;
    $stmt = $conn->prepare('SELECT COUNT(*) as cnt FROM user_recipes WHERE user_id = ?');
    if ($stmt) {
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $stmt->bind_result($recipes_count);
        $stmt->fetch();
        $stmt->close();
    }
    error_log("DEBUG: user_recipes count=$recipes_count");

    // Count favorites
    $favorites_count = 0;
    $stmt = $conn->prepare('SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ?');
    if ($stmt) {
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $stmt->bind_result($favorites_count);
        $stmt->fetch();
        $stmt->close();
    }
    error_log("DEBUG: favorites count=$favorites_count");

    // Count comments if table exists
    $comments_count = 0;
    $check = $conn->prepare("SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'comments'");
    if ($check) {
        $check->execute();
        $check->bind_result($tbl_exists);
        $check->fetch();
        $check->close();
        if ($tbl_exists) {
            $stmt = $conn->prepare('SELECT COUNT(*) as cnt FROM comments WHERE user_id = ?');
            if ($stmt) {
                $stmt->bind_param('i', $user_id);
                $stmt->execute();
                $stmt->bind_result($comments_count);
                $stmt->fetch();
                $stmt->close();
            }
        }
    }
    error_log("DEBUG: comments count=$comments_count");
} else {
    $recipes_count = 0;
    $comments_count = 0;
    $favorites_count = 0;
}

echo json_encode([
    'status' => 'success',
    'user' => [
        'username' => $username,
        'email' => $email,
        'recipes_count' => intval($recipes_count),
        'comments_count' => intval($comments_count),
        'favorites_count' => intval($favorites_count)
    ]
]);

$conn->close();
?>
