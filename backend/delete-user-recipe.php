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

$stmt = $conn->prepare('SELECT id, user_id, image_path, title FROM user_recipes WHERE id = ?');
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

// Повідомити авторів коментарів, що їх коментарі видалено через видалення рецепту
try {
    $commenters = [];
    $cstmt = $conn->prepare('SELECT DISTINCT user_id FROM comments WHERE recipe_id = ?');
    if ($cstmt) {
        $cstmt->bind_param('i', $recipeId);
        $cstmt->execute();
        $cres = $cstmt->get_result();
        while ($crow = $cres->fetch_assoc()) {
            $uid = intval($crow['user_id'] ?? 0);
            if ($uid > 0) $commenters[$uid] = true;
        }
        $cstmt->close();
    }

    // Prepare recipe title for message
    $recipe_title = '';
    if (!empty($recipe['title'])) $recipe_title = $recipe['title'];
    if (empty($recipe_title)) $recipe_title = '';

    // Ensure notifications table exists
    $checkN = $conn->query("SHOW TABLES LIKE 'notifications'");
    if ($checkN && $checkN->num_rows == 0) {
        $createN = "CREATE TABLE notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            message TEXT NOT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        $conn->query($createN);
    }

    foreach (array_keys($commenters) as $uid) {
        if ($uid === $userId) continue; // don't notify the user who deleted the recipe
        $titlePart = '';
        if (!empty($recipe_title)) {
            $titlePart = ' до рецепту "' . $conn->real_escape_string($recipe_title) . '"';
        } else {
            $titlePart = ' до рецепту #' . intval($recipeId);
        }
        $msg = 'Ваш коментар' . $titlePart . ' був видалений через видалення рецепту.';
        $ins = $conn->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
        if ($ins) {
            $ins->bind_param('is', $uid, $msg);
            $ins->execute();
            $ins->close();
        }
    }
} catch (Exception $e) {
    error_log('Error notifying commenters for recipe ' . $recipeId . ': ' . $e->getMessage());
}

// Видалити коментарі, пов'язані з цим рецептом
try {
    $delComments = $conn->prepare('DELETE FROM comments WHERE recipe_id = ?');
    if ($delComments) {
        $delComments->bind_param('i', $recipeId);
        $delComments->execute();
        $delComments->close();
    }
} catch (Exception $e) {
    error_log('Error deleting comments for recipe ' . $recipeId . ': ' . $e->getMessage());
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
