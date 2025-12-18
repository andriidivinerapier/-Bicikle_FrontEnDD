<?php
/**
 * SMTP configuration loader.
 *
 * This file prefers environment variables (SetEnv in .htaccess or system env):
 *  - SMTP_USER
 *  - SMTP_PASS
 *  - SUPPORT_EMAIL
 *
 * If environment variables are not present, the default placeholders remain
 * so you can edit them here manually.
 */

$envUser = getenv('SMTP_USER');
$envPass = getenv('SMTP_PASS');
$supportEmail = getenv('SUPPORT_EMAIL');

return [
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
