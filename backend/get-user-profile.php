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

$user_id = $_SESSION['user']['id'] ?? null;
$username = $_SESSION['user']['username'] ?? '';
$email = $_SESSION['user']['email'] ?? '';

// Якщо ID є, завантажимо додаткові дані з бази
if ($user_id) {
    $stmt = $conn->prepare('SELECT id, username, email FROM users WHERE id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stmt->store_result();
    
    if ($stmt->num_rows === 1) {
        $stmt->bind_result($db_id, $db_username, $db_email);
        $stmt->fetch();
        
        $username = $db_username;
        $email = $db_email;
    }
    $stmt->close();
}

// Статистика (поки що статична, можна доповнити логікою з таблиці)
$recipes_count = 12; // Кількість рецептів користувача
$comments_count = 34; // Кількість коментарів
$favorites_count = 89; // Кількість улюблених

echo json_encode([
    'status' => 'success',
    'user' => [
        'username' => $username,
        'email' => $email,
        'recipes_count' => $recipes_count,
        'comments_count' => $comments_count,
        'favorites_count' => $favorites_count
    ]
]);

$conn->close();
?>
