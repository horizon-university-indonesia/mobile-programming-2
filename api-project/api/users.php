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
            // Get single user by ID
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch();
            echo json_encode($user ? $user : ["message" => "User not found"]);
        } else {
            // Get all users
            $stmt = $pdo->query("SELECT * FROM users");
            $users = $stmt->fetchAll();
            echo json_encode($users);
        }
        break;

    case 'POST':
        // Create new user
        $data = json_decode(file_get_contents("php://input"), true);
        if (!empty($data['name']) && !empty($data['email'])) {
            $stmt = $pdo->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
            try {
                if ($stmt->execute([$data['name'], $data['email']])) {
                    http_response_code(201);
                    echo json_encode(["message" => "User created successfully", "id" => $pdo->lastInsertId()]);
                } else {
                    echo json_encode(["message" => "Failed to create user"]);
                }
            } catch (PDOException $e) {
                echo json_encode(["message" => "Error: " . $e->getMessage()]);
            }
        } else {
            echo json_encode(["message" => "Incomplete data. Name and Email are required."]);
        }
        break;

    case 'PUT':
        // Update user
        if ($id) {
            $data = json_decode(file_get_contents("php://input"), true);
            if (!empty($data['name']) && !empty($data['email'])) {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
                if ($stmt->execute([$data['name'], $data['email'], $id])) {
                    echo json_encode(["message" => "User updated successfully"]);
                } else {
                    echo json_encode(["message" => "Failed to update user"]);
                }
            } else {
                echo json_encode(["message" => "Incomplete data. Name and Email are required."]);
            }
        } else {
            echo json_encode(["message" => "ID is required"]);
        }
        break;

    case 'DELETE':
        // Delete user
        if ($id) {
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            if ($stmt->execute([$id])) {
                echo json_encode(["message" => "User deleted successfully"]);
            } else {
                echo json_encode(["message" => "Failed to delete user"]);
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

