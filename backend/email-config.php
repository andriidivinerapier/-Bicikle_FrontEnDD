<?php
/**
 * SMTP configuration loader.
 *
 * This file loads environment variables from .env file or system environment.
 * Priority: .env file > system environment variables > defaults
 */

// Load .env file if it exists
if (file_exists(__DIR__ . '/../.env')) {
    $envFile = file(__DIR__ . '/../.env');
    foreach ($envFile as $line) {
        $line = trim($line);
        // Skip empty lines and comments
        if (!$line || $line[0] === '#') {
            continue;
        }
        // Parse KEY=VALUE format
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            // Only set if not already in environment
            if (!getenv($key)) {
                putenv($key . '=' . $val);
            }
        }
    }
}

$envUser = getenv('SMTP_USER');
$envPass = getenv('SMTP_PASS');
$supportEmail = getenv('SUPPORT_EMAIL');

// Debug logging
$debugMsg = sprintf("[%s] Config loaded: SMTP_USER=%s, SMTP_PASS=%s, SUPPORT_EMAIL=%s\n", 
    date('Y-m-d H:i:s'),
    $envUser ? substr($envUser, 0, 5) . '...' : 'NOT SET',
    $envPass ? 'SET (len:' . strlen($envPass) . ')' : 'NOT SET',
    $supportEmail ? $supportEmail : 'NOT SET'
);
@file_put_contents(__DIR__ . '/email-config-debug.log', $debugMsg, FILE_APPEND);

$config = [
    // enable SMTP by default; set to false to fallback to PHP mail()
    'use_smtp' => true,

    // sensible defaults for Gmail SMTP — override via env variables
    'host' => 'smtp.gmail.com',
    'username' => $envUser ?: 'user@example.com',
    'password' => $envPass ?: 'yourpassword',
    'port' => 587,
    'secure' => 'tls', // 'tls' or 'ssl' or ''

    // From address used for outgoing messages
    'from_email' => $supportEmail ?: ($envUser ?: 'noreply@example.com'),
    'from_name' => 'CookBook',
];

return $config;
