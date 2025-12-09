<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';
session_start();

$session_user_id = null;
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $session_user_id = $_SESSION['user']['id'] ?? null;
} elseif (isset($_SESSION['user_id'])) {
    $session_user_id = $_SESSION['user_id'];
}

if (!$session_user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User not authenticated']);
    exit;
}

$user_id = intval($session_user_id);

// Return full recipe rows for user's favorites
// We need to return favorite recipes from both admin `recipes` and `user_recipes` tables.
// Add a `source` field so frontend can distinguish when necessary.
// Build a query that works whether or not `favorites.source` column exists.
// If `source` exists we can use it to filter; otherwise we'll attempt to match recipe_id against both tables.
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

$recipes = [];
if ($hasSource) {
    $sql = "(
        SELECT r.id, r.title, r.ingredients, r.instructions, r.category, r.image_path, r.created_at, u.username, r.user_id as owner_id, 'admin' AS source, f.created_at AS favorited_at
        FROM favorites f
        JOIN recipes r ON f.recipe_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE f.user_id = ? AND f.source = 'admin'
    )
    UNION ALL
    (
        SELECT ur.id, ur.title, ur.ingredients, ur.instructions, ur.category, ur.image_path, ur.created_at, u.username, ur.user_id as owner_id, 'user' AS source, f.created_at AS favorited_at
        FROM favorites f
        JOIN user_recipes ur ON f.recipe_id = ur.id
        LEFT JOIN users u ON ur.user_id = u.id
        WHERE f.user_id = ? AND f.source = 'user'
    )
    ORDER BY favorited_at DESC";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param('ii', $user_id, $user_id);
        if ($stmt->execute()) {
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $recipes[] = [
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'ingredients' => $row['ingredients'],
                    'instructions' => $row['instructions'],
                    'category' => $row['category'],
                    'image_path' => $row['image_path'],
                    'created_at' => $row['created_at'],
                    'username' => $row['username'] ?? null,
                    'user_id' => $row['owner_id'] ?? null,
                    'source' => $row['source'] ?? 'admin'
                ];
            }
        }
        $stmt->close();
    }
} else {
    // No 'source' column — match favorites.recipe_id against both tables without filtering by source
    $sql = "(
        SELECT r.id, r.title, r.ingredients, r.instructions, r.category, r.image_path, r.created_at, u.username, r.user_id as owner_id, 'admin' AS source, f.created_at AS favorited_at
        FROM favorites f
        JOIN recipes r ON f.recipe_id = r.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE f.user_id = ? AND r.id IS NOT NULL
    )
    UNION ALL
    (
        SELECT ur.id, ur.title, ur.ingredients, ur.instructions, ur.category, ur.image_path, ur.created_at, u.username, ur.user_id as owner_id, 'user' AS source, f.created_at AS favorited_at
        FROM favorites f
        JOIN user_recipes ur ON f.recipe_id = ur.id
        LEFT JOIN users u ON ur.user_id = u.id
        WHERE f.user_id = ? AND ur.id IS NOT NULL
    )
    ORDER BY favorited_at DESC";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param('ii', $user_id, $user_id);
        if ($stmt->execute()) {
            $res = $stmt->get_result();
            while ($row = $res->fetch_assoc()) {
                $recipes[] = [
                    'id' => $row['id'],
                    'title' => $row['title'],
                    'ingredients' => $row['ingredients'],
                    'instructions' => $row['instructions'],
                    'category' => $row['category'],
                    'image_path' => $row['image_path'],
                    'created_at' => $row['created_at'],
                    'username' => $row['username'] ?? null,
                    'user_id' => $row['owner_id'] ?? null,
                    'source' => $row['source'] ?? 'admin'
                ];
            }
        }
        $stmt->close();
    }
}

echo json_encode(['status' => 'success', 'recipes' => $recipes]);

$conn->close();
?>
