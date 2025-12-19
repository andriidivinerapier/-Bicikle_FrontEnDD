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
    // also collect titles to notify commenters
    $getRecipes = $conn->prepare('SELECT id, image_path, title FROM user_recipes WHERE user_id = ?');
    $getRecipes->bind_param('i', $userId);
    $getRecipes->execute();
    $rres = $getRecipes->get_result();
    $recipeIds = [];
    $recipeTitles = [];
    while ($row = $rres->fetch_assoc()) {
        if (!empty($row['image_path'])) {
            $file_path = __DIR__ . '/../' . $row['image_path'];
            if (file_exists($file_path)) @unlink($file_path);
        }
        $rid = intval($row['id']);
        $recipeIds[] = $rid;
        $recipeTitles[$rid] = $row['title'] ?? '';
    }
    $getRecipes->close();

    // If there are recipes, notify commenters whose comments will be removed
    if (!empty($recipeIds)) {
        try {
            $in = implode(',', array_map('intval', $recipeIds));
            // gather commenters per recipe
            $rows = $conn->query("SELECT DISTINCT user_id, recipe_id FROM comments WHERE recipe_id IN ($in)");
            $notifyMap = []; // user_id => array of recipe_ids
            if ($rows) {
                while ($r = $rows->fetch_assoc()) {
                    $uid = intval($r['user_id'] ?? 0);
                    $rrid = intval($r['recipe_id'] ?? 0);
                    if ($uid <= 0) continue;
                    if (!isset($notifyMap[$uid])) $notifyMap[$uid] = [];
                    $notifyMap[$uid][$rrid] = true;
                }
                $rows->close();
            }

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

            // Insert notifications for each commenter (except the user being deleted)
            foreach ($notifyMap as $uid => $rset) {
                if ($uid === $userId) continue;
                $rids = array_keys($rset);
                $titles = [];
                foreach ($rids as $rr) {
                    $t = trim($recipeTitles[$rr] ?? '');
                    if ($t !== '') $titles[] = '"' . $conn->real_escape_string($t) . '"';
                    else $titles[] = '#' . intval($rr);
                }
                if (count($titles) === 1) {
                    $msg = 'Ваш коментар до рецепту ' . $titles[0] . ' був видалений через видалення рецепту.';
                } else {
                    $msg = 'Ваші коментарі до рецептів ' . implode(', ', $titles) . ' були видалені через видалення рецептів.';
                }
                $ins = $conn->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
                if ($ins) { $ins->bind_param('is', $uid, $msg); $ins->execute(); $ins->close(); }
            }
        } catch (Exception $e) {
            error_log('Error notifying commenters for user recipes: ' . $e->getMessage());
        }
    }

    // --- Additional cleanup ---
    // Delete favorites that pointed to this user's recipes (others' favorites)
    if (!empty($recipeIds)) {
        try {
            $in = implode(',', array_map('intval', $recipeIds));
            $conn->query("DELETE FROM favorites WHERE recipe_id IN ($in)");
        } catch (Exception $e) {
            error_log('Error deleting favorites for user recipes: ' . $e->getMessage());
        }

        // Delete comments on this user's recipes
        try {
            $in = implode(',', array_map('intval', $recipeIds));
            $conn->query("DELETE FROM comments WHERE recipe_id IN ($in)");
        } catch (Exception $e) {
            error_log('Error deleting comments on user recipes: ' . $e->getMessage());
        }
    }

    // Delete comments authored by this user
    try {
        $delUserComments = $conn->prepare('DELETE FROM comments WHERE user_id = ?');
        if ($delUserComments) { $delUserComments->bind_param('i', $userId); $delUserComments->execute(); $delUserComments->close(); }
    } catch (Exception $e) {
        error_log('Error deleting comments by user ' . $userId . ': ' . $e->getMessage());
    }

    // Delete notifications belonging to this user
    try {
        $delNot = $conn->prepare('DELETE FROM notifications WHERE user_id = ?');
        if ($delNot) { $delNot->bind_param('i', $userId); $delNot->execute(); $delNot->close(); }
    } catch (Exception $e) {
        // notifications table might not exist or other error — log and continue
        error_log('Error deleting notifications for user ' . $userId . ': ' . $e->getMessage());
    }

    // Delete user_recipes rows (we already removed files earlier)
    try {
        $delUR = $conn->prepare('DELETE FROM user_recipes WHERE user_id = ?');
        if ($delUR) { $delUR->bind_param('i', $userId); $delUR->execute(); $delUR->close(); }
    } catch (Exception $e) {
        error_log('Error deleting user_recipes for user ' . $userId . ': ' . $e->getMessage());
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
