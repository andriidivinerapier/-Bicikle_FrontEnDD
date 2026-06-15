<?php
/**
 * SMTP configuration loader.
 *
 * This file loads environment variables from .env file or system environment.
 * Priority: .env file > system environment variables > defaults
 */

$envPath = dirname(__DIR__) . '/.env';
$envRealPath = realpath($envPath);
$envExists = false;
$envContents = '';
$envDebug = [];
$envDebug['cwd'] = getcwd();
$envDebug['envPath'] = $envPath;
$envDebug['realpath'] = $envRealPath ?: 'NOT FOUND';
$envDebug['exists'] = file_exists($envPath) ? 'YES' : 'NO';
$envDebug['readable'] = is_readable($envPath) ? 'YES' : 'NO';
if (file_exists($envPath) && is_readable($envPath)) {
    $envExists = true;
    $envFile = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $envContents = implode("\n", $envFile);
    foreach ($envFile as $lineIndex => $line) {
        $rawLine = $line;
        $line = trim($line);
        if ($line === '' || $line[0] === '#') {
            continue;
        }
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val);
            if (getenv($key) === false || getenv($key) === '') {
                putenv($key . '=' . $val);
                $_ENV[$key] = $val;
                $_SERVER[$key] = $val;
                $envDebug[] = sprintf('SET %s=%s', $key, $val);
            } else {
                $envDebug[] = sprintf('SKIP %s already set', $key);
            }
        } else {
            $envDebug[] = sprintf('IGNORE line %d: %s', $lineIndex + 1, $rawLine);
        }
    }
}

$envUser = getenv('SMTP_USER');
$envPass = getenv('SMTP_PASS');
$supportEmail = getenv('SUPPORT_EMAIL');

$debugMsg = sprintf(
    "[%s] Config loaded: cwd=%s, envPath=%s, realpath=%s, exists=%s, readable=%s, SMTP_USER=%s, SMTP_PASS=%s, SUPPORT_EMAIL=%s\n",
    date('Y-m-d H:i:s'),
    $envDebug['cwd'],
    $envDebug['envPath'],
    $envDebug['realpath'],
    $envDebug['exists'],
    $envDebug['readable'],
    $envUser ? substr($envUser, 0, 5) . '...' : 'NOT SET',
    $envPass ? 'SET (len:' . strlen($envPass) . ')' : 'NOT SET',
    $supportEmail ? $supportEmail : 'NOT SET'
);
foreach ($envDebug as $debugLine) {
    $debugMsg .= $debugLine . "\n";
}
$debugMsg .= "ENV CONTENTS:\n" . $envContents . "\n";
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
