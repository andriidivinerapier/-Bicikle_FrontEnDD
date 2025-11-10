<?php
// register.php — реєстрація користувача
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Приймаємо POST-запит
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    // Перевірка на порожні поля
    if (!$username || !$email || !$password) {
        echo json_encode(['status' => 'error', 'message' => 'Всі поля обовʼязкові']);
        exit;
    }

    // Перевірка, чи існує користувач із таким email
    $stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        echo json_encode(['status' => 'error', 'message' => 'Email вже використовується']);
        exit;
    }
    $stmt->close();

    // Хешування пароля
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Додавання користувача
    $stmt = $conn->prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
    $stmt->bind_param('sss', $username, $email, $hashed_password);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при реєстрації']);
    }
    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}
?>
