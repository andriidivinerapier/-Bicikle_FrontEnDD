<?php
require_once 'db.php';

$sql = "ALTER TABLE users ADD COLUMN avatar_path VARCHAR(255) DEFAULT ''";
if ($conn->query($sql) === TRUE) {
    echo "Міграція виконана успішно: додано стовбець avatar_path.\n";
} else {
    if ($conn->errno === 1060) {
        echo "Стовпець avatar_path вже існує.\n";
    } else {
        echo "Помилка міграції: ({$conn->errno}) {$conn->error}\n";
    }
}
$conn->close();
?>