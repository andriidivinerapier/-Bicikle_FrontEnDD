<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод']);
    exit;
}

$recipe_id = intval($_POST['recipe_id'] ?? 0);
$content = trim($_POST['content'] ?? '');

if (!$recipe_id || $content === '') {
    echo json_encode(['status' => 'error', 'message' => 'Невірні параметри']);
    exit;
}

// Ensure comments table exists
$create_sql = "CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    username VARCHAR(255) DEFAULT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
@$conn->query($create_sql);

// require user to be logged in to post comments
$user_id = null;
$username = null;
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $user_id = intval($_SESSION['user']['id'] ?? 0) ?: null;
    $username = $_SESSION['user']['username'] ?? null;
}
if (!$user_id) {
    echo json_encode(['status' => 'auth_required', 'message' => 'Потрібно увійти, щоб додавати коментарі']);
    $conn->close();
    exit;
}

$stmt = $conn->prepare('INSERT INTO comments (recipe_id, user_id, username, content) VALUES (?, ?, ?, ?)');
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка підготовки запиту']);
    exit;
}
$stmt->bind_param('iiss', $recipe_id, $user_id, $username, $content);
if (!$stmt->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Помилка при збереженні коментаря']);
    $stmt->close();
    exit;
}
$inserted_id = $stmt->insert_id;
$stmt->close();

// Return the inserted comment
$stmt = $conn->prepare('SELECT id, recipe_id, user_id, username, content, created_at FROM comments WHERE id = ? LIMIT 1');
if ($stmt) {
    $stmt->bind_param('i', $inserted_id);
    $stmt->execute();
    $stmt->bind_result($id, $r_id, $u_id, $u_name, $c_text, $created_at);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'success', 'comment' => ['id'=>$id,'recipe_id'=>$r_id,'user_id'=>$u_id,'username'=>$u_name,'content'=>$c_text,'created_at'=>$created_at]]);
        $stmt->close();
        $conn->close();
        exit;
    }
    $stmt->close();
}

echo json_encode(['status' => 'error', 'message' => 'Не вдалося отримати коментар']);
$conn->close();
exit;
?>