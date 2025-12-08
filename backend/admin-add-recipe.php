<?php
// backend/admin-add-recipe.php — додавання рецепту адміном
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Перевірка, що користувач адмін
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонений']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $ingredients = trim($_POST['ingredients'] ?? '');
    $instructions = trim($_POST['instructions'] ?? '');
    $category = trim($_POST['category'] ?? '');

    if (!$title || !$ingredients || !$instructions) {
        echo json_encode(['status' => 'error', 'message' => 'Заповніть всі обов\'язкові поля']);
        exit;
    }

    // Обробка зображення
    $image_path = '';
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $tmp = $_FILES['image']['tmp_name'];
        $name = basename($_FILES['image']['name']);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!in_array($ext, $allowed)) {
            echo json_encode(['status' => 'error', 'message' => 'Неприпустимий формат зображення']);
            exit;
        }

        $upload_dir = __DIR__ . '/../uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        $filename = uniqid() . '.' . $ext;
        $upload_path = $upload_dir . $filename;

        if (move_uploaded_file($tmp, $upload_path)) {
            $image_path = 'uploads/' . $filename;
        }
    }

    // Додавання рецепту
    $admin_id = $_SESSION['user']['id'];
    // Ensure status column exists
    $check = $conn->query("SHOW COLUMNS FROM recipes LIKE 'status'");
    if ($check && $check->num_rows == 0) {
        $conn->query("ALTER TABLE recipes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'approved'");
    }

    $status = 'approved';
    $stmt = $conn->prepare('INSERT INTO recipes (user_id, title, ingredients, instructions, category, image_path, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
    $stmt->bind_param('issssss', $admin_id, $title, $ingredients, $instructions, $category, $image_path, $status);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Рецепт успішно додано']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при додаванні рецепту']);
    }

    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}

$conn->close();
?>
