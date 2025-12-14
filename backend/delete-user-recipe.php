<?php
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

if (!$recipeId) {
    echo json_encode(['status' => 'error', 'message' => 'Невідомий рецепт']);
    exit;
}

// Fetch recipe and verify ownership
$stmt = $conn->prepare('SELECT id, user_id, image_path FROM user_recipes WHERE id = ?');
$stmt->bind_param('i', $recipeId);
$stmt->execute();
$res = $stmt->get_result();
$recipe = $res->fetch_assoc();
$stmt->close();

if (!$recipe) {
    echo json_encode(['status' => 'error', 'message' => 'Рецепт не знайдено або вже видалено']);
    exit;
}

if (intval($recipe['user_id']) !== $userId) {
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонений']);
    exit;
}

// Delete image file if exists
if (!empty($recipe['image_path'])) {
    $file_path = __DIR__ . '/../' . $recipe['image_path'];
    if (file_exists($file_path)) {
        @unlink($file_path);
    }
}

// Remove related favorites entries (if favorites table has source column use 'user')
$hasSource = false;
$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorites' AND COLUMN_NAME = 'source'");
if ($colCheck) {
    $dbName = $conn->real_escape_string($dbname ?? '');
    $colCheck->bind_param('s', $dbName);
    if ($colCheck->execute()) {
        $r = $colCheck->get_result()->fetch_assoc();
        $hasSource = intval($r['cnt']) > 0;
    }
    $colCheck->close();
}

try {
    if ($hasSource) {
        $delFav = $conn->prepare("DELETE FROM favorites WHERE recipe_id = ? AND source = 'user'");
    } else {
        $delFav = $conn->prepare('DELETE FROM favorites WHERE recipe_id = ?');
    }
    if ($delFav) {
        $delFav->bind_param('i', $recipeId);
        $delFav->execute();
        $delFav->close();
    }
} catch (Exception $e) {
    error_log('Error deleting favorites for recipe ' . $recipeId . ': ' . $e->getMessage());
}

// Delete the recipe row
$del = $conn->prepare('DELETE FROM user_recipes WHERE id = ? AND user_id = ?');
$del->bind_param('ii', $recipeId, $userId);
if ($del->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Рецепт успішно видалено']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Помилка при видаленні рецепту']);
}
$del->close();

$conn->close();
?>
