<?php
// Konfigurasi Database
$host = 'localhost';     // Host server database (biasanya localhost)
$dbname = 'tester';      // Nama database yang akan digunakan
$username = 'root';      // Username database
$password = 'root';      // Password database
$charset = 'utf8mb4';    // Set karakter agar mendukung simbol dan emoji

// Data Source Name (DSN) - String koneksi untuk MySQL
$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

// Opsi Konfigurasi PDO
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Mengaktifkan pelaporan error sebagai Exception
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Hasil query otomatis menjadi array asosiatif
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Menonaktifkan emulasi agar query lebih aman dari SQL Injection
];

try {
    // Membuat koneksi ke database menggunakan class PDO
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    // Jika koneksi gagal, hentikan skrip dan tampilkan pesan error
    die("ERROR: Tidak bisa terkoneksi ke database. " . $e->getMessage());
}
?>