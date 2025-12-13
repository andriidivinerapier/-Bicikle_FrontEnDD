<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Only POST']);
    exit;
}

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
    // Do not reveal whether email exists
    echo json_encode(['status' => 'ok', 'message' => 'If the email exists, a code has been sent']);
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
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $smtpUser = getenv('SMTP_USER') ?: 'ihtp103@gmail.com';
    $smtpPass = getenv('SMTP_PASS') ?: getenv('GMAIL_APP_PASSWORD');
    if (empty($smtpPass)) {
        echo json_encode(['status' => 'error', 'message' => 'SMTP password not configured']);
        exit;
    }
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';

    $mail->setFrom($smtpUser, 'CookBook');
    $mail->addAddress($email, $user['username']);
    $mail->Subject = 'Код для скидання пароля';
    $mail->Body = "Привіт {$user['username']},\n\nВикористайте цей код для скидання пароля (дійсний 15 хвилин): {$code}\n\nЯкщо ви не запитували скидання — ігноруйте це повідомлення.";

    $mail->send();

    echo json_encode(['status' => 'ok', 'message' => 'If the email exists, a code has been sent']);
    exit;

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Mail send failed: ' . $e->getMessage()]);
    exit;
}

?>
