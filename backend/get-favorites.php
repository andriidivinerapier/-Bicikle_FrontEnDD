<?php
require_once 'db.php';
session_start();

$session_user_id = null;
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $session_user_id = $_SESSION['user']['id'] ?? null;
} elseif (isset($_SESSION['user_id'])) {
    $session_user_id = $_SESSION['user_id'];
}

if (!$session_user_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing user id']);
    exit;
}

$user_id = intval($session_user_id);

// Check whether `source` column exists in favorites table
$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorites' AND COLUMN_NAME = 'source'");
$dbName = $conn->real_escape_string($dbname ?? '');
if ($colCheck) {
    // bind parameters safely
    $colCheck->bind_param('s', $dbName);
    $colCheck->execute();
    $colRes = $colCheck->get_result();
    $hasSource = false;
    if ($colRes) {
        $r = $colRes->fetch_assoc();
        $hasSource = intval($r['cnt']) > 0;
    }
    $colCheck->close();
} else {
    $hasSource = false;
}

$favorites = [];
if ($hasSource) {
    $stmt = $conn->prepare('SELECT recipe_id, source FROM favorites WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $source = isset($row['source']) ? $row['source'] : 'admin';
        $favorites[] = ($source . ':' . $row['recipe_id']);
    }
    $stmt->close();
} else {
    // no source column: return recipe ids prefixed with 'admin' by default
    $stmt = $conn->prepare('SELECT recipe_id FROM favorites WHERE user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $favorites[] = ('admin:' . $row['recipe_id']);
    }
    $stmt->close();
}

echo json_encode(['favorites' => $favorites]);

$conn->close();
?>
