<?php
require_once 'db.php';

// Drop the foreign key constraint on favorites table
// First, find the constraint name
$result = $conn->query("
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'favorites' AND COLUMN_NAME = 'recipe_id' AND REFERENCED_TABLE_NAME IS NOT NULL
");

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $constraintName = $row['CONSTRAINT_NAME'];
    
    echo "Found constraint: " . $constraintName . "\n";
    
    // Drop the constraint
    $dropSQL = "ALTER TABLE favorites DROP FOREIGN KEY " . $constraintName;
    if ($conn->query($dropSQL)) {
        echo "✅ Foreign key constraint dropped successfully.\n";
    } else {
        echo "❌ Error dropping constraint: " . $conn->error . "\n";
    }
} else {
    echo "No foreign key constraint found on recipe_id column.\n";
}

$conn->close();
?>
