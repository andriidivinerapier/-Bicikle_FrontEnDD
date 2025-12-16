<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
    exit;
}

if (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Потрібна авторизація адміністратора']);
    exit;
}

$currentAdminId = intval($_SESSION['user']['id'] ?? 0);
$userId = intval($_POST['user_id'] ?? 0);

if (!$userId) {
    echo json_encode(['status' => 'error', 'message' => 'Невідомий користувач']);
    exit;
}

// Prevent deleting self
if ($userId === $currentAdminId) {
    echo json_encode(['status' => 'error', 'message' => 'Неможливо видалити свій акаунт']);
    exit;
}

// Fetch target user's role
$stmt = $conn->prepare('SELECT id, role FROM users WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $userId);
$stmt->execute();
$res = $stmt->get_result();
$target = $res->fetch_assoc();
$stmt->close();

if (!$target) {
    echo json_encode(['status' => 'error', 'message' => 'Користувача не знайдено']);
    exit;
}

if (isset($target['role']) && $target['role'] === 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Неможливо видалити адміністратора']);
    exit;
}

// Begin transaction
$conn->begin_transaction();
try {
    // Remove favorites created by this user
    $delFav = $conn->prepare('DELETE FROM favorites WHERE user_id = ?');
    if ($delFav) { $delFav->bind_param('i', $userId); $delFav->execute(); $delFav->close(); }

    // Delete user's uploaded recipes (user_recipes) and associated images
    $getRecipes = $conn->prepare('SELECT id, image_path FROM user_recipes WHERE user_id = ?');
    $getRecipes->bind_param('i', $userId);
    $getRecipes->execute();
    $rres = $getRecipes->get_result();
    $recipeIds = [];
    while ($row = $rres->fetch_assoc()) {
        if (!empty($row['image_path'])) {
            $file_path = __DIR__ . '/../' . $row['image_path'];
            if (file_exists($file_path)) @unlink($file_path);
        }
        $recipeIds[] = intval($row['id']);
    }
    $getRecipes->close();

    if (!empty($recipeIds)) {
        // Delete user recipes rows
        $delUR = $conn->prepare('DELETE FROM user_recipes WHERE user_id = ?');
        $delUR->bind_param('i', $userId);
        $delUR->execute();
        $delUR->close();
    }

    // Finally delete user row
    $delUser = $conn->prepare('DELETE FROM users WHERE id = ?');
    $delUser->bind_param('i', $userId);
    $delUser->execute();
    $delUser->close();

    $conn->commit();
    echo json_encode(['status' => 'success', 'message' => 'Користувача успішно видалено']);
} catch (Exception $e) {
    $conn->rollback();
    error_log('Delete user error: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Помилка при видаленні користувача']);
}

$conn->close();
?>
