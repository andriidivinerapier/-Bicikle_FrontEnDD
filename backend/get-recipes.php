<?php
// backend/get-recipes.php — отримати рецепти з фільтруванням і пагінацією

require 'db.php';

header('Content-Type: application/json');

// Параметри
$category = isset($_GET['category']) ? trim($_GET['category']) : 'all';
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 12;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Валідація
if ($page < 1) $page = 1;
if ($per_page < 1 || $per_page > 100) $per_page = 12;

$offset = ($page - 1) * $per_page;

try {
    // Escape search and category
    $search_escaped = !empty($search) ? $conn->real_escape_string($search) : '';
    $category_escaped = (!empty($category) && $category !== 'all' && $category !== 'Усі') ? $conn->real_escape_string($category) : '';
    
    // Build WHERE conditions for both tables
    $where_conditions = [];
    if (!empty($category_escaped)) {
        $where_conditions[] = "category = '$category_escaped'";
    }
    if (!empty($search_escaped)) {
        $where_conditions[] = "(title LIKE '%$search_escaped%' OR instructions LIKE '%$search_escaped%')";
    }
    
    $where = !empty($where_conditions) ? " AND " . implode(" AND ", $where_conditions) : "";
    
    // Count ONLY admin recipes from recipes table
    $count_sql = "SELECT COUNT(*) as cnt FROM recipes WHERE status = 'approved'$where";
    
    $total_recipes = 0;
    
    $result = $conn->query($count_sql);
    if ($result) {
        $row = $result->fetch_assoc();
        $total_recipes = intval($row['cnt']);
    }
    
    $total_pages = ceil($total_recipes / $per_page);

    // Get ONLY admin recipes from recipes table (STRICTLY from recipes table only, not user_recipes)
    $sql = "
        SELECT 
            r.id,
            r.title,
            r.category,
            r.ingredients,
            r.instructions,
            r.image_path,
            r.difficulty,
            r.`time` AS cooking_time,
            COALESCE(u.username, 'Recepty') as author,
            r.created_at,
            'admin' as source
        FROM recipes r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.status = 'approved'$where
        ORDER BY r.created_at DESC
        LIMIT $offset, $per_page
    ";

    $result = $conn->query($sql);
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error);
    }

    $recipes = [];
    while ($row = $result->fetch_assoc()) {
        // Розділяємо інгредієнти та інструкції
        $row['ingredients_array'] = array_filter(explode('|', $row['ingredients']));
        $row['instructions_array'] = array_filter(explode('|', $row['instructions']));
        unset($row['ingredients'], $row['instructions']);
        
        $recipes[] = $row;
    }

    echo json_encode([
        'status' => 'success',
        'data' => $recipes,
        'pagination' => [
            'current_page' => $page,
            'per_page' => $per_page,
            'total_recipes' => $total_recipes,
            'total_pages' => $total_pages
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>
