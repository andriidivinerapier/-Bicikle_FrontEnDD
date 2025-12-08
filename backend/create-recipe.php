<?php
// backend/create-recipe.php — створення нового рецепту користувачем
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не автентифікований']);
    exit;
}

$user_id = intval($_SESSION['user']['id'] ?? 0);
if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Невідомий користувач']);
    exit;
}

$title = trim($_POST['title'] ?? '');
$ingredients = trim($_POST['ingredients'] ?? '');
$instructions = trim($_POST['instructions'] ?? '');
$category = trim($_POST['category'] ?? '');

if ($title === '' || $ingredients === '' || $instructions === '') {
    echo json_encode(['status' => 'error', 'message' => 'Заповніть всі обов\'язкові поля']);
    exit;
}

// Ensure recipes table exists
$create_sql = "CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    category VARCHAR(100) DEFAULT '',
    image_path VARCHAR(255) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
$conn->query($create_sql);

// Ensure status and review columns exist (add if missing)
$check = $conn->query("SHOW COLUMNS FROM recipes LIKE 'status'");
if ($check && $check->num_rows == 0) {
    $conn->query("ALTER TABLE recipes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'approved'");
}
$check2 = $conn->query("SHOW COLUMNS FROM recipes LIKE 'review_reason'");
if ($check2 && $check2->num_rows == 0) {
    $conn->query("ALTER TABLE recipes ADD COLUMN review_reason TEXT DEFAULT NULL");
}
$check3 = $conn->query("SHOW COLUMNS FROM recipes LIKE 'reviewed_by'");
if ($check3 && $check3->num_rows == 0) {
    $conn->query("ALTER TABLE recipes ADD COLUMN reviewed_by INT DEFAULT NULL");
}
$check4 = $conn->query("SHOW COLUMNS FROM recipes LIKE 'reviewed_at'");
if ($check4 && $check4->num_rows == 0) {
    $conn->query("ALTER TABLE recipes ADD COLUMN reviewed_at DATETIME DEFAULT NULL");
}

$image_path = '';
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $tmp = $_FILES['image']['tmp_name'];
    $name = basename($_FILES['image']['name']);
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed = ['jpg','jpeg','png','gif','webp'];
    if (!in_array($ext, $allowed)) {
        echo json_encode(['status' => 'error', 'message' => 'Неприпустимий формат зображення']);
        exit;
    }

    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir)) @mkdir($uploadsDir, 0755, true);

    try {
        $newName = 'recipe_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
    } catch (Exception $e) {
        $newName = 'recipe_' . time() . '_' . rand(1000,9999) . '.' . $ext;
    }
    $dest = $uploadsDir . '/' . $newName;
    if (move_uploaded_file($tmp, $dest)) {
        $image_path = 'uploads/' . $newName;
    }
}

$status = 'pending'; // user-submitted recipes go to moderation
$stmt = $conn->prepare('INSERT INTO recipes (user_id, title, ingredients, instructions, category, image_path, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
$stmt->bind_param('issssss', $user_id, $title, $ingredients, $instructions, $category, $image_path, $status);
if ($stmt->execute()) {
    $inserted_id = $stmt->insert_id;
    echo json_encode(['status' => 'success', 'id' => $inserted_id, 'message' => 'Рецепт відправлено на модерацію']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Помилка при збереженні рецепту']);
}

$stmt->close();
$conn->close();
?>
