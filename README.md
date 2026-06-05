# Pemrograman Mobile 2 - Praktikum

Repository ini berisi proyek praktikum untuk mata kuliah **Pemrograman Mobile 2** di **Faculty of Information and Computer Technology, Horizon University Indonesia**.

Proyek ini terdiri dari dua bagian utama:
1.  **api-project**: Backend API server yang dibangun menggunakan PHP.
2.  **mobile-app**: Aplikasi mobile yang dibangun menggunakan React Native dengan Expo Framework.

---

## 📂 Struktur Repositori

```text
mobile-programming-2/
├── api-project/          # Backend (PHP/API)
│   ├── api/              # Endpoint API
│   ├── config/           # Konfigurasi database
│   ├── database.sql      # Schema Database
│   └── uploads/          # Folder penyimpanan gambar/file
└── mobile-app/           # Frontend (React Native + Expo)
    ├── App.js            # Entry point aplikasi
    ├── api/              # Konfigurasi Axios & Client API
    ├── screens/          # Halaman-halaman aplikasi
    └── assets/           # Asset gambar dan icon
```

---

## 🛠️ Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan Anda telah menginstal software berikut:
- **XAMPP** (Versi terbaru dengan PHP 8.x)
- **Composer** (Untuk manajemen library PHP)
- **Node.js** (Versi LTS)
- **Git**
- **Expo Go** (Aplikasi di Play Store atau App Store)

---

## 🚀 Panduan Instalasi & Penggunaan (Windows + XAMPP)

### 1. Konfigurasi Backend (`api-project`)

1.  **Copy Proyek**:
    Salin folder `api-project` ke dalam direktori instalasi XAMPP Anda, biasanya di `C:\xampp\htdocs\`.
    > Jadi jalurnya akan menjadi: `C:\xampp\htdocs\api-project\`

2.  **Install Library PHP (Composer)**:
    Buka terminal (CMD/PowerShell) di dalam folder `C:\xampp\htdocs\api-project\` dan jalankan:
    ```bash
    composer install
    ```
    *Langkah ini wajib dilakukan untuk menginstal library **TCPDF** yang digunakan untuk cetak struk.*

3.  **Jalankan XAMPP**:
    Buka **XAMPP Control Panel** dan jalankan service **Apache** serta **MySQL**.

4.  **Persiapan Database**:
    - Buka browser dan akses [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
    - Buat database baru dengan nama `db_mobile_programming` (atau nama lain yang Anda inginkan).
    - Pilih database tersebut, lalu klik tab **Import**.
    - Pilih file `database.sql` yang ada di dalam folder `api-project`.
    - Klik **Go** atau **Import**.

5.  **Cek Alamat IP Lokal**:
    - Buka Command Prompt (CMD) dan ketik `ipconfig`.
    - Cari **IPv4 Address** (Contoh: `192.168.1.10`). Anda akan memerlukan IP ini untuk menghubungkan aplikasi mobile ke backend.

### 2. Konfigurasi Frontend (`mobile-app`)

1.  **Buka Terminal**:
    Gunakan terminal favorit Anda (CMD, PowerShell, atau VS Code Terminal) dan masuk ke folder `mobile-app`.
    ```bash
    cd mobile-app
    ```

2.  **Install Library**:
    Jalankan perintah berikut untuk menginstal semua dependensi yang diperlukan:
    ```bash
    npm install
    ```

3.  **Konfigurasi API URL**:
    Buka file `mobile-app/api/config.js` dan sesuaikan `baseURL` dengan alamat IP komputer Anda yang didapat dari langkah sebelumnya:
    ```javascript
    // Contoh perubahan pada mobile-app/api/config.js
    baseURL: 'http://192.168.1.10/api-project',
    ```
    *Pastikan format URL sesuai dengan letak folder di htdocs.*

4.  **Jalankan Aplikasi**:
    Jalankan perintah berikut untuk memulai server Expo:
    ```bash
    npx expo start
    ```

### 3. Menjalankan di Smartphone

1.  Pastikan Smartphone dan Komputer Anda terhubung ke **jaringan Wi-Fi yang sama**.
2.  Buka aplikasi **Expo Go** di Smartphone Anda.
3.  Scan **QR Code** yang muncul di terminal atau di browser (setelah menjalankan `npx expo start`).
4.  Tunggu hingga proses *building* selesai, dan aplikasi akan muncul di layar Smartphone Anda.

---

## 📚 Materi Praktikum

Berikut adalah rujukan materi praktikum yang tersedia dalam repositori ini:
- [Praktikum Pertemuan 10](mobile-app/PRAKTIKUM-PERTEMUAN-10.md) - Implementasi CRUD & List View
- [Praktikum Pertemuan 11](mobile-app/PRAKTIKUM-PERTEMUAN-11.md) - Implementasi Keranjang Belanja & PDF Receipts
- [Praktikum Pertemuan 12](mobile-app/PRAKTIKUM-PERTEMUAN-12.md) - Implementasi CRUD & List View
- [Praktikum Pertemuan 13](mobile-app/PRAKTIKUM-PERTEMUAN-13.md) - Project E-commerce – Product Catalog
- [Praktikum Pertemuan 14](mobile-app/PRAKTIKUM-PERTEMUAN-14.md) - E-commerce Cart & Checkout
- [Praktikum Pertemuan 15](mobile-app/PRAKTIKUM-PERTEMUAN-15.md) - Payment Integration & Microservices Architecture
---

## 💡 Troubleshooting

- **Gagal Terhubung ke API**: Pastikan IP Address di `config.js` sudah benar dan Firewall Windows tidak memblokir koneksi masuk ke Apache (Port 80).
- **Network Error**: Periksa kembali apakah Smartphone dan Laptop berada di satu jaringan Wi-Fi.
- **XAMPP Error**: Pastikan port 80 (Apache) dan 3306 (MySQL) tidak digunakan oleh aplikasi lain.

---
**Horizon University Indonesia**
*Faculty of Information and Computer Technology*
