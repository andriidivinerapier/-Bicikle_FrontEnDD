<?php
// backend/create-recipe.php — створення нового рецепту користувачем
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';

// Debug logging
$debug_log = [];
$debug_log['session_user'] = isset($_SESSION['user']) ? 'set' : 'not_set';

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не автентифікований', 'debug' => $debug_log]);
    exit;
}

$user_id = intval($_SESSION['user']['id'] ?? 0);
if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Невідомий користувач', 'debug' => $debug_log]);
    exit;
}

$title = trim($_POST['title'] ?? '');
$difficulty = trim($_POST['difficulty'] ?? '');
$time = trim($_POST['time'] ?? '');
$category = trim($_POST['category'] ?? '');

// Обробка інгредієнтів та етапів
$ingredients = '';
$instructions = '';

if (isset($_POST['ingredients'])) {
    $ingredientsData = $_POST['ingredients'];
    if (is_string($ingredientsData)) {
        $ingredientsArray = json_decode($ingredientsData, true);
        if (is_array($ingredientsArray)) {
            $ingredients = implode('|', $ingredientsArray);
        } else {
            $ingredients = $ingredientsData;
        }
    } elseif (is_array($ingredientsData)) {
        $ingredients = implode('|', $ingredientsData);
    }
}

if (isset($_POST['steps'])) {
    $stepsData = $_POST['steps'];
    if (is_string($stepsData)) {
        $stepsArray = json_decode($stepsData, true);
        if (is_array($stepsArray)) {
            $instructions = implode('|', $stepsArray);
        } else {
            $instructions = $stepsData;
        }
    } elseif (is_array($stepsData)) {
        $instructions = implode('|', $stepsData);
    }
}

// Якщо є старі формати (для сумісності)
if (empty($ingredients) && isset($_POST['ingredients_old'])) {
    $ingredients = trim($_POST['ingredients_old']);
}
if (empty($instructions) && isset($_POST['instructions'])) {
    $instructions = trim($_POST['instructions']);
}

if ($title === '' || $ingredients === '' || $instructions === '') {
    echo json_encode(['status' => 'error', 'message' => 'Заповніть всі обов\'язкові поля']);
    exit;
}

// Ensure recipes table exists with all necessary columns
$create_sql = "CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    category VARCHAR(100) DEFAULT '',
    difficulty VARCHAR(50) DEFAULT '',
    time INT DEFAULT 0,
    image_path VARCHAR(255) DEFAULT '',
    is_featured TINYINT(1) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'approved',
    review_reason TEXT DEFAULT NULL,
    reviewed_by INT DEFAULT NULL,
    reviewed_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
$conn->query($create_sql);

// Add missing columns if needed
$columns_to_add = [
    'status' => "VARCHAR(20) NOT NULL DEFAULT 'approved'",
    'review_reason' => 'TEXT DEFAULT NULL',
    'reviewed_by' => 'INT DEFAULT NULL',
    'reviewed_at' => 'DATETIME DEFAULT NULL',
    'difficulty' => "VARCHAR(50) DEFAULT ''",
    'time' => 'INT DEFAULT 0'
];

// add is_featured if missing
$columns_to_add['is_featured'] = 'TINYINT(1) DEFAULT 0';

foreach ($columns_to_add as $col_name => $col_def) {
    $check = $conn->query("SHOW COLUMNS FROM recipes LIKE '$col_name'");
    if ($check && $check->num_rows == 0) {
        $conn->query("ALTER TABLE recipes ADD COLUMN $col_name $col_def");
    }
}

$image_path = '';
$debug_upload = [];

if (isset($_FILES['image'])) {
    $debug_upload['files_received'] = true;
    $debug_upload['error_code'] = $_FILES['image']['error'];
    
    if ($_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $tmp = $_FILES['image']['tmp_name'];
        $name = basename($_FILES['image']['name']);
        $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
        $allowed = ['jpg','jpeg','png','gif','webp'];
        
        $debug_upload['filename'] = $name;
        $debug_upload['extension'] = $ext;
        $debug_upload['is_allowed'] = in_array($ext, $allowed);
        
        if (!in_array($ext, $allowed)) {
            echo json_encode(['status' => 'error', 'message' => 'Неприпустимий формат зображення']);
            exit;
        }

        $uploadsDir = __DIR__ . '/../uploads';
        
        // Ensure uploads directory exists with proper permissions
        if (!is_dir($uploadsDir)) {
            $mkdir_result = @mkdir($uploadsDir, 0755, true);
            $debug_upload['mkdir_attempted'] = true;
            $debug_upload['mkdir_success'] = $mkdir_result;
        }
        $debug_upload['directory_exists'] = is_dir($uploadsDir);
        $debug_upload['directory_writable'] = is_writable($uploadsDir);

        try {
            $newName = 'recipe_' . time() . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        } catch (Exception $e) {
            $newName = 'recipe_' . time() . '_' . rand(1000,9999) . '.' . $ext;
        }
        $dest = $uploadsDir . '/' . $newName;
        
        $debug_upload['destination'] = $dest;
        $debug_upload['tmp_name'] = $tmp;
        $debug_upload['file_exists_before'] = file_exists($tmp);
        
        if (move_uploaded_file($tmp, $dest)) {
            $image_path = 'uploads/' . $newName;
            $debug_upload['upload_success'] = true;
            $debug_upload['file_exists_after'] = file_exists($dest);
        } else {
            $debug_upload['upload_success'] = false;
            $debug_upload['last_error'] = error_get_last();
        }
    } else {
        $debug_upload['upload_error'] = $_FILES['image']['error'];
    }
} else {
    $debug_upload['files_received'] = false;
}

// Check if user is admin or regular user
$is_admin = isset($_SESSION['user']['role']) && $_SESSION['user']['role'] === 'admin';

// Admin recipes go to 'recipes' table with status='approved'
// User recipes go to 'user_recipes' table with status='pending'
$table = $is_admin ? 'recipes' : 'user_recipes';
$status = $is_admin ? 'approved' : 'pending';

// Ensure user_recipes table has the same structure
if ($table === 'user_recipes') {
    $create_user_recipes = "CREATE TABLE IF NOT EXISTS user_recipes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        ingredients TEXT NOT NULL,
        instructions TEXT NOT NULL,
        category VARCHAR(100) DEFAULT '',
        difficulty VARCHAR(50) DEFAULT '',
        time INT DEFAULT 0,
        image_path VARCHAR(255) DEFAULT '',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        review_reason TEXT DEFAULT NULL,
        reviewed_by INT DEFAULT NULL,
        reviewed_at DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
    $conn->query($create_user_recipes);
    
    // Add missing columns to user_recipes
    foreach ($columns_to_add as $col_name => $col_def) {
        $check = $conn->query("SHOW COLUMNS FROM user_recipes LIKE '$col_name'");
        if ($check && $check->num_rows == 0) {
            $conn->query("ALTER TABLE user_recipes ADD COLUMN $col_name $col_def");
        }
    }
}

$time_int = intval($time);

// handle is_featured flag (only admins can set it)
$is_featured = 0;
if ($is_admin && isset($_POST['is_featured']) && ($_POST['is_featured'] === '1' || $_POST['is_featured'] === 1 || $_POST['is_featured'] === 'on')) {
    $is_featured = 1;
}

// If no image was uploaded, set a placeholder so frontend can display something
if (empty($image_path)) {
    $image_path = 'images/homepage/salad1.jpg';
}

$stmt = $conn->prepare("INSERT INTO $table (user_id, title, ingredients, instructions, category, difficulty, time, image_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt = null;
// If tables support is_featured, include it in insert
$check_feat = $conn->query("SHOW COLUMNS FROM $table LIKE 'is_featured'");
if ($check_feat && $check_feat->num_rows > 0) {
    // If admin but set featured, ensure only one featured recipe
    if ($is_featured && $table === 'recipes') {
        $conn->query("UPDATE recipes SET is_featured = 0 WHERE is_featured = 1");
    }
    $stmt = $conn->prepare("INSERT INTO $table (user_id, title, ingredients, instructions, category, difficulty, time, image_path, is_featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('isssssisis', $user_id, $title, $ingredients, $instructions, $category, $difficulty, $time_int, $image_path, $is_featured, $status);
} else {
    $stmt = $conn->prepare("INSERT INTO $table (user_id, title, ingredients, instructions, category, difficulty, time, image_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('isssssiss', $user_id, $title, $ingredients, $instructions, $category, $difficulty, $time_int, $image_path, $status);
}

    if ($stmt->execute()) {
    $inserted_id = $stmt->insert_id;
    if ($is_admin) {
        $message = 'Рецепт успішно додано';
    } else {
        $message = 'Рецепт відправлено на модерацію адміністратором';
    }
    // Return image_path so frontend can verify the saved image location
    echo json_encode(['status' => 'success', 'id' => $inserted_id, 'image_path' => $image_path, 'message' => $message, 'debug_upload' => $debug_upload]);
} else {
    $debug_log['insert_error'] = $stmt->error;
    $debug_log['table'] = $table;
    $debug_log['bind_params'] = ['user_id' => $user_id, 'title_len' => strlen($title), 'ingredients_len' => strlen($ingredients), 'instructions_len' => strlen($instructions)];
    $debug_log['debug_upload'] = $debug_upload;
    echo json_encode(['status' => 'error', 'message' => 'Помилка при збереженні рецепту: ' . $stmt->error, 'debug' => $debug_log]);
}

$stmt->close();
$conn->close();
?>
