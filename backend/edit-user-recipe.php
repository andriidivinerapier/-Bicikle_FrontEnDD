<?php
// backend/edit-user-recipe.php — редагування рецепту користувача
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
    exit;
}

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Потрібна авторизація']);
    exit;
}

$userId = intval($_SESSION['user']['id']);
$recipeId = intval($_POST['recipe_id'] ?? 0);
$title = trim($_POST['title'] ?? '');
$ingredients = trim($_POST['ingredients'] ?? '');
$instructions = trim($_POST['instructions'] ?? '');
$category = trim($_POST['category'] ?? '');
$difficulty = trim($_POST['difficulty'] ?? '');
$time = trim($_POST['time'] ?? '');

if (!$recipeId) {
    echo json_encode(['status' => 'error', 'message' => 'Невірний ідентифікатор рецепту']);
    exit;
}

// Перевірка існування рецепту та власника
$stmt = $conn->prepare('SELECT id, user_id, image_path FROM user_recipes WHERE id = ?');
$stmt->bind_param('i', $recipeId);
$stmt->execute();
$res = $stmt->get_result();
$recipe = $res->fetch_assoc();
$stmt->close();

if (!$recipe) {
    echo json_encode(['status' => 'error', 'message' => 'Рецепт не знайдено']);
    exit;
}

if (intval($recipe['user_id']) !== $userId) {
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонений']);
    exit;
}

$image_path = $recipe['image_path'];

// Support ingredients/steps sent as JSON arrays (like create-recipe.php)
if (isset($_POST['ingredients'])) {
    $ingredientsData = $_POST['ingredients'];
    if (is_string($ingredientsData)) {
        $ingredientsArray = json_decode($ingredientsData, true);
        if (is_array($ingredientsArray)) {
            $ingredients = implode('|', $ingredientsArray);
        } else {
            $ingredients = trim($ingredientsData);
        }
    } elseif (is_array($ingredientsData)) {
        $ingredients = implode('|', $ingredientsData);
    }
}

if (isset($_POST['steps'])) {
    $stepsData = $_POST['steps'];
    if (is_string($stepsData)) {
        $stepsArray = json_decode($stepsData, true);
        if (is_array($stepsArray)) {
            $instructions = implode('|', $stepsArray);
        } else {
            $instructions = trim($stepsData);
        }
    } elseif (is_array($stepsData)) {
        $instructions = implode('|', $stepsData);
    }
}

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
            @unlink($old_file);
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

// Ensure columns exist similar to admin script
$check = $conn->query("SHOW COLUMNS FROM user_recipes LIKE 'difficulty'");
if ($check && $check->num_rows == 0) {
    $conn->query("ALTER TABLE user_recipes ADD COLUMN difficulty VARCHAR(50) DEFAULT ''");
}
$check = $conn->query("SHOW COLUMNS FROM user_recipes LIKE 'cooking_time'");
if ($check && $check->num_rows == 0) {
    $conn->query("ALTER TABLE user_recipes ADD COLUMN cooking_time INT DEFAULT 0");
}

$cooking_time = is_numeric($time) ? intval($time) : 0;

// При зміні рецепту поставимо його на повторну модерацію
$status = 'pending';

// Перевірка обов'язкових полів після розбору ingredients/steps
if (!$title || !$ingredients || !$instructions) {
    echo json_encode(['status' => 'error', 'message' => 'Заповніть всі обов\'язкові поля']);
    exit;
}

$stmt = $conn->prepare('UPDATE user_recipes SET title = ?, ingredients = ?, instructions = ?, category = ?, difficulty = ?, cooking_time = ?, image_path = ?, status = ? WHERE id = ? AND user_id = ?');
$stmt->bind_param('sssssissii', $title, $ingredients, $instructions, $category, $difficulty, $cooking_time, $image_path, $status, $recipeId, $userId);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Рецепт успішно оновлено']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Помилка при оновленні рецепту']);
}

$stmt->close();
$conn->close();
?>
