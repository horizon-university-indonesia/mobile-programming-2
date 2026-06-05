<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$orderNumber = $_GET['order_number'] ?? null;
$orderId = $_GET['order_id'] ?? null;

if (!$orderNumber && !$orderId) {
    http_response_code(400);
    echo json_encode(['message' => 'Parameter order_number atau order_id diperlukan']);
    exit();
}

try {
    if ($orderNumber) {
        $stmt = $pdo->prepare("
            SELECT o.*, GROUP_CONCAT(
                JSON_OBJECT('product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price)
            ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.order_number = ?
            GROUP BY o.id
        ");
        $stmt->execute([$orderNumber]);
    } else {
        $stmt = $pdo->prepare("
            SELECT o.*, GROUP_CONCAT(
                JSON_OBJECT('product_name', oi.product_name, 'quantity', oi.quantity, 'price', oi.price)
            ) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            WHERE o.id = ?
            GROUP BY o.id
        ");
        $stmt->execute([$orderId]);
    }

    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);
        echo json_encode(['message' => 'Pesanan tidak ditemukan']);
        exit();
    }

    $stmtLog = $pdo->prepare("
        SELECT * FROM order_status_log 
        WHERE order_id = ? 
        ORDER BY changed_at DESC
    ");
    $stmtLog->execute([$order['id']]);
    $statusLog = $stmtLog->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'order' => $order,
        'statusLog' => $statusLog
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Gagal mengambil data: ' . $e->getMessage()
    ]);
}
?>
