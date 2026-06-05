<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, User-Id");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Menentukan user_id (Mocking middleware/auth)
$userId = null;
if (isset($GLOBALS['user_data']) && is_object($GLOBALS['user_data'])) {
    $userId = $GLOBALS['user_data']->id;
} else if (isset($GLOBALS['user_data']) && is_array($GLOBALS['user_data'])) {
    $userId = $GLOBALS['user_data']['id'] ?? $GLOBALS['user_data']['user_id'] ?? null;
}

if (!$userId) {
    $headers = getallheaders();
    if (isset($headers['User-Id'])) {
        $userId = intval($headers['User-Id']);
    } else if (isset($_GET['user_id'])) {
        $userId = intval($_GET['user_id']);
    } else {
        $userId = 2; // Default mock user (Jane Smith)
    }
}

$requestMethod = $_SERVER["REQUEST_METHOD"];

switch ($requestMethod) {
    case 'GET':
        $query = "SELECT p.id as product_id, p.name, p.price, p.image_url, c.quantity
                  FROM carts c
                  JOIN products p ON c.product_id = p.id
                  WHERE c.user_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($cartItems);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $productId = $data['product_id'] ?? null;
        $quantity = $data['quantity'] ?? 1;

        if (!$productId) {
            http_response_code(400);
            echo json_encode(['message' => 'Product ID is required']);
            break;
        }

        $checkQuery = "SELECT quantity FROM carts WHERE user_id = ? AND product_id = ?";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$userId, $productId]);
        $existingItem = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingItem) {
            $newQuantity = $existingItem['quantity'] + $quantity;
            $updateQuery = "UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->execute([$newQuantity, $userId, $productId]);
        } else {
            $insertQuery = "INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)";
            $insertStmt = $pdo->prepare($insertQuery);
            $insertStmt->execute([$userId, $productId, $quantity]);
        }
        
        http_response_code(201);
        echo json_encode(['message' => 'Item added to cart.']);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $productId = isset($_GET['product_id']) ? intval($_GET['product_id']) : ($data['product_id'] ?? null);
        $quantity = $data['quantity'] ?? null;

        if (!$productId || $quantity === null) {
            http_response_code(400);
            echo json_encode(['message' => 'Product ID and quantity are required']);
            break;
        }

        if ($quantity <= 0) {
            $deleteStmt = $pdo->prepare("DELETE FROM carts WHERE user_id = ? AND product_id = ?");
            $deleteStmt->execute([$userId, $productId]);
            echo json_encode(['message' => 'Item removed from cart.']);
        } else {
            $updateQuery = "UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->execute([$quantity, $userId, $productId]);
            echo json_encode(['message' => 'Quantity updated.']);
        }
        break;

    case 'DELETE':
        $productId = isset($_GET['product_id']) ? intval($_GET['product_id']) : null;
        if (!$productId) {
            $data = json_decode(file_get_contents("php://input"), true);
            $productId = $data['product_id'] ?? null;
        }

        if (!$productId) {
            http_response_code(400);
            echo json_encode(['message' => 'Product ID is required']);
            break;
        }

        $deleteStmt = $pdo->prepare("DELETE FROM carts WHERE user_id = ? AND product_id = ?");
        $deleteStmt->execute([$userId, $productId]);
        echo json_encode(['message' => 'Item removed from cart.']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
?>
