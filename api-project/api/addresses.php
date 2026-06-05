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

$userId = 2;
$requestMethod = $_SERVER["REQUEST_METHOD"];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($requestMethod) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT * FROM user_addresses WHERE user_id = ?");
        $stmt->execute([$userId]);
        $addresses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($addresses);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['label']) || empty($data['recipient_name']) || empty($data['full_address'])) {
            http_response_code(400);
            echo json_encode(['message' => 'Label, recipient_name, and full_address are required']);
            break;
        }

        $query = "INSERT INTO user_addresses (user_id, label, recipient_name, phone, full_address, city, postal_code) 
                  VALUES (?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $userId, 
            $data['label'], 
            $data['recipient_name'], 
            $data['phone'] ?? '', 
            $data['full_address'], 
            $data['city'] ?? '', 
            $data['postal_code'] ?? ''
        ]);
        
        http_response_code(201);
        echo json_encode(['message' => 'Address added.', 'id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'Address ID is required']);
            break;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $query = "UPDATE user_addresses SET label=?, recipient_name=?, phone=?, full_address=?, city=?, postal_code=? 
                  WHERE id=? AND user_id=?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([
            $data['label'] ?? '', 
            $data['recipient_name'] ?? '', 
            $data['phone'] ?? '', 
            $data['full_address'] ?? '', 
            $data['city'] ?? '', 
            $data['postal_code'] ?? '',
            $id,
            $userId
        ]);
        
        echo json_encode(['message' => 'Address updated.']);
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'Address ID is required']);
            break;
        }

        $stmt = $pdo->prepare("DELETE FROM user_addresses WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        echo json_encode(['message' => 'Address deleted.']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
        break;
}
?>
