<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Try to get the recipe marked as featured
$resp = ['status' => 'error', 'message' => 'No featured recipe found'];

$sql = "SELECT id, user_id, title, ingredients, instructions, category, difficulty, time, image_path, created_at
        FROM recipes
        WHERE is_featured = 1 AND status = 'approved'
        ORDER BY created_at DESC
        LIMIT 1";

$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $resp = ['status' => 'success', 'recipe' => $row];
} else {
    // fallback: return latest approved recipe
    $sql2 = "SELECT id, user_id, title, ingredients, instructions, category, difficulty, time, image_path, created_at
            FROM recipes
            WHERE status = 'approved'
            ORDER BY created_at DESC
            LIMIT 1";
    $r2 = $conn->query($sql2);
    if ($r2 && $r2->num_rows > 0) {
        $row = $r2->fetch_assoc();
        $resp = ['status' => 'success', 'recipe' => $row, 'fallback' => true];
    }
}

echo json_encode($resp);
$conn->close();
?>