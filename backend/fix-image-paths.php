<?php
require_once 'db.php';

// Fix all image_path values in user_recipes that are '0' or empty
$update_sql = "UPDATE user_recipes SET image_path = 'images/homepage/placeholder.jpg' WHERE image_path = '0' OR image_path = '' OR image_path IS NULL";

if ($conn->query($update_sql)) {
    $affected = $conn->affected_rows;
    echo "Success! Updated $affected records with placeholder image path.\n";
    echo "Fixed recipes now have image_path = 'images/homepage/placeholder.jpg'\n";
} else {
    echo "Error: " . $conn->error . "\n";
}

// Also check recipes table
$update_recipes_sql = "UPDATE recipes SET image_path = 'images/homepage/placeholder.jpg' WHERE image_path = '0' OR image_path = '' OR image_path IS NULL";
if ($conn->query($update_recipes_sql)) {
    $affected = $conn->affected_rows;
    if ($affected > 0) {
        echo "Also fixed $affected records in recipes table.\n";
    }
}

// Verify the fix
echo "\n=== Verification ===\n";
$result = $conn->query("SELECT id, title, image_path FROM user_recipes LIMIT 5");
while ($row = $result->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Title: " . $row['title'] . " | image_path: " . $row['image_path'] . "\n";
}

$conn->close();
?>
