<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only POST']);
    exit;
}

$email = trim($_POST['email'] ?? '');
$code = trim($_POST['code'] ?? '');
$newPassword = $_POST['new_password'] ?? '';

if (!$email || !$code || !$newPassword) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'All fields required']);
    exit;
}

// Find latest unused reset for email
$stmt = $conn->prepare('SELECT id, code_hash, expires_at, used, user_id FROM password_resets WHERE email = ? ORDER BY created_at DESC LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid code or email']);
    exit;
}
$row = $res->fetch_assoc();
$stmt->close();

if ($row['used']) {
    echo json_encode(['status' => 'error', 'message' => 'Code already used']);
    exit;
}

if (new DateTime() > new DateTime($row['expires_at'])) {
    echo json_encode(['status' => 'error', 'message' => 'Code expired']);
    exit;
}

if (!password_verify($code, $row['code_hash'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid code']);
    exit;
}

// Update user's password
$hashed = password_hash($newPassword, PASSWORD_DEFAULT);
$update = $conn->prepare('UPDATE users SET password = ? WHERE email = ?');
$update->bind_param('ss', $hashed, $email);
if (!$update->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update password']);
    exit;
}
$update->close();

// Mark reset as used
$mark = $conn->prepare('UPDATE password_resets SET used = 1 WHERE id = ?');
$mark->bind_param('i', $row['id']);
$mark->execute();
$mark->close();

echo json_encode(['status' => 'ok', 'message' => 'Password updated']);
exit;

?>
