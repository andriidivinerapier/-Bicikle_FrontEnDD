<?php
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/send-contact.log');
// Do not output PHP errors to the HTTP response (prevents HTML error pages breaking JSON)
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only POST']);
    exit;
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$subject = trim($_POST['subject'] ?? '');
$message = trim($_POST['message'] ?? '');

if (!$name || !$email || !$subject || !$message) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'All fields required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Invalid email']);
    exit;
}

$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require $autoload;
}

// Твоя робоча пошта для отримання листів
$supportEmail = 'andriy.yakubjak@kpk-lp.com.ua';

function sendUsingNativeMail($supportEmail, $subject, $body, $name, $email)
{
    $fromEmail = 'ihtp103@gmail.com';
    $fromName = 'CookBook';

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
        'Reply-To: ' . $name . ' <' . $email . '>',
        'X-Mailer: PHP/' . phpversion(),
    ];

    return mail($supportEmail, $subject, $body, implode("\r\n", $headers));
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

$phPMailerAvailable = class_exists('PHPMailer\\PHPMailer\\PHPMailer');
$emailBody = "від користувача: {$name} ({$email})\n\nповідомлення:\n{$message}";

if (!$phPMailerAvailable) {
    $smtpUser = 'ihtp103@gmail.com';
    $smtpPass = 'oxofoqhluirkjdir';
    $smtpHost = 'smtp.gmail.com';
    $smtpPort = 587;

    if (!empty($smtpPass)) {
        $smtpResult = sendUsingSmtpSocket($smtpHost, $smtpPort, $smtpUser, $smtpPass, $smtpUser, 'CookBook', $supportEmail, "[Contact] {$subject}", $emailBody, $email);
        if ($smtpResult === true) {
            http_response_code(200);
            echo json_encode(['status' => 'ok', 'message' => 'Ваше повідомлення успішно надіслано']);
            exit;
        }
        file_put_contents(__DIR__ . '/smtp-debug.log', "SMTP fallback error: {$smtpResult}\n", FILE_APPEND);
    }

    if (sendUsingNativeMail($supportEmail, "[Contact] {$subject}", $emailBody, $name, $email)) {
        http_response_code(200);
        echo json_encode(['status' => 'ok', 'message' => 'Ваше повідомлення успішно надіслано']);
        exit;
    }

    $logLine = sprintf("[%s] %s <%s> | %s\n%s\n---\n", date('c'), $name, $email, $subject, $message);
    file_put_contents(__DIR__ . '/contact-fallback.log', $logLine, FILE_APPEND);
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'Повідомлення збережено локально (SMTP не налаштовано)']);
    exit;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    $mail->SMTPDebug = 4;
    $mail->Debugoutput = function($str, $level) {
        file_put_contents(__DIR__ . '/smtp-debug.log', "[Level $level] $str\n", FILE_APPEND);
    };
    
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    
    // Прямий хардкод без getenv
    $smtpUser = 'ihtp103@gmail.com';
    $smtpPass = 'oxofoqhluirkjdir';

    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';
    
    $mail->setFrom($smtpUser, 'CookBook');
    $mail->addAddress($supportEmail);
    $mail->addReplyTo($email, $name);
    $mail->Subject = "[Contact] {$subject}";
    $mail->Body = "від користувача: {$name} ({$email})\n\nповідомлення:\n{$message}";
    
    $mail->send();
    
    http_response_code(200);
    echo json_encode(['status' => 'ok', 'message' => 'Ваше повідомлення успішно надіслано']);
    exit;
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    exit;
}
?>