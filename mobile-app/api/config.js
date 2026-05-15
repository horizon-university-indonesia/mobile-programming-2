/*
 * Mengimpor axios, sebuah library populer yang digunakan untuk
 * melakukan HTTP Request (seperti mengambil data, mengirim data ke server/API)
 */
import axios from 'axios';

/*
 * Membuat dan mengkonfigurasi instance (objek) axios khusus
 * Dengan cara ini, kita tidak perlu menuliskan URL dasar atau pengaturan
 * header secara berulang-ulang di setiap panggilan API
 */
const apiClient = axios.create({
    // baseURL adalah alamat utama server API kita.
    // Pastikan IP ini sesuai dengan alamat IP server/backend Anda
    // ubuntu: hostname -I
    baseURL: 'http://10.200.205.16/api',

    // headers mengatur informasi tambahan yang dikirim bersama setiap request
    headers: {
        // Memberi tahu server bahwa format data yang kita kirim adalah JSON
        'Content-Type': 'application/json',
        'Host': 'api-project.local',
    },
});

/*
 * Mengekspor apiClient agar bisa digunakan (di-import) oleh file-file lain
 * di dalam aplikasi kita (seperti file komponen atau file pemanggil API lainnya)
 */
export default apiClient;