<?php
require_once 'db.php';
session_start();

$session_user_id = null;
if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
    $session_user_id = $_SESSION['user']['id'] ?? null;
} elseif (isset($_SESSION['user_id'])) {
    $session_user_id = $_SESSION['user_id'];
}

if (!$session_user_id || !isset($_POST['recipe_id'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing user or recipe id']);
    exit;
}

$user_id = intval($session_user_id);
$recipe_id = intval($_POST['recipe_id']);
$source = isset($_POST['source']) ? $_POST['source'] : 'admin';

// Check whether favorites table has `source` column
$colCheck = $conn->prepare("
    SELECT COUNT(*) as cnt
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorites' AND COLUMN_NAME = 'source'
");
$dbName = $conn->real_escape_string($dbname ?? '');
$hasSource = false;
if ($colCheck) {
    $colCheck->bind_param('s', $dbName);
    try {
        $colCheck->execute();
    } catch (mysqli_sql_exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'SQL error', 'message' => $e->getMessage()]);
        $colCheck->close();
        $conn->close();
        exit;
    }
    $colCheck->bind_result($cnt);
    if ($colCheck->fetch()) {
        $hasSource = intval($cnt) > 0;
    }
    $colCheck->close();
}

if ($hasSource) {
    // Prevent duplicate favorites for this exact source
    $check = $conn->prepare('SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ? AND recipe_id = ? AND source = ?');
    if ($check) {
        $check->bind_param('iis', $user_id, $recipe_id, $source);
        try {
            $check->execute();
        } catch (mysqli_sql_exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'SQL error', 'message' => $e->getMessage()]);
            $check->close();
            $conn->close();
            exit;
        }
        $check->bind_result($cntDup);
        $already = false;
        if ($check->fetch()) {
            $already = intval($cntDup) > 0;
        }
        $check->close();

        if ($already) {
            echo json_encode(['success' => true, 'message' => 'Already favorited']);
            $conn->close();
            exit;
        }
    }

    $stmt = $conn->prepare('INSERT INTO favorites (user_id, recipe_id, source, created_at) VALUES (?, ?, ?, NOW())');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to prepare statement']);
        $conn->close();
        exit;
    }
    $stmt->bind_param('iis', $user_id, $recipe_id, $source);
} else {
    // No `source` column — treat favorites without source
    $check = $conn->prepare('SELECT COUNT(*) as cnt FROM favorites WHERE user_id = ? AND recipe_id = ?');
    if ($check) {
        $check->bind_param('ii', $user_id, $recipe_id);
        try {
            $check->execute();
        } catch (mysqli_sql_exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'SQL error', 'message' => $e->getMessage()]);
            $check->close();
            $conn->close();
            exit;
        }
        $check->bind_result($cntDup);
        $already = false;
        if ($check->fetch()) {
            $already = intval($cntDup) > 0;
        }
        $check->close();

        if ($already) {
            echo json_encode(['success' => true, 'message' => 'Already favorited']);
            $conn->close();
            exit;
        }
    }

    $stmt = $conn->prepare('INSERT INTO favorites (user_id, recipe_id, created_at) VALUES (?, ?, NOW())');
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to prepare statement']);
        $conn->close();
        exit;
    }
    $stmt->bind_param('ii', $user_id, $recipe_id);
}
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to prepare statement']);
    $conn->close();
    exit;
}

try {
    $ok = $stmt->execute();
} catch (mysqli_sql_exception $e) {
    // handle duplicate key as success if needed
    if ($conn->errno === 1062) {
        echo json_encode(['success' => true, 'message' => 'Already favorited']);
        $stmt->close();
        $conn->close();
        exit;
    }
    http_response_code(500);
    echo json_encode(['error' => 'Failed to add favorite', 'message' => $e->getMessage()]);
    $stmt->close();
    $conn->close();
    exit;
}

if ($ok) {
    echo json_encode(['success' => true, 'status' => 'success']);
} else {
    if ($conn->errno === 1062) {
        echo json_encode(['success' => true, 'message' => 'Already favorited']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to add favorite']);
    }
}
$stmt->close();
$conn->close();
?>

