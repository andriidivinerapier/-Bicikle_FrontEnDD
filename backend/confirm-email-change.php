<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не залогінений']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
    exit;
}

$code = trim($_POST['code'] ?? '');

if (!isset($_SESSION['pending_email_change']) || empty($_SESSION['pending_email_change'])) {
    echo json_encode(['success' => false, 'error' => 'Немає запиту на зміну пошти']);
    exit;
}

$pending = $_SESSION['pending_email_change'];
if (time() > ($pending['expires'] ?? 0)) {
    unset($_SESSION['pending_email_change']);
    echo json_encode(['success' => false, 'error' => 'Код протерміновано']);
    exit;
}

if ($code !== ($pending['code'] ?? '')) {
    echo json_encode(['success' => false, 'error' => 'Невірний код']);
    exit;
}

$user_id = intval($_SESSION['user']['id']);
$newEmail = $pending['new_email'];

// Update users table
$stmt = $conn->prepare('UPDATE users SET email = ? WHERE id = ?');
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка підготовки запиту']);
    exit;
}
$stmt->bind_param('si', $newEmail, $user_id);
$ok = $stmt->execute();
$stmt->close();

if ($ok) {
    $_SESSION['user']['email'] = $newEmail;
    unset($_SESSION['pending_email_change']);
    echo json_encode(['success' => true, 'email' => $newEmail]);
} else {
    echo json_encode(['success' => false, 'error' => 'Не вдалося оновити пошту']);
}

$conn->close();
?>
