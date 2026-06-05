# Panduan Konfigurasi Jaringan (Pindah WiFi)

Jika Anda berpindah jaringan internet (WiFi), alamat IP server Anda kemungkinan besar akan berubah. Hal ini akan menyebabkan aplikasi mobile tidak bisa terhubung (Error 404 atau Connection Timeout).

Berikut adalah langkah-langkah untuk menyesuaikan aplikasi dengan IP baru:

## 1. Cari Tahu Alamat IP Baru Server
Buka terminal di server (Laptop/PC Anda) dan jalankan perintah:
```bash
hostname -I
```
Atau jika di Windows:
```cmd
ipconfig
```
Cari bagian **IPv4 Address** (Contoh: `192.168.1.XX`).

---

## 2. Update Alamat IP di Aplikasi Mobile

Ada 3 file utama yang perlu diperbarui jika IP berubah:

### A. File `api/config.js`
Ubah bagian `baseURL` sesuai IP baru. Jangan hapus header `Host`.
```javascript
baseURL: 'http://ALAMAT_IP_BARU/api',
headers: {
    'Content-Type': 'application/json',
    'Host': 'api-project.local', 
},
```

### B. File `screens/ProductListScreen.js`
Ubah variabel `BASE_URL` di bagian atas file:
```javascript
const BASE_URL = 'http://ALAMAT_IP_BARU/';
```
Dan pastikan komponen `Image` tetap mengirimkan header `Host`:
```javascript
<Image source={{ uri: ..., headers: { 'Host': 'api-project.local' } }} />
```

### C. File `screens/AddEditProductScreen.js`
Ubah URL gambar pada bagian render (sekitar baris 213):
```javascript
uri: `http://ALAMAT_IP_BARU/${existingImageUrl}`,
headers: { 'Host': 'api-project.local' }
```

---

## Khusus Pengguna Windows & XAMPP (Tanpa VirtualHost)

Jika Anda menggunakan XAMPP di Windows dan menaruh folder API di `htdocs/api-project`, maka konfigurasinya sedikit berbeda karena Anda tidak menggunakan sistem VirtualHost (`api-project.local`).

### 1. File `api/config.js`
Gunakan path lengkap folder Anda dan **HAPUS** header `Host`:
```javascript
baseURL: 'http://ALAMAT_IP_BARU/api-project/api', // Tambahkan /api-project
headers: {
    'Content-Type': 'application/json',
    // 'Host': 'api-project.local', // HAPUS ATAU COMMENT BAGIAN INI
},
```

### 2. File `screens/ProductListScreen.js`
Sesuaikan `BASE_URL` dan hapus header pada komponen `Image`:
```javascript
const BASE_URL = 'http://ALAMAT_IP_BARU/api-project/'; 

// Pada bagian renderItem:
<Image 
    source={{ uri: imageUri }} // HAPUS BAGIAN headers
    style={styles.image} 
/>
```

### 3. File `screens/AddEditProductScreen.js`
Sesuaikan URL gambar dan hapus header:
```javascript
<Image
    source={{ uri: `http://ALAMAT_IP_BARU/api-project/${existingImageUrl}` }}
    style={styles.image}
/>
```

---

## 3. Pastikan Koneksi Perangkat
1. **Satu Jaringan**: Pastikan Smartphone (HP) dan Laptop/PC Anda terhubung ke **WiFi yang sama**.
2. **Ping Test**: Jika masih gagal, coba lakukan *ping* dari laptop ke IP HP (atau sebaliknya) untuk memastikan komunikasi tidak diblokir oleh Firewall/Antivirus.
3. **Apache Running**: Pastikan web server Apache (XAMPP/Laragon/Native) dalam status **Running**.

---

> [!TIP]
> **Tips Pro**: Di masa depan, Anda bisa memindahkan variabel IP ke satu file konstanta (misal: `api/constants.js`) agar Anda hanya perlu mengubah IP di satu tempat saja untuk seluruh aplikasi.
