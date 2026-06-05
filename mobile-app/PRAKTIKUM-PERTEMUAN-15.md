# Praktikum Pertemuan 15: Payment Integration & Microservices Architecture

Dokumen ini berisi panduan implementasi untuk Pertemuan 15 mata kuliah Mobile Programming 2. Pada praktikum kali ini, kita akan:
1. Mengintegrasikan **payment gateway** (simulasi Midtrans) ke aplikasi e-commerce
2. Membuat **webhook** untuk memperbarui status pembayaran secara otomatis
3. Mengelola **status pesanan** berdasarkan pembayaran
4. Memahami konsep **Microservices Architecture**
5. Membangun **API Gateway** sederhana

---

## Tahap 1: Database - Membuat Tabel Orders

Sebelum kita bisa memproses pembayaran, kita perlu tabel `orders` (pesanan) dan tabel `order_items` (item dalam pesanan) di database.

### 1. Eksekusi Query SQL melalui phpMyAdmin

Buka **XAMPP Control Panel**, pastikan **Apache** dan **MySQL** dalam keadaan **Start**. Buka browser dan akses `http://localhost/phpmyadmin`.

Pilih database project Anda (misal: `db_ecommerce`), klik tab **SQL**, lalu jalankan script berikut:

```sql
-- ============================================
-- Tabel orders: menyimpan data pesanan
-- ============================================
CREATE TABLE IF NOT EXISTS `orders` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `order_number` varchar(50) NOT NULL UNIQUE,
    `total_amount` decimal(10,2) NOT NULL,
    `status` varchar(50) NOT NULL DEFAULT 'pending',
    `payment_token` varchar(255) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Tabel order_items: menyiapkan item dalam pesanan
-- ============================================
CREATE TABLE IF NOT EXISTS `order_items` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `order_id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `product_name` varchar(255) NOT NULL,
    `quantity` int(11) NOT NULL,
    `price` decimal(10,2) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Tabel order_status_log: mencatat riwayat status
-- ============================================
CREATE TABLE IF NOT EXISTS `order_status_log` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `order_id` int(11) NOT NULL,
    `status_from` varchar(50) DEFAULT NULL,
    `status_to` varchar(50) NOT NULL,
    `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Penjelasan:**
- **orders**: Tabel utama untuk menyimpan data pesanan (nomor pesanan, total, status, token pembayaran)
- **order_items**: Menyimpan barang-barang yang ada di dalam pesanan
- **order_status_log**: Mencatat setiap perubahan status (berguna untuk audit trail)

---

## Tahap 2: Backend - API Create Order

Kita akan membuat endpoint API yang bertugas:
1. Menerima data pesanan dari aplikasi mobile
2. Menyimpan pesanan ke database
3. Membuat token pembayaran (disimulasi, karena kita pakai sandbox)
4. Mengembalikan token ke aplikasi

### 1. Buat File `api/create_order.php`

Buka folder `api-project/api/`, buat file baru bernama `create_order.php`, lalu ketik kode berikut:

```php
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

// -----------------------------------------------------
// Pastikan hanya method POST yang bisa mengakses
// -----------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit();
}

// -----------------------------------------------------
// Ambil data JSON yang dikirim dari aplikasi mobile
// -----------------------------------------------------
$data = json_decode(file_get_contents("php://input"), true);

// Validasi: pastikan data items ada dan tidak kosong
if (!isset($data['items']) || !is_array($data['items']) || count($data['items']) === 0) {
    http_response_code(400);
    echo json_encode(['message' => 'Data items tidak boleh kosong']);
    exit();
}

// User ID sementara (karena belum ada login)
$userId = 2; // Jane Smith

try {
    // -----------------------------------------------------
    // 1. Hitung total amount dari semua items
    // -----------------------------------------------------
    $totalAmount = 0;
    foreach ($data['items'] as $item) {
        $totalAmount += $item['price'] * $item['quantity'];
    }

    // -----------------------------------------------------
    // 2. Generate nomor pesanan unik
    // -----------------------------------------------------
    // Contoh: ORD-1712345678
    $orderNumber = 'ORD-' . time();

    // -----------------------------------------------------
    // 3. Simpan data pesanan ke tabel orders
    // -----------------------------------------------------
    $stmt = $pdo->prepare("
        INSERT INTO orders (user_id, order_number, total_amount, status)
        VALUES (?, ?, ?, 'pending')
    ");
    $stmt->execute([$userId, $orderNumber, $totalAmount]);
    $orderId = $pdo->lastInsertId();

    // -----------------------------------------------------
    // 4. Simpan item-item pesanan ke tabel order_items
    // -----------------------------------------------------
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

    // -----------------------------------------------------
    // 5. SIMULASI: Buat Snap Token palsu
    // -----------------------------------------------------
    // DILARANG COPY-PASTE SEMBARANGAN! Bagian ini penting.
    //
    // Di dunia nyata, kita akan memanggil API Midtrans seperti ini:
    //
    // $midtransUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    // $serverKey = 'YOUR_SERVER_KEY'; // Ganti dengan server key Anda dari akun Midtrans
    //
    // $transactionDetails = [
    //     'order_id' => $orderNumber,
    //     'gross_amount' => $totalAmount,
    // ];
    //
    // $ch = curl_init();
    // curl_setopt($ch, CURLOPT_URL, $midtransUrl);
    // curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    // curl_setopt($ch, CURLOPT_POST, 1);
    // curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($transactionDetails));
    // curl_setopt($ch, CURLOPT_HTTPHEADER, [
    //     'Authorization: Basic ' . base64_encode($serverKey . ':'),
    //     'Content-Type: application/json'
    // ]);
    // $response = curl_exec($ch);
    // $result = json_decode($response, true);
    // $snapToken = $result['token'];
    //
    // Tapi KARENA KITA BELUM PPAKAI MIDTRANS ASLI, kita buat token palsu saja:

    // Token palsu untuk simulasi:
    $snapToken = 'MOCK_SNAP_TOKEN_' . bin2hex(random_bytes(16));

    // -----------------------------------------------------
    // 6. Simpan token ke database
    // -----------------------------------------------------
    $stmt = $pdo->prepare("UPDATE orders SET payment_token = ? WHERE id = ?");
    $stmt->execute([$snapToken, $orderId]);

    // -----------------------------------------------------
    // 7. Catat log status
    // -----------------------------------------------------
    $stmtLog = $pdo->prepare("
        INSERT INTO order_status_log (order_id, status_from, status_to)
        VALUES (?, NULL, 'pending')
    ");
    $stmtLog->execute([$orderId]);

    // -----------------------------------------------------
    // 8. Kirim response sukses ke aplikasi mobile
    // -----------------------------------------------------
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
```

**Apa yang terjadi di kode di atas?**

| Langkah | Penjelasan |
|---------|------------|
| 1-2 | Menerima data JSON dari aplikasi dan memvalidasinya |
| 3 | Generate nomor pesanan unik (`ORD-` + timestamp) |
| 4 | Simpan pesanan ke tabel `orders` |
| 5 | Simpan semua barang ke tabel `order_items` |
| 6 | Buat token palsu (simulasi Snap Token Midtrans) |
| 7 | Simpan token ke database |
| 8 | Catat log bahwa pesanan dibuat dengan status "pending" |
| 9 | Kirim response berisi snapToken ke aplikasi mobile |

---

## Tahap 3: Backend - API Webhook Midtrans

Webhook adalah **notifikasi server-to-server**. Setelah pengguna membayar di halaman Midtrans, server Midtrans akan memanggil endpoint webhook kita untuk memberi tahu hasil pembayarannya.

### 1. Buat File `api/midtrans_webhook.php`

Buat file baru di folder `api-project/api/` bernama `midtrans_webhook.php`:

```php
<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");

// -----------------------------------------------------
// 1. Baca data JSON yang dikirim oleh Midtrans
// -----------------------------------------------------
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Catat log webhook yang masuk (untuk debugging)
$logFile = '../webhook_log.txt';
$logData = date('Y-m-d H:i:s') . ' - WEBHOOK RECEIVED: ' . $json . PHP_EOL;
file_put_contents($logFile, $logData, FILE_APPEND);

// -----------------------------------------------------
// 2. CEK KEAMANAN: Verifikasi Signature (SANGAT PENTING!)
// -----------------------------------------------------
// Setiap request dari Midtrans memiliki signature di header.
// Kita harus memverifikasinya agar tidak ada pihak jahat
// yang memalsukan notifikasi pembayaran.

// ***** GANTI 'YOUR_SERVER_KEY' dengan Server Key asli Anda *****
$serverKey = 'YOUR_SERVER_KEY';

// Ambil signature dari header HTTP
$incomingSignature = $_SERVER['HTTP_X_MIDTRANS_SIGNATURE'] ?? '';

// Buat signature yang seharusnya (berdasarkan data yang diterima)
$expectedSignature = hash('sha512', 
    $data['order_id'] . 
    $data['status_code'] . 
    $data['gross_amount'] . 
    $serverKey
);

// Bandingkan: apakah signature cocok?
if ($incomingSignature !== $expectedSignature) {
    // Jika signature tidak cocok, tolak request (403 Forbidden)
    http_response_code(403);
    file_put_contents($logFile, "INVALID SIGNATURE! Expected: $expectedSignature, Got: $incomingSignature" . PHP_EOL, FILE_APPEND);
    exit('Invalid Signature');
}

// -----------------------------------------------------
// 3. Proses notifikasi (hanya jika signature valid)
// -----------------------------------------------------
$orderNumber = $data['order_id'];
$transactionStatus = $data['transaction_status']; // capture, settlement, pending, deny, expire
$fraudStatus = $data['fraud_status'] ?? 'accept'; // accept, deny, challenge

// -----------------------------------------------------
// 4. Mapping status Midtrans ke status pesanan kita
// -----------------------------------------------------
$newStatus = 'pending';

if ($transactionStatus == 'capture' || $transactionStatus == 'settlement') {
    // Pembayaran BERHASIL
    $newStatus = 'paid';
} elseif ($transactionStatus == 'pending') {
    // Pembayaran masih menunggu (belum dibayar)
    $newStatus = 'waiting_for_payment';
} elseif ($transactionStatus == 'deny' || $transactionStatus == 'expire') {
    // Pembayaran DITOLAK atau KADALUARSA
    $newStatus = 'cancelled';
} elseif ($transactionStatus == 'cancel') {
    // Pembayaran dibatalkan
    $newStatus = 'cancelled';
}

// -----------------------------------------------------
// 5. Update status pesanan di database
// -----------------------------------------------------
try {
    // Ambil status lama untuk dicatat di log
    $stmt = $pdo->prepare("SELECT status FROM orders WHERE order_number = ?");
    $stmt->execute([$orderNumber]);
    $oldOrder = $stmt->fetch(PDO::FETCH_ASSOC);
    $oldStatus = $oldOrder ? $oldOrder['status'] : null;

    // Update status di tabel orders
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE order_number = ?");
    $stmt->execute([$newStatus, $orderNumber]);

    // Catat perubahan status ke order_status_log
    $stmtLog = $pdo->prepare("
        INSERT INTO order_status_log (order_id, status_from, status_to)
        SELECT id, ?, ? FROM orders WHERE order_number = ?
    ");
    $stmtLog->execute([$oldStatus, $newStatus, $orderNumber]);

    // Catat di log file
    file_put_contents($logFile, "Order $orderNumber updated: $oldStatus -> $newStatus" . PHP_EOL, FILE_APPEND);

} catch (Exception $e) {
    file_put_contents($logFile, "ERROR updating order: " . $e->getMessage() . PHP_EOL, FILE_APPEND);
}

// -----------------------------------------------------
// 6. Kirim response 200 OK ke Midtrans
// -----------------------------------------------------
// Penting! Midtrans akan mengirim ulang webhook jika tidak
// menerima response 200. Jadi pastikan kita kirim 200.
http_response_code(200);
echo 'OK';
?>
```

**PENTING: Penjelasan Verifikasi Signature**

Coba bayangkan: Ada orang jahat yang tahu endpoint webhook kita. Dia bisa mengirim request palsu dengan data `transaction_status: settlement` untuk pesanan orang lain. Akibatnya, pesanan yang belum dibayar bisa berubah status menjadi "paid".

Signature mencegah ini. Cara kerjanya:
1. Midtrans memiliki **Server Key** (rahasia, hanya kita dan Midtrans yang tahu)
2. Midtrans membuat signature dengan rumus: `SHA512(order_id + status_code + gross_amount + server_key)`
3. Signature ini dikirim di header HTTP
4. Di server kita, kita menghitung ulang signature dengan rumus yang sama
5. Jika hasilnya cocok, berarti request benar-benar dari Midtrans

---

## Tahap 4: Backend - API Cek Status Pesanan

Buat endpoint untuk mengecek status pesanan dari aplikasi mobile. Buat file `api/order_status.php`:

```php
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

// Ambil order_number atau order_id dari URL
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

    // Ambil log status
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
```

---

## Tahap 5: Frontend - Modifikasi Alur Checkout ke Payment

Sekarang kita akan mengubah `ShippingMethodScreen.js` menjadi halaman **CheckoutScreen** yang lengkap dengan ringkasan pesanan dan tombol bayar.

### 1. Ubah `screens/ShippingMethodScreen.js` menjadi PaymentScreen

Tulis ulang file `ShippingMethodScreen.js` dengan kode berikut:

```javascript
/*
 * ==========================================
 * PaymentScreen.js
 * 
 * Halaman terakhir sebelum pembayaran.
 * Menampilkan ringkasan pesanan (alamat, ongkir, total)
 * dan tombol "Bayar Sekarang" yang memanggil API create_order.
 * ==========================================
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import apiClient from '../api/config';

const PaymentScreen = ({ route, navigation }) => {
    // Menerima data dari layar sebelumnya (ShippingMethod)
    const { addressId, cartItems, subtotal, shippingCost } = route.params || {};

    // State untuk loading (mencegah klik ganda)
    const [isLoading, setIsLoading] = useState(false);

    // Biaya pengiriman (default 15000 jika tidak dikirim)
    const shipping = shippingCost || 15000;
    const tax = subtotal ? subtotal * 0.1 : 0;
    const total = (subtotal || 0) + shipping + tax;

    /*
     * Fungsi handlePayment:
     * 1. Panggil API /create_order.php dengan data items
     * 2. Dapatkan snapToken dari response
     * 3. Navigasi ke PaymentStatusScreen dengan data pesanan
     */
    const handlePayment = async () => {
        // Validasi: pastikan ada items
        if (!cartItems || cartItems.length === 0) {
            Alert.alert('Error', 'Tidak ada item untuk dibayar');
            return;
        }

        setIsLoading(true);

        try {
            // Panggil API create_order
            const response = await apiClient.post('/create_order.php', {
                items: cartItems,
                address_id: addressId,
                shipping_cost: shipping
            });

            const { snapToken, orderId, orderNumber, totalAmount } = response.data;

            console.log('Order created:', orderNumber);
            console.log('Snap Token:', snapToken);

            // -------------------------------------------------
            // NOTE: Di dunia nyata, kita akan memanggil:
            //
            // import { MidtransSnap } from 'midtrans-react-native';
            // const result = await MidtransSnap.startPayment(snapToken);
            //
            // Tapi karena kita hanya simulasi, kita anggap
            // pembayaran berhasil dan langsung navigasi.
            // -------------------------------------------------

            // Navigasi ke halaman status pembayaran
            navigation.navigate('PaymentStatus', {
                orderId: orderId,
                orderNumber: orderNumber,
                snapToken: snapToken,
                totalAmount: totalAmount
            });

        } catch (error) {
            console.error('Payment failed:', error);
            Alert.alert(
                'Pembayaran Gagal',
                error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* HEADER */}
            <Text style={styles.title}>Ringkasan Pembayaran</Text>

            {/* INFO ALAMAT */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
                <Text style={styles.sectionContent}>
                    Alamat ID: {addressId || 'Tidak dipilih'}
                </Text>
            </View>

            {/* DAFTAR PRODUK */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Produk Dipesan</Text>
                {cartItems && cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQty}>x{item.quantity}</Text>
                            <Text style={styles.itemPrice}>
                                Rp. {(item.price * item.quantity).toLocaleString('id-ID')}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.sectionContent}>Tidak ada produk</Text>
                )}
            </View>

            {/* RINCIAN BIAYA */}
            <View style={styles.section}>
                <View style={styles.totalRow}>
                    <Text>Subtotal</Text>
                    <Text>Rp. {(subtotal || 0).toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text>Ongkos Kirim</Text>
                    <Text>Rp. {shipping.toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text>Pajak (10%)</Text>
                    <Text>Rp. {tax.toLocaleString('id-ID')}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.totalLabel}>Total Pembayaran</Text>
                    <Text style={styles.totalAmount}>
                        Rp. {total.toLocaleString('id-ID')}
                    </Text>
                </View>
            </View>

            {/* TOMBOL BAYAR */}
            <View style={styles.buttonContainer}>
                <Button
                    title={isLoading ? 'Memproses...' : 'Bayar Sekarang'}
                    onPress={handlePayment}
                    disabled={isLoading || !cartItems || cartItems.length === 0}
                    color="#28a745"
                />
                {isLoading && (
                    <ActivityIndicator
                        size="small"
                        color="#28a745"
                        style={{ marginTop: 10 }}
                    />
                )}
            </View>

            {/* INFORMASI SIMULASI */}
            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Info Praktikum:</Text>
                <Text style={styles.infoText}>
                    Karena kita belum memiliki akun Midtrans sungguhan, pembayaran
                    menggunakan Snap Token SIMULASI. Di dunia nyata, setelah
                    menekan "Bayar Sekarang", aplikasi akan membuka halaman
                    pembayaran Midtrans (kartu kredit, transfer, GoPay, dll).
                </Text>
                <Text style={styles.infoText}>
                    Setelah pembayaran "selesai", status pesanan akan diperbarui
                    oleh webhook (Tahap 3).
                </Text>
            </View>
        </ScrollView>
    );
};

export default PaymentScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    section: {
        backgroundColor: '#fff',
        margin: 10,
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    sectionContent: {
        fontSize: 14,
        color: '#666',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemName: {
        flex: 2,
        fontSize: 14,
    },
    itemQty: {
        flex: 1,
        fontSize: 14,
        textAlign: 'center',
    },
    itemPrice: {
        flex: 1,
        fontSize: 14,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    grandTotal: {
        borderTopWidth: 2,
        borderTopColor: '#333',
        marginTop: 10,
        paddingTop: 10,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    buttonContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoBox: {
        backgroundColor: '#fff3cd',
        margin: 10,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffc107',
        marginBottom: 40,
    },
    infoTitle: {
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 5,
    },
    infoText: {
        fontSize: 13,
        color: '#856404',
        marginBottom: 5,
        lineHeight: 20,
    },
});
```

### 2. Buat `screens/PaymentStatusScreen.js`

Buat file baru di folder `screens/` bernama `PaymentStatusScreen.js`:

```javascript
/*
 * ==========================================
 * PaymentStatusScreen.js
 *
 * Halaman yang muncul SETELAH pembayaran.
 * Di sini user bisa melihat status pesanannya.
 * 
 * NOTE: Karena webhook butuh waktu beberapa detik,
 * halaman ini akan melakukan polling (mengecek
 * berulang kali) ke API untuk melihat apakah
 * status pesanan sudah berubah menjadi "paid".
 * ==========================================
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    ActivityIndicator,
} from 'react-native';
import apiClient from '../api/config';

const PaymentStatusScreen = ({ route, navigation }) => {
    // Terima data dari layar PaymentScreen
    const { orderId, orderNumber, snapToken, totalAmount } = route.params || {};

    // Status pesanan saat ini
    const [orderStatus, setOrderStatus] = useState('pending');
    const [isChecking, setIsChecking] = useState(true);

    // Simpan ID interval untuk dibersihkan nanti
    const intervalRef = useRef(null);

    /*
     * useEffect: Saat halaman terbuka, kita mulai polling
     * (mengecek status setiap 3 detik) ke API.
     * Webhook mungkin butuh waktu untuk memproses pembayaran.
     */
    useEffect(() => {
        checkOrderStatus();

        // Cek setiap 3 detik
        intervalRef.current = setInterval(checkOrderStatus, 3000);

        // Bersihkan interval saat komponen di-unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    /*
     * checkOrderStatus: Memanggil API order_status.php
     * untuk mendapatkan status terbaru pesanan
     */
    const checkOrderStatus = async () => {
        try {
            const response = await apiClient.get('/order_status.php', {
                params: { order_id: orderId }
            });

            if (response.data.success) {
                const status = response.data.order.status;
                setOrderStatus(status);

                // Jika status sudah "paid" atau "cancelled", berhenti polling
                if (status === 'paid' || status === 'cancelled') {
                    setIsChecking(false);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking order status:', error);
        }
    };

    /*
     * getStatusInfo: Mengembalikan teks dan warna
     * berdasarkan status pesanan
     */
    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    text: 'Pesanan dibuat, menunggu pembayaran...',
                    color: '#ffc107',
                    icon: '⏳'
                };
            case 'waiting_for_payment':
                return {
                    text: 'Menunggu pembayaran...',
                    color: '#ffc107',
                    icon: '⏳'
                };
            case 'paid':
                return {
                    text: 'Pembayaran BERHASIL! Pesanan sedang diproses.',
                    color: '#28a745',
                    icon: '✅'
                };
            case 'cancelled':
                return {
                    text: 'Pembayaran dibatalkan atau gagal.',
                    color: '#dc3545',
                    icon: '❌'
                };
            default:
                return {
                    text: 'Status tidak diketahui',
                    color: '#6c757d',
                    icon: '❓'
                };
        }
    };

    const statusInfo = getStatusInfo(orderStatus);

    return (
        <View style={styles.container}>
            {/* ICON STATUS */}
            <Text style={[styles.icon, { color: statusInfo.color }]}>
                {statusInfo.icon}
            </Text>

            {/* NOMOR PESANAN */}
            <Text style={styles.orderNumber}>
                Pesanan: {orderNumber}
            </Text>

            {/* STATUS */}
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>

            {/* TOTAL */}
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalAmount}>
                Rp. {(totalAmount || 0).toLocaleString('id-ID')}
            </Text>

            {/* INDIKATOR POLLING */}
            {isChecking && (
                <View style={styles.checkingContainer}>
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text style={styles.checkingText}>
                        Mengecek status pembayaran...
                    </Text>
                </View>
            )}

            {/* TOMBOL LIHAT PESANAN (hanya jika sudah paid) */}
            {orderStatus === 'paid' && (
                <Button
                    title="Lihat Pesanan Saya"
                    onPress={() => navigation.navigate('ProductCatalog')}
                    color="#28a745"
                />
            )}

            {/* TOMBOL KEMBALI */}
            {orderStatus === 'cancelled' && (
                <Button
                    title="Coba Lagi"
                    onPress={() => navigation.goBack()}
                    color="#dc3545"
                />
            )}
        </View>
    );
};

export default PaymentStatusScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    icon: {
        fontSize: 64,
        marginBottom: 20,
    },
    orderNumber: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 30,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
    },
    checkingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkingText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#007bff',
    },
});
```

### 3. Update Navigasi di `App.js`

Sekarang kita perlu mendaftarkan dua screen baru (`PaymentScreen` dan `PaymentStatusScreen`) di `App.js`.

Buka `App.js` dan lakukan perubahan berikut:

**a) Tambahkan import di bagian atas:**

```javascript
import PaymentScreen from './screens/PaymentScreen';
import PaymentStatusScreen from './screens/PaymentStatusScreen';
```

**b) Update `CheckoutStack` untuk memasukkan PaymentScreen:**

```javascript
const CheckoutStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} options={{ title: 'Pilih Alamat' }} />
    <Stack.Screen name="ShippingMethod" component={ShippingMethodScreen} options={{ title: 'Metode Pengiriman' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pembayaran' }} />
  </Stack.Navigator>
);
```

**c) Tambahkan screen PaymentStatus di `Stack.Navigator` utama (setelah CheckoutStack):**

```javascript
<Stack.Screen
  name="PaymentStatus"
  component={PaymentStatusScreen}
  options={{ title: 'Status Pembayaran', headerBackVisible: false }}
/>
```

> **Catatan:** `headerBackVisible: false` mencegah user kembali ke halaman pembayaran setelah pesanan dibuat.

### 4. Update `ShippingMethodScreen.js` untuk melanjutkan ke Payment

Sekarang kita ubah tombol "Selesaikan Pesanan (Mock)" di ShippingMethodScreen agar mengarah ke PaymentScreen.

Tulis ulang `ShippingMethodScreen.js` dengan kode berikut. Perhatikan bahwa data keranjang diambil dari **API cart.php** (bukan CartContext) karena CartContext pada project ini belum terisi oleh screen lain.

```javascript
import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, Button, ActivityIndicator} from 'react-native';
import apiClient from '../api/config';

const ShippingMethodScreen = ({route, navigation}) => {
    const {addressId} = route.params || {};
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await apiClient.get('/cart.php');
            setCartItems(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (loading) {
        return <ActivityIndicator style={{flex: 1}} size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Langkah 3: Metode Pengiriman</Text>
            <Text style={styles.info}>Alamat ID yang dipilih: {addressId}</Text>

            <View style={styles.placeholderBox}>
                <Text>Halaman ini adalah placeholder untuk kelanjutan checkout.</Text>
                <Text style={{marginTop: 10}}>Di sini pengguna akan memilih kurir, menghitung ongkir, dan melanjutkan ke pembayaran.</Text>
            </View>

            <Button
                title="Lanjut ke Pembayaran"
                onPress={() => {
                    navigation.navigate('Payment', {
                        addressId: addressId,
                        cartItems: cartItems,
                        subtotal: subtotal,
                        shippingCost: 15000
                    });
                }}
                disabled={cartItems.length === 0}
            />
        </View>
    );
};
```

---

## Tahap 6: Simulasi Webhook dengan cURL (Testing)

Setelah semua selesai, kita perlu menguji apakah webhook berfungsi dengan benar. Kita akan **mensimulasikan** Midtrans mengirim notifikasi ke server kita.

### 1. Pastikan Server Berjalan

Buka XAMPP, pastikan **Apache** dan **MySQL** dalam keadaan **Start**.

### 2. Kirim Request Webhook Palsu

Buka **terminal/command prompt** dan jalankan perintah berikut:

```bash
curl -X POST http://localhost/api/midtrans_webhook.php \
  -H "Content-Type: application/json" \
  -H "X-Midtrans-Signature: test_signature" \
  -d '{
    "order_id": "ORD-1712345678",
    "status_code": "200",
    "transaction_status": "settlement",
    "gross_amount": "100000.00",
    "fraud_status": "accept"
  }'
```

**Penjelasan:**
- `order_id`: Isi dengan nomor pesanan yang baru saja dibuat
- `transaction_status: settlement`: Berarti pembayaran berhasil
- Jika signature tidak valid, webhook akan mengembalikan **403 Forbidden**

### 3. Cek Database

Setelah menjalankan cURL, cek di phpMyAdmin:
- Tabel `orders`: Status akan berubah dari `pending` menjadi `paid`
- Tabel `order_status_log`: Akan ada catatan perubahan status

### 4. Atau Cek via Aplikasi Mobile

Buka halaman `PaymentStatusScreen`, jika polling berjalan, status akan otomatis berubah dari "pending" menjadi "paid" dalam beberapa detik.

---

## Tahap 7: Memahami Status Pesanan (Order Status Management)

Setelah pembayaran, pesanan akan melalui beberapa status. Berikut adalah **state machine** (siklus hidup) pesanan:

```
                    ┌──────────┐
                    │ PENDING  │ ← Pesanan baru dibuat
                    └────┬─────┘
                         │
                    ┌────▼──────────┐
                    │ WAITING FOR   │ ← Menunggu pembayaran
                    │ PAYMENT       │
                    └────┬──────────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼────┐ ┌──▼───┐ ┌───▼───┐
         │  PAID   │ │CANCEL│ │EXPIRE │
         │         │ │LED   │ │       │
         └────┬────┘ └──────┘ └───────┘
              │
         ┌────▼──────┐
         │ PROCESSING│ ← Sedang diproses
         └────┬──────┘
              │
         ┌────▼──────┐
         │  SHIPPED  │ ← Dikirim
         └────┬──────┘
              │
         ┌────▼────────┐
         │  DELIVERED  │ ← Sudah sampai
         └────┬────────┘
              │
         ┌────▼──────────┐
         │  COMPLETED    │ ← Selesai
         └───────────────┘
```

**Tugas Mahasiswa:** Di file `midtrans_webhook.php`, kita sudah menangani 3 status:
- `capture/settlement` → `paid`
- `pending` → `waiting_for_payment`
- `deny/expire` → `cancelled`

Coba tambahkan logika untuk status `processing`, `shipped`, `delivered`, dan `completed`. Buat endpoint API baru seperti `api/update_order_status.php` yang bisa dipanggil oleh admin untuk mengubah status pesanan secara manual.

---

## Tahap 8: Konsep Microservices Architecture

Selama praktikum sebelumnya, kita membuat 1 file API besar (`api/products.php`) yang menangani SEMUA operasi produk. Ini disebut **Monolithic Architecture**.

Sekarang, kita akan memahami konsep **Microservices**: memecah satu API besar menjadi beberapa service kecil yang independen.

### 1. Struktur Folder Microservices

Bayangkan struktur folder berikut di dalam folder `api-project/`:

```
/microservices-project/
├── api-gateway.php        ← PINTU MASUK (satu pintu untuk semua)
├── auth-service/
│   └── index.php          ← Hanya urusan login & register
├── product-service/
│   └── index.php          ← Hanya urusan produk & kategori
└── order-service/
    └── index.php          ← Hanya urusan keranjang, pesanan, pembayaran
```

### 2. Contoh: Service Produk (`product-service/index.php`)

Buat folder `microservices-project` di `htdocs`, lalu buat subfolder dan file:

```php
<?php
// ==========================================
// product-service/index.php
// 
// Service ini hanya menangani PRODUK.
// Tidak ada kode untuk user, cart, atau order
// di sini!
// ==========================================

require_once '../../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        if ($id) {
            // Ambil 1 produk
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } else {
            // Ambil semua produk
            $stmt = $pdo->query("SELECT p.*, c.name as category_name 
                                 FROM products p 
                                 LEFT JOIN categories c ON p.category_id = c.id 
                                 ORDER BY p.id DESC");
            echo json_encode($stmt->fetchAll());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>
```

### 3. Contoh: Service Pesanan (`order-service/index.php`)

```php
<?php
// ==========================================
// order-service/index.php
//
// Service ini hanya menangani PESANAN & CART.
// ==========================================

require_once '../../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, User-Id");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null; // ?action=cart atau ?action=orders

switch ($method) {
    case 'GET':
        if ($action === 'orders') {
            // Ambil semua pesanan
            $stmt = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC");
            echo json_encode($stmt->fetchAll());
        } else {
            // Ambil cart
            $userId = 2;
            $stmt = $pdo->prepare("SELECT p.id as product_id, p.name, p.price, c.quantity
                                  FROM carts c
                                  JOIN products p ON c.product_id = p.id
                                  WHERE c.user_id = ?");
            $stmt->execute([$userId]);
            echo json_encode($stmt->fetchAll());
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
        break;
}
?>
```

---

## Tahap 9: API Gateway Sederhana

API Gateway adalah **pintu masuk tunggal** untuk semua service. Aplikasi mobile hanya perlu memanggil 1 URL, dan gateway akan meneruskan ke service yang tepat.

### 1. Buat `microservices-project/api-gateway.php`

```php
<?php
// ==========================================
// api-gateway.php
//
// PINTU MASUK SATU-SATUNYA untuk semua request.
//
// Cara kerja:
// - /api/auth/*     → diteruskan ke Auth Service
// - /api/products/* → diteruskan ke Product Service
// - /api/orders/*   → diteruskan ke Order Service
// ==========================================

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// -----------------------------------------------------
// ROUTING: Tentukan ke service mana request ini pergi
// -----------------------------------------------------
if (strpos($requestUri, '/api/auth') === 0) {
    // Contoh: /api/auth/login → http://localhost:8001/login
    proxyRequest('http://localhost:8001', $requestUri, $method);

} elseif (strpos($requestUri, '/api/products') === 0) {
    // Contoh: /api/products → http://localhost:8002/products
    proxyRequest('http://localhost:8002', $requestUri, $method);

} elseif (strpos($requestUri, '/api/orders') === 0) {
    // Contoh: /api/orders/create → http://localhost:8003/create
    proxyRequest('http://localhost:8003', $requestUri, $method);

} else {
    http_response_code(404);
    echo json_encode(['message' => 'Endpoint not found.']);
}

// -----------------------------------------------------
// Fungsi proxyRequest: Meneruskan request ke service tujuan
// -----------------------------------------------------
function proxyRequest($serviceUrl, $uri, $method) {
    // Buat URL lengkap: serviceUrl + uri
    // Contoh: http://localhost:8001 + /api/auth/login
    $url = $serviceUrl . $uri;

    // Inisialisasi cURL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    // Forward headers (kecuali Host, karena Host akan di-set otomatis oleh cURL)
    $headers = getallheaders();
    $cleanHeaders = [];
    foreach ($headers as $name => $value) {
        if (strtolower($name) !== 'host') {
            $cleanHeaders[] = "$name: $value";
        }
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $cleanHeaders);

    // Forward body (untuk POST/PUT)
    if ($method === 'POST' || $method === 'PUT') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }

    // Eksekusi dan dapatkan response dari service tujuan
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Kirim response dari service ke klien (aplikasi mobile)
    http_response_code($httpCode);
    echo $response;
}
?>
```

### 2. Cara Menggunakan API Gateway

**Sebelum ada API Gateway** (aplikasi mobile memanggil banyak URL):
```
/api/cart.php
/api/products.php
/api/users.php
/api/create_order.php
/api/midtrans_webhook.php
```

**Setelah ada API Gateway** (aplikasi mobile hanya panggil 1 URL):
```
/api-gateway.php/api/orders/cart
/api-gateway.php/api/products
/api-gateway.php/api/auth/login
/api-gateway.php/api/orders/create
```

### 3. Update Konfigurasi di Aplikasi Mobile

Edit `api/config.js`:

```javascript
const apiClient = axios.create({
    // Ganti dari '/api' menjadi '/microservices-project/api-gateway.php'
    baseURL: 'http://10.25.210.16/microservices-project/api-gateway.php',
    headers: {
        'Content-Type': 'application/json',
    },
});
```

---

## Tahap 10: Verifikasi & Pengujian

### Skenario Pengujian Lengkap

1. **Jalankan aplikasi** di emulator/HP
2. Buka layar **Katalog Produk**
3. Tambahkan produk ke **Keranjang**
4. Klik **Lanjut ke Checkout**
5. Pilih **Alamat**
6. Pilih **Metode Pengiriman**
7. Di halaman **Pembayaran**, cek ringkasan pesanan (subtotal, ongkir, pajak, total)
8. Klik **Bayar Sekarang**
9. Aplikasi akan membuat pesanan via `create_order.php` dan mendapatkan Snap Token
10. Aplikasi akan navigasi ke **PaymentStatusScreen**
11. Untuk simulasi, jalankan **cURL command** dari Tahap 6 untuk mengirim webhook palsu
12. Setelah beberapa detik, status di PaymentStatusScreen akan berubah menjadi ✅ **Pembayaran BERHASIL**

### Cek Database

Setelah pengujian, cek di phpMyAdmin:
- `orders` → Ada data pesanan baru
- `order_items` → Ada item-item di dalam pesanan
- `order_status_log` → Ada riwayat perubahan status
- `webhook_log.txt` (di folder `api-project/`) → Ada log webhook yang diterima

---

## Lampiran: Daftar Endpoint API yang Dibuat

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/create_order.php` | POST | Membuat pesanan baru dan mengembalikan snap token |
| `/api/midtrans_webhook.php` | POST | Menerima notifikasi dari payment gateway |
| `/api/order_status.php` | GET | Mengecek status pesanan (dengan polling) |
| `/microservices-project/api-gateway.php` | ALL | Pintu masuk untuk arsitektur microservices |

---

## Tugas Tambahan (Untuk Dipraktikkan Mandiri)

1. **Mapping Status Lengkap:** Tambahkan status `processing`, `shipped`, `delivered`, `completed` di database dan buat API untuk mengubahnya
2. **Dashboard Pesanan:** Buat screen baru `OrderListScreen.js` yang menampilkan daftar pesanan user
3. **Midtrans Asli:** Daftar akun Midtrans sandbox (https://dashboard.midtrans.com) dan ganti kode simulasi dengan kode asli (gunakan cURL untuk memanggil API Midtrans)
4. **Multiple Services:** Jalankan masing-masing service (auth, product, order) di port berbeda menggunakan `php -S localhost:8001` dan uji API Gateway

---

*Selamat! Anda telah berhasil mengintegrasikan payment gateway dan memahami arsitektur microservices. Dua skill yang sangat dicari di industri software engineering.*
