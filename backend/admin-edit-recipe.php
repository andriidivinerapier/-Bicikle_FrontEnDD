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
    $ingredients = trim($_POST['ingredients'] ?? '');
    $instructions = trim($_POST['instructions'] ?? '');
    $category = trim($_POST['category'] ?? '');

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
    $stmt = $conn->prepare('UPDATE recipes SET title = ?, ingredients = ?, instructions = ?, category = ?, image_path = ? WHERE id = ?');
    $stmt->bind_param('sssssi', $title, $ingredients, $instructions, $category, $image_path, $recipe_id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Рецепт успішно оновлено']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при оновленні рецепту']);
    }

    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}

$conn->close();
?>
