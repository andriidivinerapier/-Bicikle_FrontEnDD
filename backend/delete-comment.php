<?php
// backend/delete-comment.php — видалення коментаря (тільки власник або адмін)
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
    exit;
}

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not authenticated']);
    exit;
}

$userId = intval($_SESSION['user']['id']);
$userRole = $_SESSION['user']['role'] ?? 'user';

$commentId = intval($_POST['comment_id'] ?? 0);
if (!$commentId) {
    echo json_encode(['status' => 'error', 'message' => 'Missing comment_id']);
    exit;
}

// fetch comment owner
$stmt = $conn->prepare('SELECT id, user_id, content, recipe_id FROM comments WHERE id = ? LIMIT 1');
if (!$stmt) { echo json_encode(['status' => 'error', 'message' => 'DB error']); exit; }
$stmt->bind_param('i', $commentId);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row) { echo json_encode(['status' => 'error', 'message' => 'Comment not found']); exit; }

$ownerId = intval($row['user_id']);
if ($ownerId !== $userId && $userRole !== 'admin') {
    echo json_encode(['status' => 'error', 'message' => 'Access denied']);
    exit;
}

// preserve some values for notification after deletion
$comment_content = $row['content'] ?? '';
$comment_recipe_id = intval($row['recipe_id'] ?? 0);
$del = $conn->prepare('DELETE FROM comments WHERE id = ?');
if (!$del) {
    $err = $conn->error;
    error_log('delete-comment prepare failed: ' . $err);
    echo json_encode(['status' => 'error', 'message' => 'DB prepare error', 'db_error' => $err]);
    exit;
}
$del->bind_param('i', $commentId);
if (!$del->execute()) {
    $err = $del->error ?: $conn->error;
    error_log('delete-comment execute failed: ' . $err);
    echo json_encode(['status' => 'error', 'message' => 'Execute failed', 'db_error' => $err]);
    $del->close();
    $conn->close();
    exit;
}
$affected = $del->affected_rows;
$del->close();
if ($affected > 0) {
    // If deleted by admin and owner is not the admin, create a notification for the comment owner
    $adminId = $userId;
    $ownerId = $ownerId ?? intval($row['user_id'] ?? 0);
    $reason = trim($_POST['reason'] ?? '');
    if ($userRole === 'admin' && $ownerId && $ownerId !== $adminId) {
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

        $titlePart = '';
        if ($comment_recipe_id) {
            // try to get recipe title from either recipes or user_recipes
            $recipe_title = '';
            $rstmt = $conn->prepare('SELECT title FROM recipes WHERE id = ? LIMIT 1');
            if ($rstmt) {
                $rstmt->bind_param('i', $comment_recipe_id);
                $rstmt->execute();
                $rres = $rstmt->get_result();
                $rrow = $rres->fetch_assoc();
                if ($rrow && !empty($rrow['title'])) $recipe_title = $rrow['title'];
                $rstmt->close();
            }
            if (empty($recipe_title)) {
                $urst = $conn->prepare('SELECT title FROM user_recipes WHERE id = ? LIMIT 1');
                if ($urst) {
                    $urst->bind_param('i', $comment_recipe_id);
                    $urst->execute();
                    $ures = $urst->get_result();
                    $urow = $ures->fetch_assoc();
                    if ($urow && !empty($urow['title'])) $recipe_title = $urow['title'];
                    $urst->close();
                }
            }
            if (!empty($recipe_title)) {
                $titlePart = ' до рецепту "' . $conn->real_escape_string($recipe_title) . '"';
            } else {
                $titlePart = ' до рецепту #' . intval($comment_recipe_id);
            }
        }
        $msg = "Ваш коментар" . $titlePart . " був видалений адміністратором.";
        if ($reason) $msg .= " Причина: " . $conn->real_escape_string($reason);

        $ins = $conn->prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
        if ($ins) {
            $ins->bind_param('is', $ownerId, $msg);
            $ins->execute();
            $ins->close();
        }
    }

    echo json_encode(['status' => 'success', 'message' => 'Comment deleted', 'affected' => $affected]);
} else {
    // no rows affected — maybe comment already deleted or wrong id
    error_log('delete-comment: no rows affected for id=' . $commentId . ' user=' . $userId);
    echo json_encode(['status' => 'error', 'message' => 'No rows deleted (not found or permission)', 'affected' => $affected]);
}
$conn->close();
exit;
?>
