<?php
/*
 * File: generate_dummy.php
 * Deskripsi: Script untuk membuat data transaksi palsu agar grafik dashboard terlihat bagus.
 */

require_once __DIR__ . '/../config/database.php';

try {
    // 1. Membersihkan data lama (Opsional, hapus komentar jika ingin mengosongkan data)
    // $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
    // $pdo->exec("TRUNCATE TABLE transaction_items;");
    // $pdo->exec("TRUNCATE TABLE transactions;");
    // $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

    echo "Memulai pembuatan data dummy...\n";

    // Ambil ID produk pertama yang ada di database untuk referensi foreign key
    $stmtProduct = $pdo->query("SELECT id FROM products LIMIT 1");
    $product = $stmtProduct->fetch();
    $productId = $product ? $product['id'] : 1; // Default ke 1 jika tidak ada produk

    // 2. Loop untuk 14 hari ke belakang
    for ($i = 0; $i < 14; $i++) {
        // Tentukan tanggal (mengurangi $i hari dari hari ini)
        $date = date('Y-m-d H:i:s', strtotime("-$i days"));
        
        // Tentukan jumlah transaksi acak per hari (2 - 6 transaksi)
        $numTransactions = rand(2, 6);
        
        for ($j = 0; $j < $numTransactions; $j++) {
            // Tentukan nominal acak (Rp 50.000 - Rp 500.000)
            $subtotal = rand(5000, 50000) * 10; 
            $tax = $subtotal * 0.1;
            $total = $subtotal + $tax;
            
            // Insert ke tabel transactions
            $stmt = $pdo->prepare("INSERT INTO transactions (total_amount, tax_amount, final_amount, created_at) VALUES (?, ?, ?, ?)");
            $stmt->execute([$subtotal, $tax, $total, $date]);
            
            $transactionId = $pdo->lastInsertId();
            
            // 3. Insert ke tabel transaction_items (1-2 item per transaksi)
            $numItems = rand(1, 2);
            for ($k = 0; $k < $numItems; $k++) {
                $qty = rand(1, 4);
                $price = $subtotal / $numItems / $qty;
                
                $stmtItem = $pdo->prepare("INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)");
                $stmtItem->execute([$transactionId, $productId, "Produk Demo #$k", $qty, $price]);
            }
        }
    }

    echo "Berhasil! Data dummy untuk 14 hari terakhir telah dibuat.\n";
    echo "Silakan buka Dashboard di aplikasi mobile untuk melihat grafiknya.";

} catch (Exception $e) {
    echo "Gagal membuat data dummy: " . $e->getMessage();
}
?>
