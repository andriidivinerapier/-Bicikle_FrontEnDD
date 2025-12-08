<?php
// backend/create-admin.php — скрипт для створення адмін акаунту
require_once 'db.php';

// Адмін дані
$admin_username = 'admin';
$admin_email = 'admin@recepty.com';
$admin_password = 'Admin123456'; // Змініть на безпечний пароль!

// Перевірка таблиці users та додавання ролі
$check_role_sql = "SHOW COLUMNS FROM users LIKE 'role'";
$result = $conn->query($check_role_sql);

if ($result->num_rows == 0) {
    // Додаємо колону role, якщо її немає
    $alter_sql = "ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'";
    if ($conn->query($alter_sql)) {
        echo "Колона 'role' успішно додана до таблиці users.\n";
    } else {
        echo "Помилка при додаванні колони: " . $conn->error . "\n";
        exit;
    }
}

// Перевірка, чи адмін уже існує
$stmt = $conn->prepare('SELECT id FROM users WHERE email = ?');
$stmt->bind_param('s', $admin_email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo "Адмін акаунт з email {$admin_email} вже існує!\n";
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

// Хешування пароля
$hashed_password = password_hash($admin_password, PASSWORD_DEFAULT);

// Додавання адмін користувача
$stmt = $conn->prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)');
$admin_role = 'admin';
$stmt->bind_param('ssss', $admin_username, $admin_email, $hashed_password, $admin_role);

if ($stmt->execute()) {
    echo "✓ Адмін акаунт успішно створено!\n";
    echo "Email: {$admin_email}\n";
    echo "Пароль: {$admin_password}\n";
    echo "Будь ласка, змініть пароль після першого входу!\n";
} else {
    echo "Помилка при створенні адмін акаунту: " . $stmt->error . "\n";
}

$stmt->close();
$conn->close();
?>
