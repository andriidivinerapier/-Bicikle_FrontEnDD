<?php
// backend/fix-user-recipes-status.php — виправляємо статус у старих рецептів
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Встановлюємо 'pending' для всіх порожніх status
$result = $conn->query("UPDATE user_recipes SET status = 'pending' WHERE status = '' OR status IS NULL");

if ($result) {
    $affected = $conn->affected_rows;
    echo json_encode(['status' => 'success', 'message' => "Оновлено $affected рецептів"]);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}

$conn->close();
?>
