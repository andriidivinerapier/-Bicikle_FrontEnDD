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
// validate pending email as additional safety
$newEmail = trim($pending['new_email'] ?? '');
$newEmail = mb_strtolower($newEmail, 'UTF-8');
$emailPattern = '/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/u';
if ($newEmail === '' || !filter_var($newEmail, FILTER_VALIDATE_EMAIL) || !preg_match($emailPattern, $newEmail)) {
    unset($_SESSION['pending_email_change']);
    echo json_encode(['success' => false, 'error' => 'Некоректна пошта']);
    exit;
}

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
