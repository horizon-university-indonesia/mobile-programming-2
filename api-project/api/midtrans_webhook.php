<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$logFile = __DIR__ . '/../webhook_log.txt';
$logData = date('Y-m-d H:i:s') . ' - WEBHOOK RECEIVED: ' . $json . PHP_EOL;
file_put_contents($logFile, $logData, FILE_APPEND);

$serverKey = 'YOUR_SERVER_KEY';

$incomingSignature = $_SERVER['HTTP_X_MIDTRANS_SIGNATURE'] ?? '';

$expectedSignature = hash('sha512',
    $data['order_id'] .
    $data['status_code'] .
    $data['gross_amount'] .
    $serverKey
);

if ($incomingSignature !== $expectedSignature) {
    http_response_code(403);
    file_put_contents($logFile, "INVALID SIGNATURE! Expected: $expectedSignature, Got: $incomingSignature" . PHP_EOL, FILE_APPEND);
    exit('Invalid Signature');
}

$orderNumber = $data['order_id'];
$transactionStatus = $data['transaction_status'];
$fraudStatus = $data['fraud_status'] ?? 'accept';

$newStatus = 'pending';

if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
    $newStatus = 'paid';
} elseif ($transactionStatus == 'pending') {
    $newStatus = 'waiting_for_payment';
} elseif ($transactionStatus == 'deny' || $transactionStatus == 'expire') {
    $newStatus = 'cancelled';
} elseif ($transactionStatus == 'cancel') {
    $newStatus = 'cancelled';
}

try {
    $stmt = $pdo->prepare("SELECT status FROM orders WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $oldOrder = $stmt->fetch(PDO::FETCH_ASSOC);
    $oldStatus = $oldOrder ? $oldOrder['status'] : null;

    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE order_number = ?");
    $stmt->execute([$newStatus, $orderNumber]);

    $stmtLog = $pdo->prepare("
        INSERT INTO order_status_log (order_id, status_from, status_to)
        SELECT id, ?, ? FROM orders WHERE order_number = ?
    ");
    $stmtLog->execute([$oldStatus, $newStatus, $orderNumber]);

    file_put_contents($logFile, "Order $orderNumber updated: $oldStatus -> $newStatus" . PHP_EOL, FILE_APPEND);

} catch (Exception $e) {
    file_put_contents($logFile, "ERROR updating order: " . $e->getMessage() . PHP_EOL, FILE_APPEND);
}

http_response_code(200);
echo 'OK';
?>
