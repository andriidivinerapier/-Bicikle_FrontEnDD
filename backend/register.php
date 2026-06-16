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

    // Нормалізуємо email до нижнього регістру і перевіряємо формат строгіше
    $email = mb_strtolower($email, 'UTF-8');
    $emailPattern = '/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/u';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match($emailPattern, $email)) {
        echo json_encode(['status' => 'error', 'message' => 'Невірний формат email']);
        exit;
    }

    // Забороняємо використовувати email як пароль або дуже схожі значення
    if ($password === $email || stripos($password, '@') !== false && stripos($password, substr($email, 0, strpos($email, '@'))) !== false) {
        echo json_encode(['status' => 'error', 'message' => 'Невалідний пароль']);
        exit;
    }

    // Перевірка мінімальної довжини пароля (мінімум 7 символів)
    if (mb_strlen($password, 'UTF-8') < 7) {
        echo json_encode(['status' => 'error', 'message' => 'Пароль має містити мінімум 7 символів']);
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

    // Додавання користувача (включаємо created_at, якщо стовпець присутній в таблиці)
    // Якщо стовпець відсутній, MySQL ігнорує додаткове поле при виконанні, тому використання DEFAULT значення безпечне.
    $stmt = $conn->prepare('INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, NOW())');
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
