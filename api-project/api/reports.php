<?php
/*
 * File: reports.php
 * Deskripsi: Endpoint untuk mengambil data ringkasan penjualan (Dashboard)
 */

// Header CORS agar API bisa diakses dari aplikasi mobile
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Menangani Preflight Request untuk CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Mengimpor koneksi database
require_once '../config/database.php';

// Menentukan tipe laporan (default: daily)
$type = isset($_GET['type']) ? $_GET['type'] : 'daily';

try {
    if ($type === 'daily') {
        /*
         * Query Laporan Harian:
         * Mengelompokkan transaksi berdasarkan tanggal (DATE)
         * Menjumlahkan (SUM) total bayar (final_amount)
         * Mengambil 7 hari terakhir
         */
        $query = "SELECT DATE(created_at) as report_date, SUM(final_amount) as total_sales 
                  FROM transactions 
                  GROUP BY DATE(created_at) 
                  ORDER BY report_date DESC 
                  LIMIT 7";
    } else {
        /*
         * Query Laporan Mingguan:
         * Mengelompokkan transaksi berdasarkan minggu ke-berapa dalam setahun (WEEK)
         * Menjumlahkan total bayar
         * Mengambil 4 minggu terakhir
         */
        $query = "SELECT WEEK(created_at) as report_week, SUM(final_amount) as total_sales 
                  FROM transactions 
                  GROUP BY WEEK(created_at) 
                  ORDER BY report_week DESC 
                  LIMIT 4";
    }

    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    /*
     * Transformasi data untuk kebutuhan grafik Victory Native di Frontend.
     * Victory Native membutuhkan array objek dengan properti 'x' (label) dan 'y' (nilai).
     */
    $chartData = array_map(function($item) use ($type) {
        // Format label: Jika harian pakai '15 May', jika mingguan pakai 'Minggu 20'
        $label = $type === 'daily' 
                 ? date('d M', strtotime($item['report_date'])) 
                 : "Minggu " . $item['report_week'];
        
        return [
            'x' => $label,
            'y' => (float)$item['total_sales']
        ];
    }, array_reverse($reports)); // Dibalik (array_reverse) agar urutan di grafik dari tanggal lama ke baru

    // Mengembalikan hasil dalam format JSON
    echo json_encode([
        'status' => 'success',
        'type' => $type,
        'data' => $reports,
        'chartData' => $chartData
    ]);

} catch (Exception $e) {
    // Menangani error dan mengirimkan pesan kesalahan
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch report: ' . $e->getMessage()
    ]);
}
?>
