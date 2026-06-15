<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only POST']);
    exit;
}

// Debug incoming requests for the password reset flow.
$logEntry = sprintf("[%s] request-password-reset email=%s remote=%s\n", date('c'), $_POST['email'] ?? '[none]', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
file_put_contents(__DIR__ . '/request-password-reset.log', $logEntry, FILE_APPEND);

$email = trim($_POST['email'] ?? '');
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid email']);
    exit;
}

// Find user
$stmt = $conn->prepare('SELECT id, username FROM users WHERE email = ? LIMIT 1');
$stmt->bind_param('s', $email);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Цієї пошти не існує']);
    exit;
}
$user = $res->fetch_assoc();
$stmt->close();

// Ensure password_resets table exists
$createSql = "CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used TINYINT(1) DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
$conn->query($createSql);

// Generate 6-digit numeric code
$code = str_pad(strval(random_int(0, 999999)), 6, '0', STR_PAD_LEFT);
$codeHash = password_hash($code, PASSWORD_DEFAULT);
$expiresAt = (new DateTime('+15 minutes'))->format('Y-m-d H:i:s');

$insert = $conn->prepare('INSERT INTO password_resets (user_id, email, code_hash, expires_at) VALUES (?, ?, ?, ?)');
$insert->bind_param('isss', $user['id'], $email, $codeHash, $expiresAt);
$insert->execute();
$insert->close();

// Send email with code using PHPMailer
$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
    echo json_encode(['status' => 'error', 'message' => 'Mailer not configured']);
    exit;
}
require $autoload;

function sendUsingNativeMail($toEmail, $subject, $body, $fromEmail, $fromName, $replyTo)
{
    if (stripos(PHP_OS, 'WIN') === 0) {
        $smtpServer = ini_get('SMTP');
        $sendmailFrom = ini_get('sendmail_from');
        if (!$smtpServer || !$sendmailFrom) {
            return false;
        }
    }

    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $replyTo,
        'X-Mailer: PHP/' . phpversion(),
    ];

    return mail($toEmail, $subject, $body, implode("\r\n", $headers));
}

function sendUsingSmtpSocket($host, $port, $username, $password, $fromEmail, $fromName, $toEmail, $subject, $body, $replyTo)
{
    $timeout = 30;
    $remote = ($port === 465 ? 'ssl://' : '') . $host . ':' . $port;
    $socket = stream_socket_client($remote, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        return "socket error: {$errno} - {$errstr}";
    }

    $readLine = function () use ($socket) {
        $lines = '';
        while (($line = fgets($socket, 515)) !== false) {
            $lines .= $line;
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }
        return $lines;
    };

    $writeLine = function ($data) use ($socket) {
        fwrite($socket, $data);
    };

    $response = $readLine();
    if (substr($response, 0, 3) !== '220') {
        fclose($socket);
        return 'connection failed: ' . trim($response);
    }

    $writeLine("EHLO localhost\r\n");
    $response = $readLine();
    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return 'EHLO failed: ' . trim($response);
    }

    if ($port === 587) {
        $writeLine("STARTTLS\r\n");
        $response = $readLine();
        if (substr($response, 0, 3) !== '220') {
            fclose($socket);
            return 'STARTTLS failed: ' . trim($response);
        }
        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            fclose($socket);
            return 'Unable to enable TLS';
        }
        $writeLine("EHLO localhost\r\n");
        $response = $readLine();
        if (substr($response, 0, 3) !== '250') {
            fclose($socket);
            return 'EHLO after STARTTLS failed: ' . trim($response);
        }
    }

    $writeLine("AUTH LOGIN\r\n");
    $response = $readLine();
    if (substr($response, 0, 3) !== '334') {
        fclose($socket);
        return 'AUTH LOGIN failed: ' . trim($response);
    }

    $writeLine(base64_encode($username) . "\r\n");
    $response = $readLine();
    if (substr($response, 0, 3) !== '334') {
        fclose($socket);
        return 'Username rejected: ' . trim($response);
    }

    $writeLine(base64_encode($password) . "\r\n");
    $response = $readLine();
    if (substr($response, 0, 3) !== '235') {
        fclose($socket);
        return 'Authentication failed: ' . trim($response);
    }

    $writeLine("MAIL FROM:<{$fromEmail}>\r\n");
    $response = $readLine();
    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return 'MAIL FROM failed: ' . trim($response);
    }

    $writeLine("RCPT TO:<{$toEmail}>\r\n");
    $response = $readLine();
    if (substr($response, 0, 3) !== '250' && substr($response, 0, 3) !== '251') {
        fclose($socket);
        return 'RCPT TO failed: ' . trim($response);
    }

    $writeLine("DATA\r\n");
    $response = $readLine();
    if (substr($response, 0, 3) !== '354') {
        fclose($socket);
        return 'DATA failed: ' . trim($response);
    }

    $headers = [
        'From: ' . $fromName . ' <' . $fromEmail . '>',
        'Reply-To: ' . $replyTo,
        'To: ' . $toEmail,
        'Subject: ' . $subject,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ];

    $mailData = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n";
    $writeLine($mailData);

    $response = $readLine();
    if (substr($response, 0, 3) !== '250') {
        fclose($socket);
        return 'SEND failed: ' . trim($response);
    }

    $writeLine("QUIT\r\n");
    fclose($socket);
    return true;
}

$emailCfgPath = __DIR__ . '/email-config.php';
$emailCfg = file_exists($emailCfgPath) ? include $emailCfgPath : [];

$debugLog = sprintf("[%s] === PASSWORD RESET REQUEST START ===\n", date('Y-m-d H:i:s'));
$debugLog .= "Config file exists: " . (file_exists($emailCfgPath) ? 'YES' : 'NO') . "\n";
$debugLog .= "Config loaded: username=" . ($emailCfg['username'] ?? 'NOT SET') . ", password=" . (!empty($emailCfg['password']) ? 'SET' : 'NOT SET') . "\n";

$phPMailerAvailable = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
$debugLog .= "PHPMailer available: " . ($phPMailerAvailable ? 'YES' : 'NO') . "\n";

file_put_contents(__DIR__ . '/password-reset-debug.log', $debugLog, FILE_APPEND);

if (!$phPMailerAvailable) {
    $smtpUser = getenv('SMTP_USER') ?: (isset($_SERVER['SMTP_USER']) ? $_SERVER['SMTP_USER'] : null) ?: (function_exists('apache_getenv') ? apache_getenv('SMTP_USER') : null) ?: ($emailCfg['username'] ?? 'ihtp103@gmail.com');
    $smtpPass = getenv('SMTP_PASS') ?: getenv('GMAIL_APP_PASSWORD') ?: (isset($_SERVER['SMTP_PASS']) ? $_SERVER['SMTP_PASS'] : null) ?: (function_exists('apache_getenv') ? apache_getenv('SMTP_PASS') : null) ?: ($emailCfg['password'] ?? null);
    $smtpHost = getenv('SMTP_HOST') ?: ($emailCfg['host'] ?? 'smtp.gmail.com');
    $smtpPort = getenv('SMTP_PORT') ? (int)getenv('SMTP_PORT') : ($emailCfg['port'] ?? 587);

    $messageBody = "Привіт {$user['username']},\n\nВикористайте цей код для скидання пароля (дійсний 15 хвилин): {$code}\n\nЯкщо ви не запитували скидання — ігноруйте це повідомлення.";
    $fromEmail = $smtpUser;
    $fromName = 'CookBook';

    if (!empty($smtpPass)) {
        $smtpResult = sendUsingSmtpSocket($smtpHost, $smtpPort, $smtpUser, $smtpPass, $fromEmail, $fromName, $email, 'Код для скидання пароля', $messageBody, $fromEmail);
        if ($smtpResult === true) {
            echo json_encode(['status' => 'ok', 'message' => 'If the email exists, a code has been sent']);
            exit;
        }
        file_put_contents(__DIR__ . '/smtp-debug.log', "[request-password-reset] SMTP fallback error: {$smtpResult}\n", FILE_APPEND);
    }

    if (sendUsingNativeMail($email, 'Код для скидання пароля', $messageBody, $fromEmail, $fromName, $fromEmail)) {
        echo json_encode(['status' => 'ok', 'message' => 'If the email exists, a code has been sent']);
        exit;
    }

    file_put_contents(__DIR__ . '/request-password-reset.log', "[request-password-reset] Fallback failed, PHPMailer unavailable\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Mail send failed']);
    exit;
}

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $emailCfg['host'] ?? 'smtp.gmail.com';
    $mail->SMTPAuth = true;

    $smtpUser = getenv('SMTP_USER') ?: (isset($_SERVER['SMTP_USER']) ? $_SERVER['SMTP_USER'] : null) ?: (function_exists('apache_getenv') ? apache_getenv('SMTP_USER') : null) ?: ($emailCfg['username'] ?? 'ihtp103@gmail.com');
    $smtpPass = getenv('SMTP_PASS') ?: getenv('GMAIL_APP_PASSWORD') ?: (isset($_SERVER['SMTP_PASS']) ? $_SERVER['SMTP_PASS'] : null) ?: (function_exists('apache_getenv') ? apache_getenv('SMTP_PASS') : null) ?: ($emailCfg['password'] ?? null);
    if (empty($smtpPass)) {
        echo json_encode(['status' => 'error', 'message' => 'SMTP password not configured']);
        exit;
    }

    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = $emailCfg['secure'] ?? PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = $emailCfg['port'] ?? 587;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($smtpUser, 'CookBook');
    $mail->addAddress($email, $user['username']);
    $mail->Subject = 'Код для скидання пароля';
    $mail->Body = "Привіт {$user['username']},\n\nВикористайте цей код для скидання пароля (дійсний 15 хвилин): {$code}\n\nЯкщо ви не запитували скидання — ігноруйте це повідомлення.";

    $mail->send();

    echo json_encode(['status' => 'ok', 'message' => 'If the email exists, a code has been sent']);
    exit;

} catch (Exception $e) {
    file_put_contents(__DIR__ . '/smtp-debug.log', "[request-password-reset] " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Mail send failed: ' . $e->getMessage()]);
    exit;
}

?>