# PRAKTIKUM PERTEMUAN 11: Transaction & Cart Management

Dokumen ini berisi panduan *step-by-step* untuk mengimplementasikan fitur **Keranjang Belanja (Shopping Cart)** dan **Transaksi (Checkout)** pada aplikasi Point of Sales (POS) berbasis React Native.

---

## Langkah 1: Setup State Management dengan Context API

Pertama, kita perlu sebuah *State Management* agar isi keranjang belanja bisa diakses oleh layar mana saja (Global State) tanpa harus melempar data (props) secara manual ke tiap komponen.

**1. Buat folder dan file baru**
Buat direktori `context` di root project Anda, lalu buat file `CartContext.js` di dalamnya. (`/context/CartContext.js`)

**2. Tuliskan kode berikut:**

```javascript
import React, { createContext, useState, useContext } from 'react';

/* 
 * 1. Membuat Context
 * Context digunakan agar kita bisa membagikan state (seperti data keranjang belanja) 
 * ke berbagai layar (komponen) tanpa harus melempar "props" secara manual satu-satu.
 */
const CartContext = createContext();

/*
 * 2. Membuat Provider
 * CartProvider adalah komponen pembungkus. Semua layar yang dibungkus oleh provider ini 
 * akan bisa mengakses data dan fungsi yang ada di dalam keranjang belanja.
 */
export const CartProvider = ({ children }) => {
    // State 'items' ini adalah array yang menyimpan daftar produk yang masuk ke keranjang
    const [items, setItems] = useState([]);

    /*
     * Fungsi untuk menambahkan produk ke dalam keranjang
     */
    const addItem = (product) => {
        // Cek dulu, apakah produk yang mau ditambahkan sudah ada di keranjang sebelumnya?
        const exist = items.find(item => item.productId === product.id);
        
        if (exist) {
            // Jika SUDAH ADA, maka kita tidak menambah baris produk baru,
            // melainkan cukup menambahkan angka "quantity" (jumlah) nya saja (+1)
            setItems(items.map(item =>
                item.productId === product.id ? { ...exist, quantity: exist.quantity + 1 } : item
            ));
        } else {
            // Jika BELUM ADA, maka kita masukkan produk tersebut sebagai item baru 
            // dengan jumlah quantity awal = 1.
            setItems([...items, {
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: 1
            }]);
        }
    };

    /*
     * Fungsi untuk menghapus satu produk dari keranjang secara penuh (berapapun quantity-nya)
     */
    const removeItem = (productId) => {
        // Filter akan menyaring/membuang produk yang ID-nya cocok dengan yang mau dihapus
        setItems(items.filter(item => item.productId !== productId));
    };

    /*
     * Fungsi untuk mengubah jumlah spesifik (quantity) dari sebuah item di keranjang
     * Biasanya digunakan oleh tombol "+" dan "-" di layar Transaksi.
     */
    const updateQuantity = (productId, quantity) => {
        // Jika angka quantity yang diubah ternyata menjadi 0 atau minus, 
        // maka sekalian saja kita hapus produk tersebut dari keranjang.
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        
        // Jika tidak 0, maka perbarui angka quantity pada item yang sesuai
        setItems(items.map(item =>
            item.productId === productId ? { ...item, quantity } : item
        ));
    };

    /*
     * Fungsi untuk menghitung total harga (Subtotal) dari seluruh barang yang ada di keranjang
     * reduce() akan menjumlahkan (Harga x Jumlah Barang) secara berulang-ulang untuk tiap item.
     */
    const getSubtotal = () => {
        return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    };

    /*
     * Fungsi untuk mengosongkan keranjang (dikosongkan kembali jadi array kosong [])
     * Sangat berguna dipanggil setelah transaksi sukses dibayar.
     */
    const clearCart = () => {
        setItems([]);
    };

    /*
     * Semua variabel (state) dan fungsi di atas kita masukkan ke dalam parameter "value"
     * agar bisa dipanggil dan digunakan oleh layar (screen) lain di dalam aplikasi kita.
     */
    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, getSubtotal, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};

/*
 * 3. Membuat Custom Hook
 * Hook `useCart` ini dibuat untuk mempersingkat pemanggilan Context.
 * Alih-alih menulis useContext(CartContext) di mana-mana, 
 * mahasiswa cukup memanggil useCart() saja.
 */
export const useCart = () => useContext(CartContext);
```

---

## Langkah 2: Membungkus Aplikasi dengan Provider

Selanjutnya, kita harus membungkus konfigurasi Navigasi utama kita dengan `CartProvider` yang baru kita buat. Hal ini memastikan seluruh *screen* berada dalam cakupan *Cart Context*.

**1. Buka file `App.js` di root project.**
**2. Lakukan modifikasi pada bagian import dan struktur `return` render:**

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProductListScreen from './screens/ProductListScreen'; 
import AddEditProductScreen from './screens/AddEditProductScreen';
// TAMBAHKAN IMPORT INI
import TransactionScreen from './screens/TransactionScreen'; 
import { CartProvider } from './context/CartContext'; 

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // BUNGKUS NAVIGATION CONTAINER DENGAN CART PROVIDER
    <CartProvider>
      <NavigationContainer>
        <Stack.Navigator>
          
          <Stack.Screen name="ProductList" component={ProductListScreen} options={{ title: 'Daftar Produk' }} />
          <Stack.Screen name="AddEditProduct" component={AddEditProductScreen} options={{ title: 'Tambah / Edit Produk' }} />
          
          {/* DAFTARKAN SCREEN TRANSAKSI BARU */}
          <Stack.Screen name="Transaction" component={TransactionScreen} options={{ title: 'Keranjang Belanja' }} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </CartProvider>
  );
}
```

---

## Langkah 3: Menyesuaikan Layar Daftar Produk (ProductListScreen)

Pada halaman ini, kita akan melakukan perubahan besar untuk mengintegrasikan fitur keranjang. Mahasiswa disarankan untuk **mengganti seluruh isi file** `screens/ProductListScreen.js` dengan kode di bawah ini agar tidak terjadi kesalahan penempatan komponen.

**Full Script `screens/ProductListScreen.js`:**

```javascript
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
} from 'react-native';

import apiClient from '../api/config';
// [BARU] Import hook useCart dari Context
import { useCart } from '../context/CartContext';

const BASE_URL = 'http://10.200.205.16/'; // Sesuaikan dengan IP Server Anda

const ProductListScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [fullProductList, setFullProductList] = useState([]);

    // [BARU] Ambil fungsi addItem dan state items dari Cart Context
    const { addItem, items } = useCart();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProducts();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchProducts = async () => {
        try {
            const response = await apiClient.get('/products.php');
            setProducts(response.data);
            setFullProductList(response.data);
        } catch (error) {
            console.log('Error fetch:', error);
        }
    };

    useEffect(() => {
        if (search === '') {
            setProducts(fullProductList);
        } else {
            const filtered = fullProductList.filter(item =>
                item.name.toLowerCase().includes(search.toLowerCase())
            );
            setProducts(filtered);
        }
    }, [search]);

    const renderItem = ({ item }) => {
        const imageUri = item.image_url
            ? `${BASE_URL}${item.image_url}`
            : 'https://via.placeholder.com/80';

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
                        headers: { 'Host': 'api-project.local' }
                    }}
                    style={styles.image}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text>Kategori: {item.category_name || '-'}</Text>
                    <Text>Harga: Rp {item.price}</Text>
                    <Text>Stok: {item.stock}</Text>
                    
                    {/* [BARU] Tombol untuk memasukkan produk ke keranjang */}
                    <TouchableOpacity 
                        style={styles.addToCartButton} 
                        onPress={() => addItem(item)}
                    >
                        <Text style={styles.addToCartText}>+ Tambah Keranjang</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* [UPDATE] Header sekarang berisi Input Pencarian DAN Tombol Keranjang 🛒 */}
            <View style={styles.headerRow}>
                <TextInput
                    placeholder="Cari produk..."
                    value={search}
                    onChangeText={setSearch}
                    style={[styles.search, { flex: 1, marginBottom: 0 }]}
                />
                <TouchableOpacity 
                    style={styles.cartButton} 
                    onPress={() => navigation.navigate('Transaction')}
                >
                    <Text style={styles.cartButtonText}>
                        🛒 ({items.reduce((sum, item) => sum + item.quantity, 0)})
                    </Text>
                </TouchableOpacity>
            </View>

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
    // [BARU] Style untuk baris header
    headerRow: { flexDirection: 'row', marginBottom: 10 },
    search: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
    },
    // [BARU] Style untuk tombol keranjang di header
    cartButton: {
        backgroundColor: '#ff9800',
        justifyContent: 'center',
        paddingHorizontal: 15,
        borderRadius: 8,
        marginLeft: 10,
    },
    cartButtonText: { color: '#fff', fontWeight: 'bold' },
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
    // [BARU] Style untuk tombol "Tambah Keranjang" di dalam list
    addToCartButton: {
        backgroundColor: '#28a745',
        padding: 8,
        borderRadius: 5,
        marginTop: 8,
    },
    addToCartText: { color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: 'bold' },
});
```

**Catatan Perubahan (Dibandingkan Pertemuan 10):**
1.  **Import `useCart`**: Kita menambahkan import hook dari context agar layar ini bisa "mengobrol" dengan state keranjang belanja global.
2.  **Pemanggilan `addItem` & `items`**: Di dalam komponen, kita memanggil `addItem` untuk fungsi tombol dan `items` untuk menghitung jumlah barang yang sudah ada di keranjang.
3.  **Header Baru (`headerRow`)**: Jika sebelumnya hanya ada input pencarian, sekarang kita bungkus dengan `View` baru agar bisa meletakkan tombol keranjang (🛒) di sebelahnya.
4.  **Tombol Tambah Keranjang**: Pada setiap item produk di dalam `FlatList`, sekarang muncul tombol hijau bertuliskan "+ Tambah Keranjang".
5.  **Penambahan Styles**: Ada beberapa style baru seperti `headerRow`, `cartButton`, dan `addToCartButton` untuk mempercantik tampilan fitur baru tersebut.

---

## Langkah 4: Membuat Layar Keranjang / Transaksi (TransactionScreen)

Langkah terakhir di frontend adalah menyajikan isi keranjang dan menembak API transaksi (*checkout*).

**1. Buat file baru bernama `TransactionScreen.js` di dalam folder `screens`.**
**2. Tuliskan implementasi UI Keranjang dan Logika API Post-nya:**

```javascript
/* 
 * Mengimpor React dan hook useState untuk manajemen state lokal (loading)
 */
import React, { useState } from 'react';

/* 
 * Mengimpor komponen UI dari React Native
 */
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, Alert } from 'react-native';

/* 
 * Mengimpor custom hook useCart yang sudah kita buat sebelumnya di CartContext.
 * Ini memungkinkan layar ini membaca isi keranjang dan menggunakan fungsi-fungsinya.
 */
import { useCart } from '../context/CartContext';

/* 
 * Mengimpor konfigurasi axios untuk melakukan HTTP Request ke backend (API)
 */
import apiClient from '../api/config';

const TransactionScreen = ({ navigation }) => {
    // Memanggil state dan fungsi dari Context Keranjang
    const { items, updateQuantity, getSubtotal, clearCart } = useCart();
    
    // State lokal untuk menandakan apakah aplikasi sedang memproses transaksi ke server
    const [isLoading, setIsLoading] = useState(false);

    /* 
     * Kalkulasi Total Harga:
     * 1. Ambil Subtotal dari keranjang
     * 2. Hitung pajak (contoh: 10% atau 0.10)
     * 3. Jumlahkan Subtotal + Pajak menjadi Total Keseluruhan
     */
    const taxRate = 0.10;
    const subtotal = getSubtotal();
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    /* 
     * Fungsi yang dijalankan saat tombol "Bayar Sekarang" ditekan
     */
    const handleCheckout = async () => {
        // Validasi: Pastikan keranjang tidak kosong sebelum checkout
        if (items.length === 0) {
            Alert.alert('Peringatan', 'Keranjang belanja kosong!');
            return;
        }

        // Aktifkan mode loading agar tombol disable dan mencegah klik ganda (double submit)
        setIsLoading(true);
        
        try {
            // Mengirim data array keranjang ('items') ke endpoint backend menggunakan metode POST
            const response = await apiClient.post('/transactions.php', items);
            
            // Jika sukses (tidak masuk blok catch), tampilkan notifikasi berhasil
            Alert.alert(
                'Sukses', 
                `Transaksi berhasil! ID: ${response.data.transactionId}\nTotal: Rp. ${response.data.total}`
            );
            
            // Kosongkan keranjang yang sudah lunas dibayar
            clearCart();
            
            // Arahkan kembali pengguna ke layar utama (Daftar Produk)
            navigation.navigate('ProductList');
            
        } catch (error) {
            // Jika terjadi kegagalan/error dari server, tampilkan pesan errornya
            Alert.alert('Error', error.response?.data?.message || 'Transaksi gagal.');
        } finally {
            // Apapun yang terjadi (sukses atau gagal), matikan kembali mode loading
            setIsLoading(false);
        }
    };

    /* 
     * Fungsi pembantu untuk merender desain (UI) setiap baris barang di dalam keranjang
     */
    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            {/* Info Nama dan Harga */}
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text>Rp {item.price}</Text>
            </View>
            
            {/* Kontrol Jumlah Barang (+ / -) */}
            <View style={styles.quantityContainer}>
                {/* Tombol Kurangi (Min) */}
                <TouchableOpacity 
                    onPress={() => updateQuantity(item.productId, item.quantity - 1)} 
                    style={styles.btnQuantity}
                >
                    <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>
                
                {/* Angka Jumlah Barang */}
                <Text style={styles.quantity}>{item.quantity}</Text>
                
                {/* Tombol Tambah (Plus) */}
                <TouchableOpacity 
                    onPress={() => updateQuantity(item.productId, item.quantity + 1)} 
                    style={styles.btnQuantity}
                >
                    <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    /* 
     * Bagian Render UI Utama Layar
     */
    return (
        <View style={styles.container}>
            {/* 
              * FlatList digunakan untuk menampilkan daftar barang di keranjang.
              * ListEmptyComponent sangat berguna untuk menampilkan teks "Keranjang Kosong" 
              * saat tidak ada barang sama sekali.
              */}
            <FlatList 
                data={items} 
                renderItem={renderItem} 
                keyExtractor={item => item.productId.toString()} 
                ListEmptyComponent={<Text style={styles.emptyText}>Keranjang kosong</Text>}
            />
            
            {/* Area Ringkasan Pembayaran (Subtotal, Pajak, Total) */}
            <View style={styles.summary}>
                <View style={styles.summaryRow}>
                    <Text>Subtotal:</Text>
                    <Text>Rp {subtotal}</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text>Pajak (10%):</Text>
                    <Text>Rp {tax}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalText}>Total:</Text>
                    <Text style={styles.totalText}>Rp {total}</Text>
                </View>
                
                {/* 
                  * Tombol Checkout: 
                  * disabled jika status sedang loading ATAU keranjang kosong
                  */}
                <Button 
                    title={isLoading ? "Memproses..." : "Bayar Sekarang"} 
                    onPress={handleCheckout} 
                    disabled={isLoading || items.length === 0} 
                    color="#28a745"
                />
            </View>
        </View>
    );
};

export default TransactionScreen;

// Konfigurasi Stylesheet untuk desain tampilan (CSS)
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    itemContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    itemInfo: { flex: 1, justifyContent: 'center' },
    itemName: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
    quantityContainer: { flexDirection: 'row', alignItems: 'center' },
    btnQuantity: { backgroundColor: '#f0f0f0', width: 32, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
    btnText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    quantity: { marginHorizontal: 15, fontSize: 16, minWidth: 20, textAlign: 'center' },
    summary: { padding: 20, paddingBottom: 40, backgroundColor: '#f8f9fa', borderTopWidth: 1, borderTopColor: '#e9ecef' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    totalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#dee2e6', marginBottom: 20 },
    totalText: { fontWeight: 'bold', fontSize: 18 },
    emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#6c757d' }
});
```

---

Setelah mengimplementasikan 4 langkah di atas, fitur Keranjang Belanja sudah terintegrasi dari sisi antarmuka/aplikasi!

---

## Langkah 5: Penyesuaian Skema Database (Backend API)

Agar data transaksi bisa tersimpan dengan baik, kita perlu menambahkan 2 tabel baru di database, yaitu `transactions` (untuk data master/total transaksi) dan `transaction_items` (untuk rincian produk yang dibeli per transaksi).

**1. Buka file `/api-project/database.sql` dan tambahkan kode berikut ke bagian paling bawah:**

```sql
-- transactions
CREATE TABLE IF NOT EXISTS `transactions` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `total_amount` decimal(10,2) NOT NULL,
    `tax_amount` decimal(10,2) NOT NULL,
    `final_amount` decimal(10,2) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- transaction_items
CREATE TABLE IF NOT EXISTS `transaction_items` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `transaction_id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `product_name` varchar(255) NOT NULL,
    `quantity` int(11) NOT NULL,
    `price_at_time` decimal(10,2) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```
*(Catatan: Jangan lupa untuk menjalankan ulang skrip `database.sql` ini ke database MySQL Anda agar tabelnya benar-benar terbuat.)*

---

## Langkah 6: Persiapan Folder Receipts & Library TCPDF (Backend API)

Agar server bisa menghasilkan file PDF dan menyimpannya, kita perlu menyiapkan folder khusus dan menginstall library PDF generator (TCPDF).

**1. Membuat folder `receipts`**
Buat folder bernama `receipts` di dalam root project API Anda (`/api-project/receipts`). Pastikan folder ini memiliki izin akses *writable* (bisa ditulisi file oleh web server).

**2. Menginstall library TCPDF**
Gunakan Composer untuk menginstall library TCPDF. Jalankan perintah berikut di terminal pada direktori `/api-project/`:
```bash
composer require tecnickcom/tcpdf
```
*(Library ini akan otomatis terdaftar di file `composer.json` dan folder `vendor/` akan tercipta.)*

---

## Langkah 7: Membuat Script Generate Receipt (Backend API)

Kita akan membuat fungsi khusus yang bertugas menyusun desain struk dalam format HTML, lalu mengubahnya menjadi file PDF.

**1. Buat file baru bernama `generate_receipt.php` di dalam folder `/api-project/api/`.**
**2. Salin dan tempelkan *script* berikut:**

```php
<?php
/**
 * File: generate_receipt.php
 * Deskripsi: Handler untuk membuat struk bukti transaksi menggunakan TCPDF.
 */

require_once '../config/database.php';
// Penting: require transactions.php untuk mendapatkan fungsi helper data transaksi
require_once 'transactions.php';

// Load TCPDF via Composer Autoload
if (file_exists('../vendor/autoload.php')) {
    require_once '../vendor/autoload.php';
}

/**
 * Fungsi untuk men-generate file PDF struk dan menyimpannya ke direktori receipts
 * @param PDO $pdo Koneksi database
 * @param int $id ID Transaksi
 * @return string|bool Nama file jika berhasil, false jika gagal
 */
function generateReceiptFile($pdo, $id)
{
    // Ambil data transaksi lengkap dari database
    $data = getTransactionData($pdo, $id);
    if (!$data) return false;

    $transaction = $data['transaction'];
    $items = $data['items'];

    // 1. Inisialisasi TCPDF (Ukuran Kertas Struk: 80mm x 200mm)
    $pdf = new TCPDF('P', 'mm', array(80, 200), true, 'UTF-8', false);
    $pdf->SetCreator('Horizon API');
    $pdf->SetTitle('Struk Transaksi #' . $id);
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->SetMargins(5, 5, 5);
    $pdf->SetAutoPageBreak(TRUE, 5);
    $pdf->AddPage();

    // 2. Desain Struk dalam format HTML
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

    // 3. Render HTML ke PDF
    $pdf->writeHTML($html, true, false, true, false, '');

    // 4. Tentukan path penyimpanan
    $dir = dirname(__DIR__) . '/receipts/';
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    $filename = 'struk_' . $id . '_' . time() . '.pdf';
    $filepath = $dir . $filename;

    // 5. Simpan file ke server ('F' = File)
    $pdf->Output($filepath, 'F');

    return $filename;
}
?>
```

---

## Langkah 8: Membuat Endpoint API Checkout (Backend API)

Langkah terakhir secara keseluruhan adalah membuat/memperbarui endpoint API (file PHP) yang akan bertugas menerima request checkout, memvalidasi stok, menyimpan ke DB, dan **memanggil fungsi cetak struk PDF**.

**1. Buka/Buat file `transactions.php` di dalam folder `/api-project/api/`.**
**2. Gunakan kode berikut (Perhatikan pemanggilan `generateReceiptFile` di akhir):**

```php
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200); exit();
}

if ($_SERVER["REQUEST_METHOD"] != 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']); exit();
}

require_once '../config/database.php';
$pdo->beginTransaction();

try {
    $cart = json_decode(file_get_contents("php://input"), true);
    if (!$cart || empty($cart)) throw new Exception("Keranjang kosong.");

    $taxRate = 0.10;
    $subtotal = 0;

    // 1. Validasi stok dan hitung subtotal
    foreach ($cart as $item) {
        $stmt = $pdo->prepare("SELECT stock, price FROM products WHERE id = ?");
        $stmt->execute([$item['productId']]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product || $product['stock'] < $item['quantity']) {
            throw new Exception("Stok tidak mencukupi untuk ID: " . $item['productId']);
        }
        $subtotal += $product['price'] * $item['quantity'];
    }

    $taxAmount = $subtotal * $taxRate;
    $finalAmount = $subtotal + $taxAmount;

    // 2. Simpan master transaksi
    $stmt = $pdo->prepare("INSERT INTO transactions (total_amount, tax_amount, final_amount) VALUES (?, ?, ?)");
    $stmt->execute([$subtotal, $taxAmount, $finalAmount]);
    $transactionId = $pdo->lastInsertId();

    // 3. Simpan rincian & potong stok
    foreach ($cart as $item) {
        $stmt = $pdo->prepare("SELECT name, price FROM products WHERE id = ?");
        $stmt->execute([$item['productId']]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $pdo->prepare("INSERT INTO transaction_items (transaction_id, product_id, product_name, quantity, price_at_time) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$transactionId, $item['productId'], $p['name'], $item['quantity'], $p['price']]);

        $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
        $stmt->execute([$item['quantity'], $item['productId']]);
    }

    $pdo->commit();

    // --- PROSES GENERATE STRUK PDF ---
    require_once 'generate_receipt.php';
    $receiptFile = generateReceiptFile($pdo, $transactionId);
    // --------------------------------

    http_response_code(201);
    echo json_encode([
        'message' => 'Transaksi berhasil.',
        'transactionId' => $transactionId,
        'total' => $finalAmount,
        'receipt' => $receiptFile // Mengembalikan nama file struk
    ]);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['message' => 'Transaksi gagal: ' . $e->getMessage()]);
}

/**
 * Helper: Ambil data transaksi lengkap (digunakan oleh generate_receipt.php)
 */
function getTransactionData($pdo, $transactionId) {
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
    $stmt->execute([$transactionId]);
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$transaction) return null;

    $stmt = $pdo->prepare("SELECT * FROM transaction_items WHERE transaction_id = ?");
    $stmt->execute([$transactionId]);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    return ['transaction' => $transaction, 'items' => $items];
}
?>
```

---

**Selamat!** Sekarang aplikasi POS Anda sudah lengkap dengan fitur **Cetak Struk PDF** otomatis setiap kali transaksi berhasil dilakukan. File struk akan tersimpan di folder `receipts` pada server.
