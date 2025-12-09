<?php
require_once 'db.php';
session_start();
$session_user_id = null;
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $session_user_id = $_SESSION['user']['id'] ?? null;
} elseif (isset($_SESSION['user_id'])) {
    $session_user_id = $_SESSION['user_id'];
}

if (!$session_user_id || !isset($_POST['recipe_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing user or recipe id']);
    exit;
}

$user_id = intval($session_user_id);
$recipe_id = intval($_POST['recipe_id']);

$source = isset($_POST['source']) ? $_POST['source'] : null;

// Detect if `source` column exists
$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorites' AND COLUMN_NAME = 'source'");
$dbName = $conn->real_escape_string($dbname ?? '');
$hasSource = false;
if ($colCheck) {
    $colCheck->bind_param('s', $dbName);
    $colCheck->execute();
    $cr = $colCheck->get_result();
    if ($cr) {
        $r = $cr->fetch_assoc();
        $hasSource = intval($r['cnt']) > 0;
    }
    $colCheck->close();
}

if ($hasSource && $source) {
    $stmt = $conn->prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ? AND source = ?');
    $stmt->bind_param('iis', $user_id, $recipe_id, $source);
} else {
    // delete any matching favorite regardless of source
    $stmt = $conn->prepare('DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?');
    $stmt->bind_param('ii', $user_id, $recipe_id);
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'status' => 'success']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to remove favorite']);
}
$stmt->close();
$conn->close();
?>
