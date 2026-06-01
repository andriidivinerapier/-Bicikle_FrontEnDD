<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';
// Load PHPMailer via composer if available
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
}

function sendUsingNativeMail($toEmail, $subject, $body, $fromEmail, $fromName, $replyTo = null)
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
        'Reply-To: ' . ($replyTo ?: $fromEmail),
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

// load email config
$emailCfgPath = __DIR__ . '/email-config.php';
$emailCfg = file_exists($emailCfgPath) ? include $emailCfgPath : [];

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Користувач не залогінений']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Невірний метод запиту']);
    exit;
}

$user_id = intval($_SESSION['user']['id']);
$newEmail = trim($_POST['new_email'] ?? ($_POST['email'] ?? ''));

if ($newEmail === '' || !filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['status' => 'error', 'message' => 'Некоректна пошта']);
    exit;
}

// Check if email already used
$stmt = $conn->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
$stmt->bind_param('si', $newEmail, $user_id);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    $stmt->close();
    echo json_encode(['status' => 'error', 'message' => 'Пошта вже використовується']);
    exit;
}
$stmt->close();

// Prepare verification code and store in session with expiry
// generate code and save pending
$code = str_pad(strval(rand(0, 999999)), 6, '0', STR_PAD_LEFT);
$_SESSION['pending_email_change'] = [
    'code' => $code,
    'new_email' => $newEmail,
    'expires' => time() + 15 * 60 // 15 minutes
];

// Prepare message
$oldEmail = $_SESSION['user']['email'] ?? '';
$subject = 'Код підтвердження зміни пошти';
$message = "Код для підтвердження зміни електронної пошти: $code\nЯкщо ви не ініціювали цю дію, проігноруйте повідомлення.";

$sent = false;
$errorMsg = '';

$fromEmail = $emailCfg['from_email'] ?? 'noreply@example.com';
$fromName = $emailCfg['from_name'] ?? 'Site';
$smtpUser = getenv('SMTP_USER') ?: ($emailCfg['username'] ?? $fromEmail);
$smtpPass = getenv('SMTP_PASS') ?: getenv('GMAIL_APP_PASSWORD') ?: ($emailCfg['password'] ?? null);
$smtpHost = getenv('SMTP_HOST') ?: ($emailCfg['host'] ?? 'smtp.gmail.com');
$smtpPort = getenv('SMTP_PORT') ? (int)getenv('SMTP_PORT') : ($emailCfg['port'] ?? 587);
$useSmtp = !empty($emailCfg['use_smtp']) && !empty($smtpPass);

// Try PHPMailer if configured and available
if ($useSmtp && class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $smtpHost;
        $mail->SMTPAuth = true;
        $mail->Username = $smtpUser;
        $mail->Password = $smtpPass;
        $mail->SMTPSecure = $emailCfg['secure'] ?: PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $smtpPort;
        $mail->setFrom($fromEmail, $fromName);
        $mail->Sender = $fromEmail;
        $mail->addReplyTo($fromEmail, $fromName);
        $mail->addAddress($oldEmail);
        $mail->Subject = $subject;
        $mail->Body = $message;
        $mail->CharSet = 'UTF-8';
        $mail->send();
        $sent = true;
    } catch (Exception $e) {
        $sent = false;
        $errorMsg = $e->getMessage();
        file_put_contents(__DIR__ . '/request-email-change.log', "[PHPMailer] " . $errorMsg . "\n", FILE_APPEND);
    }
}

if (!$sent && $useSmtp) {
    $smtpResult = sendUsingSmtpSocket($smtpHost, $smtpPort, $smtpUser, $smtpPass, $fromEmail, $fromName, $oldEmail, $subject, $message, $fromEmail);
    if ($smtpResult === true) {
        $sent = true;
    } else {
        $errorMsg = $smtpResult;
        file_put_contents(__DIR__ . '/request-email-change.log', "[SMTP socket] " . $smtpResult . "\n", FILE_APPEND);
    }
}

if (!$sent) {
    $headers = 'From: ' . $fromName . ' <' . $fromEmail . '>' . "\r\n" . 'Content-Type: text/plain; charset=utf-8';
    $sent = @mail($oldEmail, $subject, $message, $headers);
    if (!$sent) {
        file_put_contents(__DIR__ . '/request-email-change.log', "[mail()] failed for {$oldEmail}\n");
    }
}

// Respond with JSON compatible with frontend (expects 'success')
echo json_encode(['success' => true, 'sent' => (bool)$sent, 'error' => $errorMsg]);
$conn->close();
?>
