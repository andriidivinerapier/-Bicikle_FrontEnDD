<?php
// login.php — логінізація користувача
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Приймаємо POST-запит
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Перевірка на порожні поля
    if (!$email || !$password) {
        echo json_encode(['status' => 'error', 'message' => 'Всі поля обовʼязкові']);
        exit;
    }

    // Пошук користувача за email
    $stmt = $conn->prepare('SELECT id, username, password, role FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 1) {
        $stmt->bind_result($id, $username, $hashed_password, $role);
        $stmt->fetch();
        // Перевірка пароля
        if (password_verify($password, $hashed_password)) {
            $_SESSION['user'] = [
                'id' => $id,
                'username' => $username,
                'email' => $email,
                'role' => $role
            ]; // Зберігаємо користувача в сесії
            echo json_encode(['status' => 'success', 'username' => $username, 'role' => $role]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Невірний логін або пароль']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Невірний логін або пароль']);
    }
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}
?>
