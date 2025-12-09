<?php
// backend/migrate-user-recipes.php — створює таблицю для рецептів користувачів

require 'db.php';

// Перевіримо чи таблиця існує
$check = $conn->query("SHOW TABLES LIKE 'user_recipes'");
if ($check && $check->num_rows > 0) {
    echo json_encode(['status' => 'info', 'message' => 'Таблиця user_recipes вже існує']);
    exit;
}

// Створюємо таблицю для рецептів користувачів
$sql = "
CREATE TABLE user_recipes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    ingredients LONGTEXT NOT NULL,
    instructions LONGTEXT NOT NULL,
    image_path VARCHAR(255),
    difficulty VARCHAR(50) DEFAULT 'Середня',
    cooking_time INT DEFAULT 30,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    review_reason TEXT,
    reviewed_by INT,
    reviewed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (user_id),
    INDEX (status),
    INDEX (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if ($conn->query($sql)) {
    echo json_encode(['status' => 'success', 'message' => 'Таблиця user_recipes створена']);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}

$conn->close();
?>
