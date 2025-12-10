<?php
require_once 'db.php';

// Update create-recipe.php to handle empty image_path properly
$updateCode = <<<'PHP'
// Ensure image_path is not empty - set default if no file uploaded
if (empty($image_path)) {
    $image_path = 'images/homepage/placeholder.jpg'; // Use a default placeholder image
}
PHP;

echo "Code to add to create-recipe.php after line 130:\n\n";
echo $updateCode;
?>
