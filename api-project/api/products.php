<?php
require_once '../config/database.php';

// Set response header to JSON
header("Content-Type: application/json; charset=UTF-8");

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}


// Get Request Method
$method = $_SERVER['REQUEST_METHOD'];

// Get ID from URL if exists
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single product by ID
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            $product = $stmt->fetch();
            echo json_encode($product ? $product : ["message" => "Product not found"]);
        } else {
            // Get all products
            $stmt = $pdo->query("SELECT * FROM products");
            $products = $stmt->fetchAll();
            echo json_encode($products);
        }
        break;

    case 'POST':
        // Menangkap data (bisa dari Form-Data atau JSON)
        $data = array_merge($_POST, (array)json_decode(file_get_contents("php://input"), true));
        $id = $data['id'] ?? null;

        // Proses Upload Gambar
        $imageUrl = $data['image_url'] ?? null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/products/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true); 
            
            $fileName = uniqid() . '_' . basename($_FILES['image']['name']);
            if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
                $imageUrl = 'uploads/products/' . $fileName;
            }
        }

        if (!empty($data['name']) && isset($data['price'])) {
            if ($id) {
                // LOGIKA UPDATE
                $sql = "UPDATE products SET sku = ?, barcode = ?, name = ?, price = ?, stock = ?, category_id = ?";
                $params = [
                    $data['sku'] ?? null,
                    $data['barcode'] ?? null,
                    $data['name'],
                    $data['price'],
                    $data['stock'] ?? 0,
                    $data['category_id'] ?? null
                ];

                // Hanya update image jika ada gambar baru
                if ($imageUrl) {
                    $sql .= ", image_url = ?";
                    $params[] = $imageUrl;
                }

                $sql .= " WHERE id = ?";
                $params[] = $id;

                $stmt = $pdo->prepare($sql);
                if ($stmt->execute($params)) {
                    echo json_encode(["message" => "Product updated successfully"]);
                } else {
                    echo json_encode(["message" => "Failed to update product"]);
                }
            } else {
                // LOGIKA INSERT (TAMBAH BARU)
                $stmt = $pdo->prepare("INSERT INTO products (sku, name, price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?)");
                if ($stmt->execute([
                    $data['sku'] ?? null,
                    $data['name'],
                    $data['price'],
                    $data['stock'] ?? 0,
                    $data['category_id'] ?? null,
                    $imageUrl
                ])) {
                    http_response_code(201);
                    echo json_encode(["message" => "Product created successfully", "id" => $pdo->lastInsertId()]);
                } else {
                    echo json_encode(["message" => "Failed to create product"]);
                }
            }
        } else {
            echo json_encode(["message" => "Incomplete data. Name and Price are required."]);
        }
        break;

    case 'PUT':
        // Update product
        if ($id) {
            $data = (array)json_decode(file_get_contents("php://input"), true);
            if (!empty($data['name']) && isset($data['price'])) {
                $stmt = $pdo->prepare("UPDATE products SET sku = ?, barcode = ?, name = ?, description = ?, category_id = ?, price = ?, stock = ?, image_url = ? WHERE id = ?");
                $params = [
                    $data['sku'] ?? null,
                    $data['barcode'] ?? null,
                    $data['name'],
                    $data['description'] ?? null,
                    $data['category_id'] ?? null,
                    $data['price'],
                    $data['stock'] ?? 0,
                    $data['image_url'] ?? null,
                    $id
                ];
                
                if ($stmt->execute($params)) {
                    echo json_encode(["message" => "Product updated successfully"]);
                } else {
                    echo json_encode(["message" => "Failed to update product"]);
                }
            } else {
                echo json_encode(["message" => "Incomplete data. Name and Price are required."]);
            }
        } else {
            echo json_encode(["message" => "ID is required"]);
        }
        break;

    case 'DELETE':
        // Delete product
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            if ($stmt->execute([$id])) {
                echo json_encode(["message" => "Product deleted successfully"]);
            } else {
                echo json_encode(["message" => "Failed to delete product"]);
            }
        } else {
            echo json_encode(["message" => "ID is required"]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}

