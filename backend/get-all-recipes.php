<?php
// backend/get-all-recipes.php — повертає затверджені рецепти користувачів з таблиці user_recipes
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Pagination and search params
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 12;
$search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : '%';
$category = isset($_GET['category']) && $_GET['category'] !== '' ? $_GET['category'] : null;

if ($page < 1) $page = 1;
if ($per_page < 1 || $per_page > 100) $per_page = 12;
$offset = ($page - 1) * $per_page;

try {
    // Normalize category: accept english keys (e.g. 'desserts') or Ukrainian labels (e.g. 'Десерти').
    $category_label = '';
    if ($category) {
        $map = [
            'breakfast' => 'Сніданки',
            'lunch' => 'Обід',
            'dinner' => 'Вечеря',
            'desserts' => 'Десерти',
            'salads' => 'Салати',
            'soups' => 'Супи',
            'snacks' => 'Закуски',
            'drinks' => 'Напої',
            'vegan' => 'Веганські',
            'pastries' => 'Тістечка',
            'all' => 'Усі'
        ];
        $catKey = mb_strtolower(trim($category), 'UTF-8');
        if (isset($map[$catKey])) {
            $category_label = $map[$catKey];
        } else {
            // If user passed a Ukrainian label, keep it as second comparison value as-is
            $category_label = $category;
        }
    }
    // Count total matching user recipes
    if ($category) {
        // compare lowercased category against either provided key or localized label
        $countStmt = $conn->prepare(
            'SELECT COUNT(*) as cnt FROM user_recipes ur
             LEFT JOIN users u ON ur.user_id = u.id
             WHERE (ur.title LIKE ? OR ur.category LIKE ? OR COALESCE(u.username, "") LIKE ?)
               AND ur.status = "approved"
               AND (LOWER(ur.category) = LOWER(?) OR LOWER(ur.category) = LOWER(?))'
        );
        $countStmt->bind_param('sssss', $search, $search, $search, $category, $category_label);
    } else {
        $countStmt = $conn->prepare(
            'SELECT COUNT(*) as cnt FROM user_recipes ur
             LEFT JOIN users u ON ur.user_id = u.id
             WHERE (ur.title LIKE ? OR ur.category LIKE ? OR COALESCE(u.username, "") LIKE ?)
               AND ur.status = "approved"'
        );
        $countStmt->bind_param('sss', $search, $search, $search);
    }

    if (!$countStmt->execute()) throw new Exception('Count execute failed: ' . $countStmt->error);
    $countRes = $countStmt->get_result();
    $total_recipes = intval($countRes->fetch_assoc()['cnt'] ?? 0);
    $countStmt->close();

    $total_pages = (int)ceil($total_recipes / $per_page);

    // Fetch paginated results
        if ($category) {
                $stmt = $conn->prepare(
                        'SELECT ur.id, ur.title, ur.ingredients, ur.instructions, ur.category, ur.image_path, ur.created_at, 
                                        COALESCE(u.username, "Невідомий автор") AS username, u.id as user_id, "user" as source
                         FROM user_recipes ur
                         LEFT JOIN users u ON ur.user_id = u.id
                         WHERE (ur.title LIKE ? OR ur.category LIKE ? OR COALESCE(u.username, "") LIKE ?)
                             AND ur.status = "approved"
                             AND (LOWER(ur.category) = LOWER(?) OR LOWER(ur.category) = LOWER(?))
                         ORDER BY ur.created_at DESC
                         LIMIT ?, ?'
                );
                $stmt->bind_param('sssssii', $search, $search, $search, $category, $category_label, $offset, $per_page);
        } else {
        $stmt = $conn->prepare(
            'SELECT ur.id, ur.title, ur.ingredients, ur.instructions, ur.category, ur.image_path, ur.created_at, 
                    COALESCE(u.username, "Невідомий автор") AS username, u.id as user_id, "user" as source
             FROM user_recipes ur
             LEFT JOIN users u ON ur.user_id = u.id
             WHERE (ur.title LIKE ? OR ur.category LIKE ? OR COALESCE(u.username, "") LIKE ?)
               AND ur.status = "approved"
             ORDER BY ur.created_at DESC
             LIMIT ?, ?'
        );
        $stmt->bind_param('sssii', $search, $search, $search, $offset, $per_page);
    }

    if ($stmt->execute()) {
        $res = $stmt->get_result();
        $recipes = [];
        while ($row = $res->fetch_assoc()) {
            $recipes[] = $row;
        }

        echo json_encode([
            'status' => 'success',
            'recipes' => $recipes,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $per_page,
                'total_recipes' => $total_recipes,
                'total_pages' => $total_pages
            ]
        ]);
    } else {
        throw new Exception('Query failed: ' . $stmt->error);
    }

    $stmt->close();
    $conn->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
