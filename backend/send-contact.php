<?php
error_reporting(E_ALL);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/send-contact.log');

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
if (!file_exists($autoload)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'PHPMailer missing']);
    exit;
}

require $autoload;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    $mail->SMTPDebug = 4; // Full debug for diagnosing auth/send issues
    $mail->Debugoutput = function($str, $level) {
        file_put_contents(__DIR__ . '/smtp-debug.log', "[Level $level] $str\n", FILE_APPEND);
    };
    
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    // Load SMTP credentials from environment variables (do NOT hard-code credentials)
    // Default SMTP user (do NOT include passwords here). Change via env var.
    $smtpUser = getenv('SMTP_USER') ?: 'ihtp103@gmail.com';
    $smtpPass = getenv('SMTP_PASS') ?: getenv('GMAIL_APP_PASSWORD');

    if (empty($smtpPass)) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'SMTP password not configured (set SMTP_PASS or GMAIL_APP_PASSWORD)']);
        exit;
    }

    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';
    
    // Use authenticated SMTP user as the From address to avoid Gmail auth issues
    $mail->setFrom($smtpUser, 'CookBook');
    // Deliver to SUPPORT_EMAIL if set, otherwise to the SMTP user
    $supportEmail = getenv('SUPPORT_EMAIL') ?: $smtpUser;
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
