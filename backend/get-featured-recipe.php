<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Try to get the recipe marked as featured
// Only return an explicitly marked featured recipe. Do NOT fallback to the latest approved recipe,
// otherwise newly created approved recipes would appear as "recipe of the day" unexpectedly.
$resp = ['status' => 'error', 'message' => 'No featured recipe set'];

$sql = "SELECT id, user_id, title, ingredients, instructions, category, difficulty, time, image_path, created_at
        FROM recipes
        WHERE is_featured = 1 AND status = 'approved'
        ORDER BY created_at DESC
        LIMIT 1";

$result = $conn->query($sql);
if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $resp = ['status' => 'success', 'recipe' => $row];
}

echo json_encode($resp);
$conn->close();
?>