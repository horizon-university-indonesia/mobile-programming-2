<?php
/**
 * File: generate_receipt.php
 * Deskripsi: Handler untuk membuat struk bukti transaksi menggunakan TCPDF.
 */

require_once '../config/database.php';
require_once 'transactions.php';

// Load TCPDF via Composer
if (file_exists('../vendor/autoload.php')) {
    require_once '../vendor/autoload.php';
}

/**
 * Fungsi untuk men-generate file PDF struk dan menyimpannya ke direktori receipts
 * @param PDO $pdo Koneksi database
 * @param int $id ID Transaksi
 * @return string|bool Path file jika berhasil, false jika gagal
 */
function generateReceiptFile($pdo, $id)
{
    $data = getTransactionData($pdo, $id);
    if (!$data)
        return false;

    $transaction = $data['transaction'];
    $items = $data['items'];

    // Inisialisasi TCPDF (80mm x 200mm)
    $pdf = new TCPDF('P', 'mm', array(80, 200), true, 'UTF-8', false);
    $pdf->SetCreator('Horizon API');
    $pdf->SetTitle('Struk Transaksi #' . $id);
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->SetMargins(5, 5, 5);
    $pdf->SetAutoPageBreak(TRUE, 5);
    $pdf->AddPage();

    // Desain Struk HTML
    $html = '
    <div style="text-align:center;">
        <h2 style="margin-bottom:0;">Horizon University Store</h2>
        <p style="font-size:8pt; margin-top:0;">Jl. Pangkal Perjuangan, Karawang</p>
    </div>
     <hr>
    <table cellspacing="0" cellpadding="2" style="font-size:9pt; width:100%;">
        <tr><td>No. Struk</td><td>: #' . $id . '</td></tr>
        <tr><td>Tanggal</td><td>: ' . date('d/m/Y H:i', strtotime($transaction['created_at'])) . '</td></tr>
    </table>
    <hr>
    <table cellspacing="0" cellpadding="2" style="font-size:9pt; width:100%;">
        <tr style="font-weight:bold;">
            <th style="width:45%;">Item</th>
            <th style="width:15%; text-align:center;">Qty</th>
            <th style="width:40%; text-align:right;">Total</th>
        </tr>';

    foreach ($items as $item) {
        $itemTotal = $item['quantity'] * $item['price_at_time'];
        $html .= '
        <tr>
            <td>' . $item['product_name'] . '</td>
            <td style="text-align:center;">' . $item['quantity'] . '</td>
            <td style="text-align:right;">' . number_format($itemTotal, 0, ',', '.') . '</td>
        </tr>';
    }

    $html .= '
    </table>
    <hr>
    <table cellspacing="0" cellpadding="2" style="font-size:9pt; width:100%;">
        <tr>
            <td style="width:60%; text-align:right;">Subtotal:</td>
            <td style="width:40%; text-align:right;">' . number_format($transaction['total_amount'], 0, ',', '.') . '</td>
        </tr>
        <tr>
            <td style="text-align:right;">Pajak (10%):</td>
            <td style="text-align:right;">' . number_format($transaction['tax_amount'], 0, ',', '.') . '</td>
        </tr>
        <tr style="font-weight:bold; font-size:10pt;">
            <td style="text-align:right;">TOTAL:</td>
            <td style="text-align:right;">Rp ' . number_format($transaction['final_amount'], 0, ',', '.') . '</td>
        </tr>
    </table>
    <hr>
    <div style="text-align:center; margin-top:15px; font-size:8pt;">
        <p>Terima Kasih Telah Berbelanja!</p>
    </div>';
    $pdf->writeHTML($html, true, false, true, false, '');

    // Tentukan path penyimpanan (absolute path untuk TCPDF)
    $dir = dirname(__DIR__) . '/receipts/';
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    $filename = 'struk_' . $id . '_' . time() . '.pdf';
    $filepath = $dir . $filename;

    // Simpan file ke server ('F' = File)
    $pdf->Output($filepath, 'F');

    return $filename;
}

// Logic untuk membolehkan akses via GET jika dipanggil langsung
if (basename($_SERVER['PHP_SELF']) == 'generate_receipt.php' && isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $file = generateReceiptFile($pdo, $id);
    if ($file) {
        echo "Struk berhasil dibuat: <a href='../receipts/$file'>$file</a>";
    } else {
        echo "Gagal membuat struk.";
    }
}
