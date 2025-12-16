<?php
header('Content-Type: application/json; charset=utf-8');
// do not display errors to users, but enable reporting for logs
error_reporting(E_ALL);
ini_set('display_errors', '0');
session_start();
require_once 'db.php';

// only admins can fetch the full user list
if (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Доступ заборонено']);
    $conn->close();
    exit;
}

$q = trim($_GET['q'] ?? '');

// Detect whether users.created_at exists; if not, select an empty string as created_at
$hasCreatedAt = false;
$colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at'");
if ($colCheck) {
    $dbName = $conn->real_escape_string($dbname ?? '');
    $colCheck->bind_param('s', $dbName);
    if ($colCheck->execute()) {
        $colCheck->bind_result($cnt);
        if ($colCheck->fetch()) {
            $hasCreatedAt = intval($cnt) > 0;
        }
    }
    $colCheck->close();
}

$createdExpr = $hasCreatedAt ? 'created_at' : "'' AS created_at";

// Helper to return an error and log details
function _return_error($msg, $internal = '') {
    if ($internal) error_log("get-users.php error: $internal");
    echo json_encode(['status' => 'error', 'message' => $msg]);
}

try {
    if ($q !== '') {
        $like = '%' . $q . '%';
        $sql = "SELECT id, username, email, role, $createdExpr FROM users WHERE username LIKE ? ORDER BY " . ($hasCreatedAt ? 'created_at' : 'id') . " DESC";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            _return_error('Помилка серверу при підготовці запиту', $conn->error);
            $conn->close();
            exit;
        }
        $stmt->bind_param('s', $like);
    } else {
        $sql = "SELECT id, username, email, role, $createdExpr FROM users ORDER BY " . ($hasCreatedAt ? 'created_at' : 'id') . " DESC";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            _return_error('Помилка серверу при підготовці запиту', $conn->error);
            $conn->close();
            exit;
        }
    }

    if (!$stmt->execute()) {
        _return_error('Помилка виконання запиту', $stmt->error);
        $stmt->close();
        $conn->close();
        exit;
    }

    // Use bind_result + fetch to avoid dependency on mysqlnd/get_result()
    $stmt->bind_result($id, $username, $email, $role, $created_at);
    $users = [];
    while ($stmt->fetch()) {
        $users[] = [
            'id' => $id,
            'username' => $username,
            'email' => $email,
            'role' => $role,
            'created_at' => $created_at
        ];
    }
    $stmt->close();

    echo json_encode(['status' => 'success', 'users' => $users]);
} catch (Exception $e) {
    _return_error('Помилка серверу', $e->getMessage());
}

$conn->close();
?>
