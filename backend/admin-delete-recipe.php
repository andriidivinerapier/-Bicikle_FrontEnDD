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

    // Try to get from user_recipes first (for user-submitted recipes)
    $stmt = $conn->prepare('SELECT image_path FROM user_recipes WHERE id = ?');
    $stmt->bind_param('i', $recipe_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $recipe = $result->fetch_assoc();
    $stmt->close();
    
    $isUserRecipe = !empty($recipe);

    // If not found in user_recipes, try recipes table
    if (!$recipe) {
        $stmt = $conn->prepare('SELECT image_path FROM recipes WHERE id = ?');
        $stmt->bind_param('i', $recipe_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $recipe = $result->fetch_assoc();
        $stmt->close();
    }

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

    // Видалення рецепту з відповідної таблиці
    // Remove related favorites entries (so deleted recipes disappear from users' favorites)
    $hasSource = false;
    $colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorites' AND COLUMN_NAME = 'source'");
    if ($colCheck) {
        $dbName = $conn->real_escape_string($dbname ?? '');
        $colCheck->bind_param('s', $dbName);
        if ($colCheck->execute()) {
            $res = $colCheck->get_result();
            if ($r = $res->fetch_assoc()) {
                $hasSource = intval($r['cnt']) > 0;
            }
        }
        $colCheck->close();
    }

    try {
        if ($hasSource) {
            if ($isUserRecipe) {
                $delFav = $conn->prepare("DELETE FROM favorites WHERE recipe_id = ? AND source = 'user'");
            } else {
                // admin recipes are stored with source 'admin'
                $delFav = $conn->prepare("DELETE FROM favorites WHERE recipe_id = ? AND source = 'admin'");
            }
            if ($delFav) {
                $delFav->bind_param('i', $recipe_id);
                $delFav->execute();
                $delFav->close();
            }
        } else {
            // No source column — remove any favorites by recipe_id
            $delFav = $conn->prepare('DELETE FROM favorites WHERE recipe_id = ?');
            if ($delFav) {
                $delFav->bind_param('i', $recipe_id);
                $delFav->execute();
                $delFav->close();
            }
        }
    } catch (Exception $e) {
        // non-fatal — log and continue
        error_log('Error deleting favorites for recipe ' . $recipe_id . ': ' . $e->getMessage());
    }

    // Видалення рецепту з відповідної таблиці
    if ($isUserRecipe) {
        $stmt = $conn->prepare('DELETE FROM user_recipes WHERE id = ?');
    } else {
        $stmt = $conn->prepare('DELETE FROM recipes WHERE id = ?');
    }
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
