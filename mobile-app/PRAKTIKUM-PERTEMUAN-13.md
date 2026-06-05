# Praktikum Pertemuan 13: Project E-commerce – Product Catalog

Dokumen ini berisi panduan dan catatan implementasi untuk Pertemuan 13 dari mata kuliah Mobile Programming 2. Kita akan membangun pondasi katalog produk e-commerce.

## Tahap 1: Pembaruan Skema Database (Database Schema Update)

Pada tahap ini, kita memperbarui database untuk mendukung fitur e-commerce yang lebih kompleks seperti rating, multiple images, ulasan (reviews), dan daftar keinginan (wishlist).

### 1. Eksekusi Query SQL melalui phpMyAdmin

Buka **XAMPP Control Panel**, pastikan modul **Apache** dan **MySQL** dalam keadaan **Start**. Kemudian, buka browser dan akses `http://localhost/phpmyadmin`.

Pilih database `tester` (atau database proyek Anda) di panel sebelah kiri, klik tab **SQL** di menu atas, lalu *copy-paste* dan jalankan script SQL berikut (klik tombol **Go** di kanan bawah) untuk
memperbarui struktur tabel:

```sql
-- Tambahan untuk Modul 13 (E-commerce)

-- 1. Tambah kolom rating dan num_reviews pada tabel products (menggunakan pendekatan pembuatan ulang/alter)
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `rating` DECIMAL (3,2) DEFAULT 0.00;
ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `num_reviews` INT DEFAULT 0;

-- 2. Tabel users (Dibutuhkan untuk sistem wishlist dan review)
CREATE TABLE IF NOT EXISTS `users`
(
   `id`       int(11)      NOT NULL AUTO_INCREMENT,
   `username` varchar(50)  NOT NULL,
   `password` varchar(255) NOT NULL,
   `email`    varchar(100) NOT NULL,
   PRIMARY KEY (`id`)
   ) ENGINE = InnoDB
   DEFAULT CHARSET = utf8mb4;

-- 3. Tabel product_images
CREATE TABLE IF NOT EXISTS `product_images`
(
   `id` int(11)      NOT NULL AUTO_INCREMENT,
   `product_id` int(11)      NOT NULL,
   `image_url`  varchar(255) NOT NULL,
   PRIMARY KEY(`id`),
   FOREIGN KEY(`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
   ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 4. Tabel reviews
CREATE TABLE IF NOT EXISTS `reviews`
(
   `id`         int(11)   NOT NULL AUTO_INCREMENT,
   `product_id` int(11)   NOT NULL,
   `user_id`    int(11)   NOT NULL,
   `rating`     int(1)    NOT NULL,
   `comment`    text,
   `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
   PRIMARY KEY (`id`),
   FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
   FOREIGN KEY(`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
   ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 5. Tabel wishlist
CREATE TABLE IF NOT EXISTS `wishlist`
(
   `user_id` int(11) NOT NULL,
   `product_id` int(11) NOT NULL,
   PRIMARY KEY(`user_id`,`product_id`),
   FOREIGN KEY(`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
   FOREIGN KEY(`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
   ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
```

*(Bagi pengguna XAMPP di Windows, cukup jalankan query di atas via phpMyAdmin dan pastikan muncul indikator sukses berwarna hijau. Anda juga dapat menyimpan query ini ke dalam file `database.sql` di
folder proyek backend Anda sebagai cadangan).*

*Selanjutnya kita akan mengimplementasikan API Backend...*

## Tahap 2: Pengembangan Backend API (Katalog Produk)

Pada tahap ini, kita memodifikasi file `api/products.php` untuk mendukung pagination, pencarian (search), dan penyaringan (filter) harga atau kategori.

### 1. Modifikasi `api/products.php`

Ubah blok kode yang menangani `GET` request (saat meminta semua produk) menjadi seperti berikut ini:

```php
// Get all products with pagination, search, and filter (Modul 13)
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
$minPrice = isset($_GET['min_price']) ? (float)$_GET['min_price'] : 0;
$maxPrice = isset($_GET['max_price']) ? (float)$_GET['max_price'] : 999999999;
$offset = ($page - 1) * $limit;

$whereClauses = ["1=1"];
$params = [];

if (!empty($search)) {
    $whereClauses[] = "p.name LIKE :search";
    $params[':search'] = "%$search%";
}
if ($categoryId) {
    $whereClauses[] = "p.category_id = :category_id";
    $params[':category_id'] = $categoryId;
}

$whereClauses[] = "p.price BETWEEN :min_price AND :max_price";
$params[':min_price'] = $minPrice;
$params[':max_price'] = $maxPrice;

$sqlWhere = implode(" AND ", $whereClauses);

$query = "SELECT p.*, c.name as category_name 
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE {$sqlWhere}
          ORDER BY p.id DESC
          LIMIT :limit OFFSET :offset";

$stmt = $pdo->prepare($query);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->execute();
$products = $stmt->fetchAll();

// Menghitung metadata pagination
$countQuery = "SELECT COUNT(*) as total FROM products p WHERE {$sqlWhere}";
$countStmt = $pdo->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$totalProducts = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
$totalPages = ceil($totalProducts / $limit);

echo json_encode([
    'data' => $products,
    'pagination' => [
        'currentPage' => $page,
        'totalPages' => $totalPages,
        'totalProducts' => $totalProducts
    ]
]);
```

> **Catatan:**
> - **Pagination:** Sangat penting untuk menghindari loading data yang terlalu berat saat jumlah produk mencapai ribuan. Kita menggunakan parameter `LIMIT` dan `OFFSET` di MySQL.
> - **Metadata:** API ini mengembalikan `totalPages` dan `totalProducts` di dalam objek `pagination` sehingga Frontend (React Native) tahu kapan harus menghentikan efek *Infinite Scrolling*.

*Tahap berikutnya: Implementasi Mobile App Frontend...*

## Tahap 3: Pengembangan Frontend (React Native)

Pada tahap terakhir ini, kita akan membuat screen baru yang berfungsi sebagai katalog produk dengan dukungan Infinite Scrolling.

### 1. Buat Screen `ProductCatalogScreen.js`

Buat file baru di dalam direktori `screens/` dengan nama `ProductCatalogScreen.js`. Masukkan kode berikut:

```javascript
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, FlatList, TextInput, StyleSheet, ActivityIndicator} from 'react-native';
import apiClient from '../api/config';

const ProductCatalogScreen = ({navigation}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchText, setSearchText] = useState('');
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({category_id: null, min_price: 0, max_price: 1000000});

    const loadingRef = useRef(false);

    const fetchProducts = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const params = {
                page: pageNum,
                limit: 10,
                search: search,
                ...filters
            };
            const response = await apiClient.get('/products.php', {params});
            const newProducts = response.data.data;
            const pagination = response.data.pagination;

            if (isRefresh) {
                setProducts(newProducts);
            } else {
                setProducts(prevProducts => [...prevProducts, ...newProducts]);
            }
            setTotalPages(pagination.totalPages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [search, filters]);

    useEffect(() => {
        fetchProducts(1, true); // Fetch awal
    }, [fetchProducts]);

    const handleLoadMore = () => {
        if (page < totalPages && !loading) {
            fetchProducts(page + 1);
        }
    };

    const renderFooter = () => {
        return loading ? <ActivityIndicator style={{marginVertical: 20}} size="large" color="#0000ff"/> : null;
    };

    const renderItem = ({item}) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>Rp. {parseFloat(item.price).toLocaleString('id-ID')}</Text>
            <Text style={styles.itemMeta}>Kategori: {item.category_name || 'Umum'}</Text>
            <Text style={styles.itemRating}>
                Rating: {item.rating} ({item.num_reviews} ulasan)
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    placeholder="Cari produk..."
                    style={styles.searchBar}
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={() => setSearch(searchText)} // Refresh saat search
                />
            </View>

            {/* TODO: Tambahkan UI untuk filter kategori dan harga di sini */}

            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        padding: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    searchBar: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        fontSize: 16,
    },
    listContainer: {
        padding: 15,
    },
    itemContainer: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    itemPrice: {
        fontSize: 16,
        color: '#e74c3c',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    itemMeta: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    itemRating: {
        fontSize: 14,
        color: '#f39c12',
    }
});

export default ProductCatalogScreen;
```
### Modifikasi App.js menjadi seperti berikut
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
import TransactionScreen from './screens/TransactionScreen'; // Layar untuk transaksi/keranjang
import DashboardScreen from './screens/DashboardScreen'; // Layar untuk dashboard/laporan
import ProductCatalogScreen from './screens/ProductCatalogScreen'; // Layar Katalog E-commerce (Modul 13)

import CartScreen from './screens/CartScreen';
import AddressSelectionScreen from './screens/AddressSelectionScreen';
import ShippingMethodScreen from './screens/ShippingMethodScreen';

import { CartProvider } from './context/CartContext'; // Provider untuk state keranjang

// Membuat instance/objek Stack yang akan digunakan untuk mendefinisikan navigasi
const Stack = createNativeStackNavigator();

const CheckoutStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} options={{ title: 'Pilih Alamat' }} />
    <Stack.Screen name="ShippingMethod" component={ShippingMethodScreen} options={{ title: 'Metode Pengiriman' }} />
  </Stack.Navigator>
);

// Komponen App ini adalah titik awal (entry point) atau komponen utama aplikasi
export default function App() {
  return (
    // Membungkus aplikasi dengan CartProvider untuk state global keranjang belanja
    <CartProvider>
      {/* NavigationContainer harus selalu berada di tingkat terluar untuk mengelola navigasi */}
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
        {/* Layar untuk transaksi/keranjang */}
        <Stack.Screen
          name="Transaction"
          component={TransactionScreen}
          options={{ title: 'Keranjang Belanja' }}
        />
        {/* Layar untuk dashboard/laporan */}
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard Laporan' }}
        />
        {/* Layar Katalog E-commerce (Modul 13) */}
        <Stack.Screen
          name="ProductCatalog"
          component={ProductCatalogScreen}
          options={{ title: 'Katalog Produk' }}
        />
        
        {/* Layar Keranjang Belanja Persisten (Modul 14) */}
        <Stack.Screen
          name="Cart"
          component={CartScreen}
          options={{ title: 'Keranjang (Database)' }}
        />
        {/* Layar Checkout Flow (Modul 14) */}
        <Stack.Screen
          name="CheckoutStack"
          component={CheckoutStack}
          options={{ headerShown: false }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
    </CartProvider>
  );
}
```
### Konsep Penting (Diskusi)

1. **Pemisahan URL Gambar (product_images):** Dilakukan untuk memungkinkan lebih dari 1 gambar tiap produk, membuat skema dinamis (One-To-Many).
2. **Hitung totalProducts (di Backend):** Sangat penting agar UI (FrontEnd) bisa melacak posisi halaman, menghindari API request yang terus-menerus ke halaman yang kosong (`page < totalPages`).
3. **onEndReached (Infinite Scroll):** Kita mengintegrasikan fungsi `handleLoadMore` yang mengandalkan state `page`, ketika `FlatList` di-scroll mendekati bawah, dia akan meminta
   `fetchProducts(page + 1)`.
4. **useCallback & useRef:** Sangat kritikal untuk fungsi `fetchProducts` yang dipanggil dalam `useEffect`. Kita menghindari memasukkan state `loading` ke dalam dependency array `useCallback` dengan
   menggunakan `useRef` (`loadingRef`) sebagai pengunci synchronous. Jika `loading` dimasukkan ke dalam dependensi, maka setiap kali status loading berubah (true/false), `fetchProducts` akan dibuat
   ulang dan memicu kembali `useEffect` yang mengakibatkan reset data/infinite loop. Juga memisahkan state input (`searchText`) dan pencarian aktif (`search`) agar pencarian tidak menembak API pada
   setiap keystroke.
---