<?php
require_once 'db.php';

// Check user_recipes table structure
echo "=== user_recipes table structure ===\n";
$result = $conn->query("DESCRIBE user_recipes");
while ($row = $result->fetch_assoc()) {
    echo $row['Field'] . " | " . $row['Type'] . " | " . $row['Null'] . " | " . $row['Key'] . "\n";
}

echo "\n=== Sample user_recipes data ===\n";
$result = $conn->query("SELECT id, title, image_path FROM user_recipes LIMIT 3");
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Title: " . $row['title'] . " | image_path: '" . $row['image_path'] . "' (type: " . gettype($row['image_path']) . ")\n";
}

$conn->close();
?>
