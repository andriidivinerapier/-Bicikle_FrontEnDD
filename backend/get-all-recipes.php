<?php
// backend/get-all-recipes.php — повертає затверджені рецепти користувачів з таблиці user_recipes
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Get optional search parameter and optional category filter
$search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : '%';
$category = isset($_GET['category']) && $_GET['category'] !== '' ? $_GET['category'] : null;

// Build query — if category is provided, filter by exact category key
if ($category) {
    $stmt = $conn->prepare(
        'SELECT ur.id, ur.title, ur.ingredients, ur.instructions, ur.category, ur.image_path, ur.created_at, 
                COALESCE(u.username, "Невідомий автор") AS username, u.id as user_id, "user" as source
         FROM user_recipes ur
         LEFT JOIN users u ON ur.user_id = u.id
         WHERE (ur.title LIKE ? OR ur.category LIKE ? OR COALESCE(u.username, "") LIKE ?)
           AND ur.status = "approved"
           AND ur.category = ?
         ORDER BY ur.created_at DESC'
    );
    if ($stmt) {
        $stmt->bind_param('ssss', $search, $search, $search, $category);
    }
} else {
    $stmt = $conn->prepare(
        'SELECT ur.id, ur.title, ur.ingredients, ur.instructions, ur.category, ur.image_path, ur.created_at, 
                COALESCE(u.username, "Невідомий автор") AS username, u.id as user_id, "user" as source
         FROM user_recipes ur
         LEFT JOIN users u ON ur.user_id = u.id
         WHERE (ur.title LIKE ? OR ur.category LIKE ? OR COALESCE(u.username, "") LIKE ?)
           AND ur.status = "approved"
         ORDER BY ur.created_at DESC'
    );
    if ($stmt) {
        $stmt->bind_param('sss', $search, $search, $search);
    }
}

if ($stmt) {
    if ($stmt->execute()) {
        $res = $stmt->get_result();
        $recipes = [];
        while ($row = $res->fetch_assoc()) {
            $recipes[] = $row;
        }
        echo json_encode(['status' => 'success', 'recipes' => $recipes, 'count' => count($recipes)]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Execute failed', 'error' => $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Prepare failed', 'error' => $conn->error]);
}

$conn->close();
?>
