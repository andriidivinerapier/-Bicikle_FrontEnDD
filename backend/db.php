<?php
// db.php — підключення до бази даних MySQL
$host = 'localhost';
$user = 'root'; // змініть, якщо інший користувач
$password = ''; // змініть, якщо є пароль
$dbname = 'recepty_db';

// Створення підключення
$conn = new mysqli($host, $user, $password, $dbname);

// Перевірка підключення
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Встановлення кодування UTF-8
$conn->set_charset('utf8');
?>
