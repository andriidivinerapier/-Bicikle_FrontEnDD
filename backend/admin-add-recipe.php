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
    $category = trim($_POST['category'] ?? '');
    $difficulty = trim($_POST['difficulty'] ?? '');
    $time = trim($_POST['time'] ?? '');

    // Обробка інгредієнтів (масив)
    $ingredients_array = $_POST['ingredients'] ?? [];
    $ingredients_array = array_filter($ingredients_array, function($item) {
        return trim($item) !== '';
    });
    $ingredients = implode('|', $ingredients_array);

    // Обробка етапів (масив)
    $steps_array = $_POST['steps'] ?? [];
    $steps_array = array_filter($steps_array, function($item) {
        return trim($item) !== '';
    });
    $instructions = implode('|', $steps_array);

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

    $admin_id = $_SESSION['user']['id'];
    // Ensure status column exists
    $check = $conn->query("SHOW COLUMNS FROM recipes LIKE 'status'");
    if ($check && $check->num_rows == 0) {
        $conn->query("ALTER TABLE recipes ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'approved'");
    }

    // Ensure difficulty and time columns exist
    $cols = [
        'difficulty' => "VARCHAR(50) DEFAULT ''",
        'time' => 'INT DEFAULT 0',
        'is_featured' => 'TINYINT(1) DEFAULT 0'
    ];
    foreach ($cols as $col => $def) {
        $check = $conn->query("SHOW COLUMNS FROM recipes LIKE '$col'");
        if ($check && $check->num_rows == 0) {
            $conn->query("ALTER TABLE recipes ADD COLUMN $col $def");
        }
    }

    $status = 'approved';
    $time_int = is_numeric($time) ? intval($time) : 0;
    $is_featured = (isset($_POST['is_featured']) && ($_POST['is_featured'] === '1' || $_POST['is_featured'] === 'on')) ? 1 : 0;

    // If marking featured, unset previous featured
    if ($is_featured) {
        $conn->query("UPDATE recipes SET is_featured = 0 WHERE is_featured = 1");
    }

    $stmt = $conn->prepare('INSERT INTO recipes (user_id, title, ingredients, instructions, category, difficulty, time, image_path, is_featured, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
    $stmt->bind_param('isssssisis', $admin_id, $title, $ingredients, $instructions, $category, $difficulty, $time_int, $image_path, $is_featured, $status);

    if ($stmt->execute()) {
        $inserted_id = $stmt->insert_id;
        // If legacy column 'cooking_time' exists, sync it for this row
        $check_cook = $conn->query("SHOW COLUMNS FROM recipes LIKE 'cooking_time'");
        if ($check_cook && $check_cook->num_rows > 0) {
            $conn->query("UPDATE recipes SET cooking_time = " . intval($time_int) . " WHERE id = " . intval($inserted_id));
        }

        echo json_encode(['status' => 'success', 'message' => 'Рецепт успішно додано', 'id' => $inserted_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при додаванні рецепту']);
    }

    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}

$conn->close();
?>
