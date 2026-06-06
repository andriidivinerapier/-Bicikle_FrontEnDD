<?php
// migrate-add-user-blocked.php — додати поле blocked до таблиці users
header('Content-Type: application/json; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', '1');
require_once 'db.php';

$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'blocked'");
if (!$colCheck) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка підготовки перевірки схеми', 'error' => $conn->error]);
    $conn->close();
    exit;
}
$dbName = $conn->real_escape_string($dbname ?? '');
$colCheck->bind_param('s', $dbName);
$colCheck->execute();
$colCheck->bind_result($cnt);
$colCheck->fetch();
$colCheck->close();

if (intval($cnt) > 0) {
    $blockedExists = true;
} else {
    $blockedExists = false;
}

$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'blocked_until'");
if (!$colCheck) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка підготовки перевірки схеми', 'error' => $conn->error]);
    $conn->close();
    exit;
}
$dbName = $conn->real_escape_string($dbname ?? '');
$colCheck->bind_param('s', $dbName);
$colCheck->execute();
$colCheck->bind_result($cnt);
$colCheck->fetch();
$colCheck->close();

$blockedUntilExists = intval($cnt) > 0;

$messages = [];
if (!$blockedExists) {
    $sql = "ALTER TABLE users ADD COLUMN blocked TINYINT(1) NOT NULL DEFAULT 0";
    if ($conn->query($sql) === TRUE) {
        $messages[] = 'Поле blocked додано до таблиці users';
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не вдалося додати поле blocked', 'error' => $conn->error]);
        $conn->close();
        exit;
    }
}
if (!$blockedUntilExists) {
    $sql = "ALTER TABLE users ADD COLUMN blocked_until DATETIME NULL DEFAULT NULL";
    if ($conn->query($sql) === TRUE) {
        $messages[] = 'Поле blocked_until додано до таблиці users';
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Не вдалося додати поле blocked_until', 'error' => $conn->error]);
        $conn->close();
        exit;
    }
}

if (count($messages) === 0) {
    echo json_encode(['status' => 'success', 'message' => 'Поля blocked та blocked_until вже існують']);
} else {
    echo json_encode(['status' => 'success', 'message' => implode('; ', $messages)]);
}

$conn->close();
?>