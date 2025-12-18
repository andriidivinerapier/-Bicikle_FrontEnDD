<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once 'db.php';
// Load PHPMailer via composer if available
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
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

// Try PHPMailer if configured
if (!empty($emailCfg) && !empty($emailCfg['use_smtp']) && class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        if (!empty($emailCfg['use_smtp'])) {
            $mail->isSMTP();
            $mail->Host = $emailCfg['host'];
            $mail->SMTPAuth = true;
            $mail->Username = $emailCfg['username'];
            $mail->Password = $emailCfg['password'];
            $mail->SMTPSecure = $emailCfg['secure'] ?: '';
            $mail->Port = $emailCfg['port'] ?: 587;
        }
        $fromEmail = $emailCfg['from_email'] ?? 'noreply@example.com';
        $fromName = $emailCfg['from_name'] ?? 'Site';
        $mail->setFrom($fromEmail, $fromName);
        // set Sender and reply-to explicitly to help some SMTP providers respect the display name
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
    }
} else {
    // Fallback to mail()
    $fromEmail = $emailCfg['from_email'] ?? 'noreply@example.com';
    $fromName = $emailCfg['from_name'] ?? 'Site';
    $headers = 'From: ' . $fromName . ' <' . $fromEmail . '>' . "\r\n" . 'Content-Type: text/plain; charset=utf-8';
    try {
        $sent = @mail($oldEmail, $subject, $message, $headers);
    } catch (Exception $e) {
        $sent = false;
        $errorMsg = $e->getMessage();
    }
}

// Respond with JSON compatible with frontend (expects 'success')
echo json_encode(['success' => true, 'sent' => (bool)$sent, 'error' => $errorMsg]);
$conn->close();
?>
