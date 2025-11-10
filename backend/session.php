<?php
// session.php — перевірка чи залогінений користувач
header('Content-Type: application/json; charset=utf-8');
session_start();

if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $user = $_SESSION['user'];
    echo json_encode(['status' => 'logged', 'username' => $user['username'] ?? '']);
} else {
    echo json_encode(['status' => 'logged_out']);
}
?>
