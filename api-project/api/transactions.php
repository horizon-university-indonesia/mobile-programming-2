<?php
// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    http_response_code(200);
    exit();
}

// Hanya menerima POST request untuk membuat transaksi
if ($_SERVER["REQUEST_METHOD"] == 'POST') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Content-Type: application/json");

    // Hubungkan ke database
    require_once '../config/database.php';

    // Mulai transaksi database
    $pdo->beginTransaction();

    try {
        // Ambil data JSON dari body request
        $cart = json_decode(file_get_contents("php://input"), true);
        
        if (!$cart || !is_array($cart) || empty($cart)) {
            throw new Exception("Keranjang kosong atau format data tidak valid.");
        }

        $taxRate = 0.10; // Pajak 10%
        $subtotal = 0;

        // 1. Validasi stok dan hitung subtotal
        foreach ($cart as $item) {
            $stmt = $pdo->prepare("SELECT stock, price FROM products WHERE id = ?");
            $stmt->execute([$item['productId']]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$product) {
                throw new Exception("Produk tidak ditemukan untuk ID: " . $item['productId']);
            }
            if ($product['stock'] < $item['quantity']) {
                throw new Exception("Stok tidak mencukupi untuk produk ID: " . $item['productId'] . " (Sisa: " . $product['stock'] . ")");
            }

            $subtotal += $product['price'] * $item['quantity'];
        }

        $taxAmount = $subtotal * $taxRate;
        $finalAmount = $subtotal + $taxAmount;

        // 2. Simpan master transaksi
        $stmt = $pdo->prepare("INSERT INTO transactions (total_amount, tax_amount, final_amount) VALUES (?, ?, ?)");
        $stmt->execute([$subtotal, $taxAmount, $finalAmount]);
        $transactionId = $pdo->lastInsertId();

        // 3. Simpan rincian barang dan potong stok
        foreach ($cart as $item) {
            $stmt = $pdo->prepare("SELECT name, price FROM products WHERE id = ?");
            $stmt->execute([$item['productId']]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);

            $stmt = $pdo->prepare("INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$transactionId, $item['productId'], $product['name'], $item['quantity'], $product['price']]);

            $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmt->execute([$item['quantity'], $item['productId']]);
        }

        $pdo->commit();

        // Panggil method untuk generate struk PDF dan simpan ke folder receipts
        require_once 'generate_receipt.php';
        $receiptFile = generateReceiptFile($pdo, $transactionId);

        http_response_code(201);
        echo json_encode([
            'message' => 'Transaksi berhasil.',
            'transactionId' => $transactionId,
            'total' => $finalAmount,
            'receipt' => $receiptFile ? $receiptFile : 'Gagal generate struk'
        ]);
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(400);
        echo json_encode(['message' => 'Transaksi gagal: ' . $e->getMessage()]);
    }
    exit();
}

/**
 * Method lanjutan untuk mengambil data transaksi lengkap
 * Digunakan untuk keperluan cetak struk/bukti transaksi
 */
function getTransactionData($pdo, $transactionId) {
    try {
        // Ambil data utama transaksi
        $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
        $stmt->execute([$transactionId]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$transaction) {
            return null;
        }

        // Ambil rincian item transaksi
        $stmt = $pdo->prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
        $stmt->execute([$transactionId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'transaction' => $transaction,
            'items' => $items
        ];
    } catch (PDOException $e) {
        return null;
    }
}
?>
