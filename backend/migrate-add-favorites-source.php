<?php
// migration script: run once to add `source` column to `favorites` table
require_once 'db.php';
session_start();

// simple auth: only allow local CLI or admin session
$allow = php_sapi_name() === 'cli' || (isset($_SESSION['user']) && $_SESSION['user']['role'] === 'admin');
if (!$allow) {
    echo "Forbidden\n";
    exit;
}

try {
    // check if column exists
    $dbName = $conn->real_escape_string($dbname ?? '');
    $colCheck = $conn->prepare("SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'favorites' AND COLUMN_NAME = 'source'");
    $colCheck->bind_param('s', $dbName);
    $colCheck->execute();
    $res = $colCheck->get_result();
    $row = $res->fetch_assoc();
    $colExists = intval($row['cnt']) > 0;
    $colCheck->close();

    if ($colExists) {
        echo "Column `source` already exists on favorites table.\n";
        exit;
    }

    // add column with default 'admin' and update existing rows
    $sql = "ALTER TABLE favorites ADD COLUMN source VARCHAR(32) NOT NULL DEFAULT 'admin'";
    if ($conn->query($sql) === TRUE) {
        echo "Added column `source` to favorites table.\n";
    } else {
        echo "Error adding column: " . $conn->error . "\n";
        exit;
    }

    // For safety, ensure any existing rows are explicitly set to 'admin'
    if ($conn->query("UPDATE favorites SET source = 'admin' WHERE source IS NULL OR source = ''") === TRUE) {
        echo "Updated existing rows to set source='admin'.\n";
    } else {
        echo "Error updating existing rows: " . $conn->error . "\n";
    }

    echo "Migration complete.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}

$conn->close();
?>