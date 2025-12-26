<?php
// backend/add-comment.php — додає коментар для рецепту
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
    exit;
}

$recipe_id = intval($_POST['recipe_id'] ?? 0);
$content = trim($_POST['content'] ?? '');

if (!$recipe_id || $content === '') {
    // log for debugging
    error_log('[add-comment] missing parameters recipe_id=' . var_export($_POST['recipe_id'] ?? null, true) . ' content=' . var_export($_POST['content'] ?? null, true));
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters', 'debug' => ['received_recipe_id' => $_POST['recipe_id'] ?? null, 'received_content' => $_POST['content'] ?? null]]);
    exit;
}

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    error_log('[add-comment] not logged in; session=' . var_export($_SESSION, true));
    echo json_encode(['status' => 'error', 'message' => 'Not logged in', 'debug' => ['session' => $_SESSION]]);
    exit;
}

$user_id = intval($_SESSION['user']['id'] ?? 0);
$username = $_SESSION['user']['username'] ?? 'User';

// Insert comment
// comments table stores user_id but not username; get username via users table when returning
$stmt = $conn->prepare('INSERT INTO comments (recipe_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())');
if (!$stmt) {
    error_log('[add-comment] prepare failed: ' . $conn->error);
    echo json_encode(['status' => 'error', 'message' => 'DB prepare failed', 'debug' => ['db_error' => $conn->error]]);
    exit;
}
$stmt->bind_param('iis', $recipe_id, $user_id, $content);
$ok = $stmt->execute();
if ($ok) {
    $inserted_id = $stmt->insert_id;
    $stmt->close();
    // Fetch the inserted row to return
    // Select comment and user name via LEFT JOIN
    $stmt2 = $conn->prepare(
        'SELECT c.id, c.recipe_id, c.user_id, COALESCE(u.username, "User") AS username, c.content, c.created_at '
        . 'FROM comments c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ? LIMIT 1'
    );
    if ($stmt2) {
        $stmt2->bind_param('i', $inserted_id);
        $stmt2->execute();
        $stmt2->bind_result($id, $r, $u, $un, $c, $created_at);
        if ($stmt2->fetch()) {
            error_log('[add-comment] inserted id=' . intval($id) . ' recipe=' . intval($r) . ' user=' . intval($u));
            echo json_encode(['status' => 'success', 'comment' => [
                'id' => intval($id),
                'recipe_id' => intval($r),
                'user_id' => intval($u),
                'username' => $un,
                'content' => $c,
                'created_at' => $created_at
            ]]);
            $stmt2->close();
            $conn->close();
            exit;
        }
        $stmt2->close();
    }
    echo json_encode(['status' => 'success', 'comment' => null]);
    $conn->close();
    exit;
} else {
    $err = $stmt->error;
    $stmt->close();
    error_log('[add-comment] execute failed: ' . $err);
    echo json_encode(['status' => 'error', 'message' => 'Insert failed: ' . $err, 'debug' => ['db_error' => $err]]);
    $conn->close();
    exit;
}
?>
