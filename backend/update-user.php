<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не залогінений']);
    exit;
}

$user_id = intval($_SESSION['user']['id']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
    exit;
}

$type = $_POST['type'] ?? '';
if ($type === 'name') {
    $newName = trim($_POST['name'] ?? '');
    if ($newName === '') {
        echo json_encode(['status' => 'error', 'message' => 'Ім\'я не може бути порожнім']);
        exit;
    }
    $stmt = $conn->prepare('UPDATE users SET username = ? WHERE id = ?');
    $stmt->bind_param('si', $newName, $user_id);
    $ok = $stmt->execute();
    $stmt->close();
    if ($ok) {
        $_SESSION['user']['username'] = $newName;
        echo json_encode(['status' => 'success', 'username' => $newName]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не вдалося оновити ім\'я']);
    }
    $conn->close();
    exit;
}

if ($type === 'email') {
    $newEmail = trim($_POST['email'] ?? '');
    if ($newEmail === '' || !filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Некоректна пошта']);
        exit;
    }
    // Check if email is used by another user
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
    $stmt->bind_param('si', $newEmail, $user_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->close();
        echo json_encode(['status' => 'error', 'message' => 'Пошта вже використовується']);
        exit;
    }
    $stmt->close();

    $stmt = $conn->prepare('UPDATE users SET email = ? WHERE id = ?');
    $stmt->bind_param('si', $newEmail, $user_id);
    $ok = $stmt->execute();
    $stmt->close();
    if ($ok) {
        $_SESSION['user']['email'] = $newEmail;
        echo json_encode(['status' => 'success', 'email' => $newEmail]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не вдалося оновити пошту']);
    }
    $conn->close();
    exit;
}

if ($type === 'password') {
    $current = $_POST['current'] ?? '';
    $new = $_POST['new'] ?? '';
    if ($current === '' || $new === '') {
        echo json_encode(['status' => 'error', 'message' => 'Всі поля обов\'язкові']);
        exit;
    }
    // Get current hash
    $stmt = $conn->prepare('SELECT password FROM users WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stmt->bind_result($hash);
    if (!$stmt->fetch()) {
        $stmt->close();
        echo json_encode(['status' => 'error', 'message' => 'Користувача не знайдено']);
        exit;
    }
    $stmt->close();

    if (!password_verify($current, $hash)) {
        echo json_encode(['status' => 'error', 'message' => 'Поточний пароль невірний']);
        exit;
    }

    $newHash = password_hash($new, PASSWORD_DEFAULT);
    $stmt = $conn->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->bind_param('si', $newHash, $user_id);
    $ok = $stmt->execute();
    $stmt->close();
    if ($ok) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не вдалося змінити пароль']);
    }
    $conn->close();
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Невідома дія']);
$conn->close();
?>
