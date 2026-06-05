<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, User-Id");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Data items tidak boleh kosong']);
    exit();
}

$userId = 2;

try {
    $totalAmount = 0;
    foreach ($data['items'] as $item) {
        $totalAmount += $item['price'] * $item['quantity'];
    }

    $orderNumber = 'ORD-' . time();

    $stmt = $pdo->prepare("
        INSERT INTO orders (user_id, order_number, total_amount, status)
        VALUES (?, ?, ?, 'pending')
    ");
    $stmt->execute([$userId, $orderNumber, $totalAmount]);
    $orderId = $pdo->lastInsertId();

    $stmtItem = $pdo->prepare("
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
        VALUES (?, ?, ?, ?, ?)
    ");

    foreach ($data['items'] as $item) {
        $stmtItem->execute([
            $orderId,
            $item['product_id'],
            $item['name'],
            $item['quantity'],
            $item['price']
        ]);
    }

    $snapToken = 'MOCK_SNAP_TOKEN_' . bin2hex(random_bytes(16));

    $stmt = $pdo->prepare("UPDATE orders SET payment_token = ? WHERE id = ?");
    $stmt->execute([$snapToken, $orderId]);

    $stmtLog = $pdo->prepare("
        INSERT INTO order_status_log (order_id, status_from, status_to)
        VALUES (?, NULL, 'pending')
    ");
    $stmtLog->execute([$orderId]);

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Pesanan berhasil dibuat',
        'orderId' => $orderId,
        'orderNumber' => $orderNumber,
        'snapToken' => $snapToken,
        'totalAmount' => $totalAmount
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal membuat pesanan: ' . $e->getMessage()
    ]);
}
?>
