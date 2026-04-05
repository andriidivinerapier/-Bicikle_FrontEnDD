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

$user_id = intval($_SESSION['user']['id']);

if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'Файл не завантажено']);
    exit;
}

$file = $_FILES['avatar'];
if ($file['size'] > 5 * 1024 * 1024) {
    echo json_encode(['status' => 'error', 'message' => 'Розмір файлу має бути менше 5 МБ']);
    exit;
}

$imageInfo = @getimagesize($file['tmp_name']);
if (!$imageInfo || !in_array($imageInfo[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP], true)) {
    echo json_encode(['status' => 'error', 'message' => 'Підтримуються лише зображення JPG, PNG, GIF або WEBP']);
    exit;
}

$extensionMap = [
    IMAGETYPE_JPEG => 'jpg',
    IMAGETYPE_PNG => 'png',
    IMAGETYPE_GIF => 'gif',
    IMAGETYPE_WEBP => 'webp',
];
$extension = $extensionMap[$imageInfo[2]] ?? 'jpg';
$uploadDir = __DIR__ . '/../uploads/avatars/';
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
    echo json_encode(['status' => 'error', 'message' => 'Не вдалося створити папку для зображень']);
    exit;
}

$filename = uniqid('avatar_', true) . '.' . $extension;
$destination = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    echo json_encode(['status' => 'error', 'message' => 'Не вдалося зберегти файл на сервері']);
    exit;
}

$avatarPath = 'uploads/avatars/' . $filename;

// Ensure users table has avatar_path column
$columnCheck = $conn->prepare("SHOW COLUMNS FROM users LIKE 'avatar_path'");
if ($columnCheck) {
    $columnCheck->execute();
    $columnCheck->store_result();
    if ($columnCheck->num_rows === 0) {
        $conn->query("ALTER TABLE users ADD COLUMN avatar_path VARCHAR(255) DEFAULT ''");
    }
    $columnCheck->close();
}

// Remove previous avatar file if it exists
$stmt = $conn->prepare('SELECT avatar_path FROM users WHERE id = ? LIMIT 1');
if ($stmt) {
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stmt->bind_result($oldAvatarPath);
    if ($stmt->fetch() && $oldAvatarPath) {
        $oldFile = __DIR__ . '/../' . $oldAvatarPath;
        if (strpos($oldAvatarPath, 'uploads/avatars/') === 0 && is_file($oldFile)) {
            @unlink($oldFile);
        }
    }
    $stmt->close();
}

$stmt = $conn->prepare('UPDATE users SET avatar_path = ? WHERE id = ?');
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка підготовки запиту']);
    exit;
}
$stmt->bind_param('si', $avatarPath, $user_id);
$ok = $stmt->execute();
$stmt->close();

if ($ok) {
    $_SESSION['user']['avatar_path'] = $avatarPath;
    echo json_encode(['status' => 'success', 'avatar_path' => $avatarPath]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Не вдалося оновити аватарку в базі даних']);
}

$conn->close();
?>