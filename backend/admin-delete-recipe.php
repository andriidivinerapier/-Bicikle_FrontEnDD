<?php
// backend/admin-delete-recipe.php — видалення рецепту
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

    if (!$recipe_id) {
        echo json_encode(['status' => 'error', 'message' => 'Невідомий рецепт']);
        exit;
    }

    // Отримання інформації про рецепт
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

    // Видалення файлу зображення
    if ($recipe['image_path']) {
        $file_path = __DIR__ . '/../' . $recipe['image_path'];
        if (file_exists($file_path)) {
            unlink($file_path);
        }
    }

    // Видалення рецепту
    $stmt = $conn->prepare('DELETE FROM recipes WHERE id = ?');
    $stmt->bind_param('i', $recipe_id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Рецепт успішно видалено']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Помилка при видаленні рецепту']);
    }

    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
}

$conn->close();
?>
