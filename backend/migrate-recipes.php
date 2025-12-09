<?php
// backend/migrate-recipes.php — додає необхідні колонки до таблиці recipes

require 'db.php';

$migrations = [
    "ALTER TABLE recipes ADD COLUMN difficulty VARCHAR(50) DEFAULT 'Середня' AFTER instructions",
    "ALTER TABLE recipes ADD COLUMN cooking_time INT DEFAULT 30 AFTER difficulty",
];

foreach ($migrations as $sql) {
    // Перевіряємо, чи колонка вже існує
    $column_name = null;
    if (strpos($sql, 'difficulty') !== false) $column_name = 'difficulty';
    if (strpos($sql, 'cooking_time') !== false) $column_name = 'cooking_time';
    
    if ($column_name) {
        $check = $conn->query("SHOW COLUMNS FROM recipes LIKE '$column_name'");
        if ($check && $check->num_rows > 0) {
            echo "Колонка '$column_name' вже існує\n";
            continue;
        }
    }
    
    if ($conn->query($sql)) {
        echo "✓ Міграція успішна: " . substr($sql, 0, 50) . "...\n";
    } else {
        echo "✗ Помилка: " . $conn->error . "\n";
    }
}

echo json_encode(['status' => 'success', 'message' => 'Міграція завершена']);
?>
