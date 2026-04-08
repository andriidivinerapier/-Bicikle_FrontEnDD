<?php
// db.php — підключення до бази даних MySQL
$host = 'rt613684.mysql.tools';
$user = 'rt613684_recepty'; // змініть, якщо інший користувач
$password = '!Y66)bNz4m'; // змініть, якщо є пароль
$dbname = 'rt613684_recepty';

// Створення підключення
$conn = new mysqli($host, $user, $password, $dbname);

// Перевірка підключення
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}

// Встановлення кодування UTF-8
$conn->set_charset('utf8');
?>
