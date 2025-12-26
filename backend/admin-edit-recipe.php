<?php
// backend/admin-edit-recipe.php — редагування рецепту
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Перевірка, що користувач адмін
if (!isset($_SESSION['user']) || $_SESSION['user']['role'] !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонений']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $recipe_id = intval($_POST['recipe_id'] ?? 0);
    $title = trim($_POST['title'] ?? '');
    // Accept ingredients/instructions either as string or as array (from edit modal inputs)
    if (isset($_POST['ingredients']) && is_array($_POST['ingredients'])) {
        $ingredients_array = array_filter($_POST['ingredients'], function($item) { return trim($item) !== ''; });
        $ingredients = implode('|', $ingredients_array);
    } else {
        $ingredients = trim($_POST['ingredients'] ?? '');
    }

    if (isset($_POST['steps']) && is_array($_POST['steps'])) {
        $steps_array = array_filter($_POST['steps'], function($item) { return trim($item) !== ''; });
        $instructions = implode('|', $steps_array);
    } else {
        // backward compatibility: 'instructions' field
        $instructions = trim($_POST['instructions'] ?? '');
    }
    $category = trim($_POST['category'] ?? '');
    $difficulty = trim($_POST['difficulty'] ?? '');
    $time = trim($_POST['time'] ?? '');

    if (!$recipe_id || !$title || !$ingredients || !$instructions) {
        echo json_encode(['status' => 'error', 'message' => 'Заповніть всі обов\'язкові поля']);
        exit;
    }

    // Перевірка існування рецепту
    $stmt = $conn->prepare('SELECT image_path FROM recipes WHERE id = ?');
    $stmt->bind_param('i', $recipe_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $recipe = $result->fetch_assoc();
    $stmt->close();

    if (!$recipe) {
        echo json_encode(['status' => 'error', 'message' => 'Рецепт не знайдено']);
        exit;
    }

    $image_path = $recipe['image_path'];

    // Обробка нового зображення
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $tmp = $_FILES['image']['tmp_name'];
        $name = basename($_FILES['image']['name']);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!in_array($ext, $allowed)) {
            echo json_encode(['status' => 'error', 'message' => 'Неприпустимий формат зображення']);
            exit;
        }

        // Видалення старого зображення
        if ($image_path) {
            $old_file = __DIR__ . '/../' . $image_path;
            if (file_exists($old_file)) {
                unlink($old_file);
            }
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

    // Оновлення рецепту
    // Ensure difficulty and cooking_time columns exist
    $check = $conn->query("SHOW COLUMNS FROM recipes LIKE 'difficulty'");
    if ($check && $check->num_rows == 0) {
        $conn->query("ALTER TABLE recipes ADD COLUMN difficulty VARCHAR(50) DEFAULT ''");
    }
    $check = $conn->query("SHOW COLUMNS FROM recipes LIKE 'cooking_time'");
    if ($check && $check->num_rows == 0) {
        $conn->query("ALTER TABLE recipes ADD COLUMN cooking_time INT DEFAULT 0");
    }

    // Ensure legacy 'time' column exists for compatibility
    $check = $conn->query("SHOW COLUMNS FROM recipes LIKE 'time'");
    if ($check && $check->num_rows == 0) {
        $conn->query("ALTER TABLE recipes ADD COLUMN `time` INT DEFAULT 0");
    }

    $cooking_time = is_numeric($time) ? intval($time) : 0;
    // Update both cooking_time and legacy time column so frontend/backends reading either one see changes
    $stmt = $conn->prepare('UPDATE recipes SET title = ?, ingredients = ?, instructions = ?, category = ?, difficulty = ?, cooking_time = ?, `time` = ?, image_path = ? WHERE id = ?');
    $stmt->bind_param('sssssissi', $title, $ingredients, $instructions, $category, $difficulty, $cooking_time, $cooking_time, $image_path, $recipe_id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Рецепт успішно оновлено']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при оновленні рецепту', 'debug' => $stmt->error]);
    }

    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}

$conn->close();
?>
