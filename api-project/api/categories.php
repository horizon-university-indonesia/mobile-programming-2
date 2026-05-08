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
            // Get single category by ID
            $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
            $stmt->execute([$id]);
            $category = $stmt->fetch();
            echo json_encode($category ? $category : ["message" => "Category not found"]);
        } else {
            // Get all categories
            $stmt = $pdo->query("SELECT * FROM categories");
            $categories = $stmt->fetchAll();
            echo json_encode($categories);
        }
        break;

    case 'POST':
        // Create new category
        $data = json_decode(file_get_contents("php://input"), true);
        if (!empty($data['name'])) {
            $stmt = $pdo->prepare("INSERT INTO categories (name) VALUES (?)");
            try {
                if ($stmt->execute([$data['name']])) {
                    http_response_code(201);
                    echo json_encode(["message" => "Category created successfully", "id" => $pdo->lastInsertId()]);
                } else {
                    echo json_encode(["message" => "Failed to create Category"]);
                }
            } catch (PDOException $e) {
                echo json_encode(["message" => "Error: " . $e->getMessage()]);
            }
        } else {
            echo json_encode(["message" => "Incomplete data. Name is required."]);
        }
        break;

    case 'PUT':
        // Update Category
        if ($id) {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data['name'])) {
                $stmt = $pdo->prepare("UPDATE categories SET name = ? WHERE id = ?");
                if ($stmt->execute([$data['name'], $id])) {
                    echo json_encode(["message" => "Category updated successfully"]);
                } else {
                    echo json_encode(["message" => "Failed to update Category"]);
                }
            } else {
                echo json_encode(["message" => "Incomplete data. Name is required."]);
            }
        } else {
            echo json_encode(["message" => "ID is required"]);
        }
        break;

    case 'DELETE':
        // Delete Category
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = ?");
            if ($stmt->execute([$id])) {
                echo json_encode(["message" => "Category deleted successfully"]);
            } else {
                echo json_encode(["message" => "Failed to delete Category"]);
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

