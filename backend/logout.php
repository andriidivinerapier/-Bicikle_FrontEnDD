<?php
// logout.php — вихід з аккаунту
header('Content-Type: application/json; charset=utf-8');
session_start();

// Видаляємо дані сесії
if (isset($_SESSION['user'])) {
    unset($_SESSION['user']);
}

// Опційно знищуємо сесію повністю
session_destroy();

echo json_encode(['status' => 'success']);
?>
