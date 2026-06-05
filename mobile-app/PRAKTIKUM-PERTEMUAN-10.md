# Panduan Pembuatan Aplikasi Daftar Produk (React Native)

Panduan ini disusun untuk membantu mahasiswa membangun aplikasi mobile CRUD (Create, Read, Update) sederhana menggunakan React Native dan Expo.

---

## 2. Persiapan Backend API (Server PHP)
Sebelum masuk ke aplikasi mobile, pastikan server backend Anda sudah siap di folder `api-project` (HTDOCS).

### A. Struktur Folder Backend
Pastikan struktur folder Anda seperti ini:
*   `api-project/`
    *   `api/` -> Berisi `products.php`
    *   `config/` -> Berisi `database.php`
    *   `uploads/` -> Folder untuk menyimpan gambar (Berikan izin akses *write*)

### B. Konfigurasi Database (`config/database.php`)
File ini digunakan untuk menghubungkan PHP ke database MySQL Anda:
```php
<?php
$host = "localhost";
$db_name = "nama_database_anda";
$username = "root";
$password = "";
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
} catch (PDOException $exception) {
    echo "Connection error: " . $exception->getMessage();
}
?>
```

### C. File API Produk (`api/products.php`)
Ini adalah file utama yang melayani permintaan dari aplikasi mobile. Salin kode berikut ke dalam file `api/products.php`:

```php
<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
        } else {
            $stmt = $pdo->query("SELECT * FROM products");
            echo json_encode($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = array_merge($_POST, (array)json_decode(file_get_contents("php://input"), true));
        $id = $data['id'] ?? null;
        $imageUrl = $data['image_url'] ?? null;

        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = '../uploads/products/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            $fileName = uniqid() . '_' . basename($_FILES['image']['name']);
            if (move_uploaded_file($_FILES['image']['tmp_name'], $uploadDir . $fileName)) {
                $imageUrl = 'uploads/products/' . $fileName;
            }
        }

        if (!empty($data['name'])) {
            if ($id) {
                // UPDATE
                $sql = "UPDATE products SET name=?, price=?, stock=?, category_id=?, sku=?";
                $params = [$data['name'], $data['price'], $data['stock'], $data['category_id'], $data['sku']];
                if ($imageUrl) { $sql .= ", image_url=?"; $params[] = $imageUrl; }
                $sql .= " WHERE id=?"; $params[] = $id;
                $pdo->prepare($sql)->execute($params);
                echo json_encode(["message" => "Updated successfully"]);
            } else {
                // INSERT
                $stmt = $pdo->prepare("INSERT INTO products (name, price, stock, category_id, sku, image_url) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$data['name'], $data['price'], $data['stock'], $data['category_id'], $data['sku'], $imageUrl]);
                echo json_encode(["message" => "Created successfully"]);
            }
        }
        break;
}
?>
```

---

## 3. Inisialisasi Project Mobile (PENTING!)
Agar struktur folder sesuai dengan yang dipelajari (menggunakan `App.js` dan bukan *File-based Routing* terbaru), gunakan perintah berikut:

```bash
npx create-expo-app@latest nama-project --template blank
cd nama-project
```

### Instalasi Library (Terminal)
Jalankan perintah ini di folder project Anda:
```bash
# Instal Axios untuk koneksi API
npm install axios

# Instal React Navigation
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Instal Expo Image Picker untuk Galeri
npx expo install expo-image-picker
```

---

## 2. Struktur Folder
Buatlah folder berikut di dalam project Anda:
*   `/api`
*   `/screens`

---

## 3. Penulisan Script (Coding)

### Langkah 1: Konfigurasi API (`api/config.js`)
Buat file `api/config.js` untuk mengatur alamat server:
```javascript
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
    // Pastikan IP ini sesuai dengan alamat IP server/backend Anda (Cek pakai hostname -I atau ipconfig)
    baseURL: 'http://10.25.210.16/api',
    
    // headers mengatur informasi tambahan yang dikirim bersama setiap request
    headers: {
        // Memberi tahu server bahwa format data yang kita kirim adalah JSON
        'Content-Type': 'application/json',
        // Jika menggunakan VirtualHost (Ubuntu/Linux), tambahkan header Host:
        'Host': 'api-project.local',
    },
});

/*
 * Mengekspor apiClient agar bisa digunakan (di-import) oleh file-file lain
 * di dalam aplikasi kita (seperti file komponen atau file pemanggil API lainnya)
 */
export default apiClient;
```

### Langkah 2: Halaman List Produk (`screens/ProductListScreen.js`)
Halaman ini untuk menampilkan semua produk dari database.
```javascript
/*
 * Mengimpor React dan hooks yang dibutuhkan (useState, useEffect)
 * useState: untuk menyimpan data lokal di dalam komponen
 * useEffect: untuk menjalankan fungsi saat komponen dimuat atau state berubah
 */
import React, { useState, useEffect } from 'react';

/*
 * Mengimpor komponen-komponen dasar UI dari React Native
 */
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';

/*
 * Mengimpor konfigurasi axios yang sudah kita buat untuk melakukan pemanggilan API
 */
import apiClient from '../api/config';

const BASE_URL = 'http://10.25.210.16/'; // Sesuaikan dengan folder root project di HTDOCS

/*
 * Komponen utama layar daftar produk
 * Menerima props 'navigation' untuk berpindah ke layar lain
 */
const ProductListScreen = ({ navigation }) => {
    // Menyimpan daftar produk yang sedang ditampilkan
    const [products, setProducts] = useState([]);
    
    // Menyimpan kata kunci pencarian yang diketik user
    const [search, setSearch] = useState('');
    
    // Menyimpan data seluruh produk asli dari server sebagai acuan saat pencarian
    const [fullProductList, setFullProductList] = useState([]);

    /*
     * useEffect ini akan otomatis terpanggil setiap kali layar ini dibuka/difokuskan.
     * Ini memastikan kita selalu mendapatkan data terbaru.
     */
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProducts();
        });

        return unsubscribe;
    }, [navigation]);

    /*
     * Fungsi asinkron untuk mengambil data produk dari server menggunakan API
     */
    const fetchProducts = async () => {
        try {
            const response = await apiClient.get('/products.php');
            setProducts(response.data);
            setFullProductList(response.data);
        } catch (error) {
            console.log('Error fetch:', error);
        }
    };

    /*
     * useEffect ini bereaksi setiap kali nilai 'search' berubah (user mengetik sesuatu).
     * Fungsinya untuk menyaring (filter) daftar produk sesuai nama yang dicari.
     */
    useEffect(() => {
        if (search === '') {
            // Jika kosong, kembalikan ke daftar produk awal
            setProducts(fullProductList);
        } else {
            const filtered = fullProductList.filter(item =>
                item.name.toLowerCase().includes(search.toLowerCase())
            );
            setProducts(filtered);
        }
    }, [search]);

    /*
     * renderItem berfungsi menentukan desain/tampilan dari setiap item produk 
     * di dalam daftar (FlatList)
     */
    const renderItem = ({ item }) => {
        // Menentukan URL gambar produk. Jika tidak ada, pakai gambar placeholder.
        const imageUri = item.image_url
            ? `${BASE_URL}${item.image_url}`
            : 'https://via.placeholder.com/80';

        console.log(`Image URI for ${item.name}:`, imageUri);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() =>
                    navigation.navigate('AddEditProduct', { productId: item.id })
                }
            >
                <Image
                    source={{ 
                        uri: imageUri,
                        // Jika server menggunakan VirtualHost, tambahkan header Host di sini juga:
                        headers: { 'Host': 'api-project.local' }
                    }}
                    style={styles.image}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text>Kategori: {item.category_name || '-'}</Text>
                    <Text>Harga: Rp {item.price}</Text>
                    <Text>Stok: {item.stock}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    /*
     * Tampilan (UI) utama untuk layar ini dikembalikan (return) di bawah sini
     */
    return (
        <View style={styles.container}>
            {/* Input untuk mencari produk */}
            <TextInput
                placeholder="Cari produk..."
                value={search}
                onChangeText={setSearch}
                style={styles.search}
            />

            {/* FlatList digunakan untuk menampilkan daftar data panjang secara efisien */}
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
            />

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('AddEditProduct')}
            >
                <Text style={styles.buttonText}>+ Tambah Produk</Text>
            </TouchableOpacity>
        </View>
    );
};

export default ProductListScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    search: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    card: {
        flexDirection: 'row',
        marginBottom: 10,
        padding: 10,
        borderWidth: 1,
        borderRadius: 10,
    },
    image: { width: 80, height: 80, borderRadius: 8 },
    info: { marginLeft: 10, flex: 1 },
    name: { fontWeight: 'bold', fontSize: 16 },
    button: {
        backgroundColor: 'blue',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
        marginBottom: 40,
    },
    buttonText: { color: '#fff', textAlign: 'center' },
});
```

### Langkah 3: Halaman Form Tambah/Edit (`screens/AddEditProductScreen.js`)
Halaman ini digunakan untuk menambah produk baru atau mengedit produk yang sudah ada.
```javascript
/*
 * Mengimpor React dan hooks untuk mengelola state dan siklus hidup komponen
 */
import React, { useState, useEffect } from 'react';

/*
 * Mengimpor komponen UI dasar dari React Native untuk menyusun tampilan form
 */
import {
    View,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    Image,
} from 'react-native';

/*
 * Mengimpor ImagePicker, modul dari Expo yang berfungsi 
 * untuk mengakses galeri foto di HP pengguna
 */
import * as ImagePicker from 'expo-image-picker';

/*
 * Mengimpor konfigurasi axios yang digunakan untuk mengirim data ke server
 */
import apiClient from '../api/config';

/*
 * Komponen layar untuk menambah produk baru atau mengedit produk yang sudah ada.
 * Props 'route' dipakai untuk menerima data yang dilempar dari layar sebelumnya (contohnya ID Produk).
 * Props 'navigation' dipakai untuk kembali atau berpindah ke layar lain.
 */
const AddEditProductScreen = ({ route, navigation }) => {
    /*
     * Membuat state 'product' berupa objek yang menyimpan data-data dari inputan form
     */
    const [product, setProduct] = useState({
        name: '',
        price: '',
        stock: '',
        category_id: '',
        sku: '',
    });

    // Menyimpan URL sementara (URI) gambar baru yang dipilih dari galeri perangkat
    const [imageUri, setImageUri] = useState(null);
    
    // Menyimpan URL gambar asli dari server saat kita sedang dalam mode edit (gambar lama)
    const [existingImageUrl, setExistingImageUrl] = useState(null);

    /*
     * useEffect ini berjalan saat komponen pertama kali dirender.
     * Kita cek apakah ada 'productId' di dalam parameter (route.params).
     * Jika ada, berarti kita masuk ke mode EDIT, jadi panggil data detail produk tersebut.
     */
    useEffect(() => {
        if (route.params?.productId) {
            fetchProductDetail();
        }
    }, []);

    /*
     * Fungsi asinkron untuk mengambil data spesifik 1 produk dari API
     */
    const fetchProductDetail = async () => {
        try {
            // Kita asumsikan endpoint-nya adalah /products.php?id=XX
            const response = await apiClient.get(`/products.php?id=${route.params.productId}`);
            const data = response.data;

            // Jika data ditemukan (biasanya berupa object)
            if (data) {
                setProduct({
                    name: data.name || '',
                    price: data.price ? data.price.toString() : '',
                    stock: data.stock ? data.stock.toString() : '',
                    category_id: data.category_id ? data.category_id.toString() : '',
                    sku: data.sku || '',
                });

                if (data.image_url) {
                    setExistingImageUrl(data.image_url);
                }
            }
        } catch (error) {
            console.log('Error Fetch Detail:', error);
            Alert.alert('Error', 'Gagal mengambil data produk');
        }
    };

    /*
     * Fungsi asinkron yang dijalankan saat user menekan tombol "Pilih Gambar"
     */
    const handleChoosePhoto = async () => {
        // Meminta izin akses galeri kepada pengguna smartphone
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Izin Ditolak", "Kamu butuh memberikan izin untuk mengakses galeri!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        console.log('ImagePicker Result:', result);

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
            console.log('Image URI set:', result.assets[0].uri);
        }
    };

    /*
     * Fungsi asinkron yang dijalankan saat user menekan tombol "Simpan".
     * Tugasnya mengirimkan data produk baru (atau data update) ke API.
     */
    const handleSave = async () => {
        // FormData wajib digunakan jika kita ingin mengupload file (seperti gambar) ke server PHP
        const formData = new FormData();

        formData.append('name', product.name);
        formData.append('price', product.price);
        formData.append('stock', product.stock);
        formData.append('category_id', product.category_id);
        formData.append('sku', product.sku);

        if (imageUri) {
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'product.jpg',
            });
        }

        try {
            if (route.params?.productId) {
                // EDIT / UPDATE
                // Kita tambahkan ID ke formData
                formData.append('id', route.params.productId);

                // Gunakan POST (PHP biasanya lebih mudah menerima file lewat POST)
                await apiClient.post('/products.php', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                // CREATE / TAMBAH BARU
                await apiClient.post('/products.php', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            Alert.alert('Sukses', 'Produk berhasil disimpan');
            navigation.goBack();
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Gagal menyimpan');
        }
    };

    /*
     * Mulai bagian ini adalah apa yang akan dirender (ditampilkan) di layar HP
     */
    return (
        <View style={styles.container}>
            {/* Input untuk nama produk */}
            <TextInput
                placeholder="Nama Produk"
                style={styles.input}
                value={product.name}
                onChangeText={text => setProduct({ ...product, name: text })}
            />

            <TextInput
                placeholder="Harga"
                style={styles.input}
                keyboardType="numeric"
                value={product.price}
                onChangeText={text => setProduct({ ...product, price: text })}
            />

            <TextInput
                placeholder="Stok"
                style={styles.input}
                keyboardType="numeric"
                value={product.stock}
                onChangeText={text => setProduct({ ...product, stock: text })}
            />

            <TextInput
                placeholder="Category ID"
                style={styles.input}
                value={product.category_id}
                onChangeText={text =>
                    setProduct({ ...product, category_id: text })
                }
            />

            <Button title="Pilih Gambar" onPress={handleChoosePhoto} />

            {imageUri ? (
                // Tampilkan gambar yang baru dipilih
                <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
                // Jika tidak ada gambar baru, tampilkan gambar lama (jika ada)
                existingImageUrl && (
                    <Image
                        source={{ 
                            uri: `http://10.25.210.16/${existingImageUrl}`,
                            // Jika server menggunakan VirtualHost, tambahkan header Host:
                            headers: { 'Host': 'api-project.local' }
                        }}
                        style={styles.image}
                    />
                )
            )}

            <Button title="Simpan" onPress={handleSave} />
        </View>
    );
};

export default AddEditProductScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    input: {
        borderWidth: 1,
        marginBottom: 10,
        padding: 10,
        borderRadius: 8,
    },
    image: {
        width: 120,
        height: 120,
        marginVertical: 10,
    },
});
```

### Langkah 4: Registrasi Halaman di `App.js`
Daftarkan halaman di file utama `App.js`:
```javascript
// Mengimpor library utama React yang dibutuhkan untuk membuat komponen UI (User Interface)
import React from 'react';

/*
 * Mengimpor NavigationContainer, sebuah komponen pembungkus (wrapper) utama 
 * yang mengelola struktur dan state navigasi aplikasi kita
 */
import { NavigationContainer } from '@react-navigation/native';

/*
 * Mengimpor fungsi untuk membuat sistem navigasi tumpuk (Stack Navigation)
 * Stack Navigation memungkinkan kita berpindah antar layar seperti menumpuk kartu
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Mengimpor komponen layar (screen) yang telah kita buat di folder 'screens'
import ProductListScreen from './screens/ProductListScreen'; // Layar untuk menampilkan daftar produk
import AddEditProductScreen from './screens/AddEditProductScreen'; // Layar untuk form tambah dan edit produk

// Membuat instance/objek Stack yang akan digunakan untuk mendefinisikan navigasi
const Stack = createNativeStackNavigator();

// Komponen App ini adalah titik awal (entry point) atau komponen utama aplikasi
export default function App() {
  return (
    // NavigationContainer harus selalu berada di tingkat terluar untuk mengelola navigasi
    <NavigationContainer>
      {/* Stack.Navigator adalah wadah untuk mendaftarkan semua layar yang kita miliki */}
      <Stack.Navigator>
        
        {/* 
            Stack.Screen mendaftarkan satu layar. 
            - name: nama unik layar (digunakan untuk berpindah ke layar ini)
            - component: komponen React yang akan dirender (ditampilkan)
            - options: pengaturan tambahan, seperti 'title' untuk teks di header atas (navbar) 
        */}
        <Stack.Screen
          name="ProductList"
          component={ProductListScreen}
          options={{ title: 'Daftar Produk' }}
        />

        {/* Layar kedua untuk menambah atau mengedit produk */}
        <Stack.Screen
          name="AddEditProduct"
          component={AddEditProductScreen}
          options={{ title: 'Tambah / Edit Produk' }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 5. Panduan Jaringan & IP Address (PENTING!)

Agar HP bisa "mengobrol" dengan server di laptop, keduanya harus berada dalam jaringan yang sama. Berikut adalah skenarionya:

### Skenario A: Laptop & HP di Wi-Fi yang Sama
Ini adalah cara yang paling disarankan.
1.  Hubungkan Laptop dan HP ke Wi-Fi yang sama (misal: Wi-Fi kampus atau rumah).
2.  Cek IP Laptop (Buka terminal, ketik `ipconfig` untuk Windows). Cari **IPv4 Address**.
3.  Masukkan IP tersebut ke file `api/config.js` dan file screen lainnya.

### Skenario B: Tethering/Hotspot dari HP ke Laptop
Gunakan cara ini jika tidak ada Wi-Fi di sekitar Anda.
1.  Aktifkan **Hotspot Pribadi** di HP Anda.
2.  Hubungkan Wi-Fi Laptop ke Hotspot HP tersebut.
3.  Cek IP Laptop (biasanya akan berubah menjadi `192.168.43.xxx` atau serupa).
4.  **Update IP** di seluruh file script Anda dengan IP baru tersebut.
5.  **Penting:** Jika Anda menggunakan VirtualHost di Apache, pastikan `ServerAlias` di konfigurasi vhost juga diupdate dengan IP baru ini.

### Skenario C: Menggunakan Emulator di Laptop
Jika Anda tidak menggunakan HP asli, melainkan Emulator (Android Studio):
1.  Gunakan IP khusus **`10.0.2.2`** sebagai pengganti `localhost` atau IP laptop.
2.  Contoh: `baseURL: 'http://10.0.2.2/api'`.

### Cara Cek IP Laptop (Windows):
1.  Tekan tombol `Windows + R`, ketik `cmd`, lalu Enter.
2.  Ketik `ipconfig` lalu Enter.
3.  Lihat pada bagian **Wireless LAN adapter Wi-Fi**, cari baris **IPv4 Address**. Contoh: `10.25.210.16`.

---

## 6. Troubleshooting
*   **Axios Network Error:** Biasanya terjadi karena IP laptop berubah atau Laptop dan HP tidak berada di Wi-Fi yang sama.
*   **VirtualHost Error:** Pastikan Anda sudah me-restart Apache (XAMPP) setelah mengubah file konfigurasi vhost.
*   **Firewall:** Kadang Firewall Windows memblokir koneksi. Jika masih error, coba matikan sementara Firewall atau izinkan port 80.
