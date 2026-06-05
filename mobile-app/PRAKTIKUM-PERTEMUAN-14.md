# Praktikum Pertemuan 14: E-commerce Cart & Checkout

Dokumen ini berisi panduan dan catatan implementasi untuk Pertemuan 14 dari mata kuliah Mobile Programming 2. Pada praktikum kali ini, kita akan membangun sistem keranjang belanja persisten (tersimpan di database) dan merancang alur *checkout* yang bertahap (multi-step).

## Tahap 1: Pembaruan Skema Database (Database Schema Update)

Pada tahap ini, kita perlu menyiapkan tabel untuk menampung item keranjang belanja setiap pengguna dan alamat pengiriman mereka.

### 1. Eksekusi Query SQL melalui phpMyAdmin
Buka **XAMPP Control Panel**, pastikan modul **Apache** dan **MySQL** dalam keadaan **Start**. Kemudian, buka browser dan akses `http://localhost/phpmyadmin`.

Pilih database `tester` (atau database proyek Anda) di panel sebelah kiri, klik tab **SQL** di menu atas, lalu *copy-paste* dan jalankan script SQL berikut (klik tombol **Go** di kanan bawah) untuk memperbarui struktur tabel:

```sql
-- Tambahan untuk Modul 14 (Cart & Checkout)

-- 1. Tabel carts (junction table)
CREATE TABLE IF NOT EXISTS `carts` (
    `user_id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `quantity` int(11) NOT NULL DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`user_id`, `product_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabel user_addresses
CREATE TABLE IF NOT EXISTS `user_addresses` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `label` varchar(50) NOT NULL,
    `recipient_name` varchar(100) NOT NULL,
    `phone` varchar(20) NOT NULL,
    `full_address` text NOT NULL,
    `city` varchar(100) NOT NULL,
    `postal_code` varchar(10) NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Tahap 2: Pengembangan API Backend (PHP)

Pada tahap ini, kita membuat layanan *endpoint* untuk mengakses database yang baru saja dibuat.

### 1. Membuat File `api/cart.php`
File ini bertugas mengurus *Create, Read, Update, Delete* (CRUD) untuk keranjang belanja. Buat file baru bernama `cart.php` di dalam folder `api` pada backend *project*, dan ketik kode berikut:

```php
<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, User-Id");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fallback user ID untuk testing
$userId = 2; // pastikan user ID ada di table "users"

$requestMethod = $_SERVER["REQUEST_METHOD"];

switch ($requestMethod) {
    case 'GET':
        $query = "SELECT p.id as product_id, p.name, p.price, p.image_url, c.quantity
                  FROM carts c
                  JOIN products p ON c.product_id = p.id
                  WHERE c.user_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$userId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        $productId = $data['product_id'] ?? null;
        $quantity = $data['quantity'] ?? 1;

        if (!$productId) {
            http_response_code(400);
            echo json_encode(['message' => 'Product ID is required']);
            break;
        }

        $checkQuery = "SELECT quantity FROM carts WHERE user_id = ? AND product_id = ?";
        $checkStmt = $pdo->prepare($checkQuery);
        $checkStmt->execute([$userId, $productId]);
        $existingItem = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existingItem) {
            $newQuantity = $existingItem['quantity'] + $quantity;
            $updateQuery = "UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->execute([$newQuantity, $userId, $productId]);
        } else {
            $insertQuery = "INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)";
            $insertStmt = $pdo->prepare($insertQuery);
            $insertStmt->execute([$userId, $productId, $quantity]);
        }
        
        http_response_code(201);
        echo json_encode(['message' => 'Item added to cart.']);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        $productId = $data['product_id'] ?? null;
        $quantity = $data['quantity'] ?? null;

        if ($quantity <= 0) {
            $deleteStmt = $pdo->prepare("DELETE FROM carts WHERE user_id = ? AND product_id = ?");
            $deleteStmt->execute([$userId, $productId]);
        } else {
            $updateQuery = "UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?";
            $updateStmt = $pdo->prepare($updateQuery);
            $updateStmt->execute([$quantity, $userId, $productId]);
        }
        echo json_encode(['message' => 'Quantity updated.']);
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"), true);
        $productId = $data['product_id'] ?? null;

        $deleteStmt = $pdo->prepare("DELETE FROM carts WHERE user_id = ? AND product_id = ?");
        $deleteStmt->execute([$userId, $productId]);
        echo json_encode(['message' => 'Item removed from cart.']);
        break;
}
?>
```
*Catatan: Pada kode di atas kita langsung *hardcode* `userId = 2` (Jane Smith) sebagai identitas pengguna, mengingat belum ada proses Login. Ini diperlukan supaya aplikasi dapat diuji coba.*

### 2. Membuat File `api/addresses.php`
API ini digunakan untuk menampilkan data alamat pengiriman *user*. Buat file `addresses.php` di dalam folder `api`, dan tambahkan kode:

```php
<?php
require_once '../config/database.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, User-Id");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$userId = 2; // Default mock user (Jane Smith)
$requestMethod = $_SERVER["REQUEST_METHOD"];

switch ($requestMethod) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT * FROM user_addresses WHERE user_id = ?");
        $stmt->execute([$userId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
}
?>
```

---

## Tahap 3: Pembuatan Antarmuka Frontend (React Native)

Tahap ini berisi instruksi mengkoding UI aplikasi. 

### 1. Modifikasi Layar Navigasi (`App.js`)
Ubah file `App.js` Anda agar mendaftarkan stack checkout. Tambahkan *import*:
```javascript
import CartScreen from './screens/CartScreen';
import AddressSelectionScreen from './screens/AddressSelectionScreen';
import ShippingMethodScreen from './screens/ShippingMethodScreen';
```
Dan sebelum fungsi `App()`, tambahkan Stack untuk kelanjutan pesanan:
```javascript
const CheckoutStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} options={{ title: 'Pilih Alamat' }} />
    <Stack.Screen name="ShippingMethod" component={ShippingMethodScreen} options={{ title: 'Metode Pengiriman' }} />
  </Stack.Navigator>
);
```
Kemudian di dalam `Stack.Navigator` utama, ganti rute yang berurusan dengan keranjang:
```javascript
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
```

### 2. Membuat `screens/CartScreen.js`
Buat file `CartScreen.js` yang bertugas menampilkan UI daftar pesanan yang ditarik dari `/cart.php`. File ini berisi kode berikut:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiClient from '../api/config';

const CartScreen = ({ navigation }) => {
    const [cartItems, setCartItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchCart();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/cart.php');
            setCartItems(response.data);
            const total = response.data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            setSubtotal(total);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, currentQuantity, change) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity <= 0) {
            await removeItem(productId);
            return;
        }

        // Optimistic UI update
        const updatedItems = cartItems.map(item => 
            item.product_id === productId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedItems);
        const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setSubtotal(newSubtotal);

        try {
            await apiClient.put('/cart.php', { product_id: productId, quantity: newQuantity });
        } catch (error) {
            console.error('Error updating quantity:', error);
            fetchCart(); // Revert on failure
        }
    };

    const removeItem = async (productId) => {
        // Optimistic UI update
        const updatedItems = cartItems.filter(item => item.product_id !== productId);
        setCartItems(updatedItems);
        const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setSubtotal(newSubtotal);

        try {
            await apiClient.delete('/cart.php', { data: { product_id: productId } });
        } catch (error) {
            console.error('Error removing item:', error);
            fetchCart(); // Revert on failure
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text>Rp. {parseFloat(item.price).toLocaleString('id-ID')} x {item.quantity}</Text>
                <Text style={{ fontWeight: 'bold', marginTop: 5 }}>Total: Rp. {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.actionContainer}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity style={styles.btn} onPress={() => updateQuantity(item.product_id, item.quantity, -1)}>
                        <Text style={styles.btnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => updateQuantity(item.product_id, item.quantity, 1)}>
                        <Text style={styles.btnText}>+</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.product_id)}>
                    <Text style={styles.deleteBtnText}>Hapus</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && cartItems.length === 0) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text>Keranjang belanja kosong.</Text>
                </View>
            ) : (
                <FlatList 
                    data={cartItems} 
                    renderItem={renderItem} 
                    keyExtractor={item => item.product_id.toString()} 
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
            <View style={styles.summary}>
                <Text style={styles.totalText}>Subtotal: Rp. {subtotal.toLocaleString('id-ID')}</Text>
                <Button 
                    title="Lanjut ke Checkout" 
                    onPress={() => navigation.navigate('CheckoutStack')} 
                    disabled={cartItems.length === 0}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    itemContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    itemName: { fontSize: 16, fontWeight: 'bold' },
    actionContainer: { alignItems: 'flex-end', justifyContent: 'space-between' },
    quantityContainer: { flexDirection: 'row', alignItems: 'center' },
    btn: { backgroundColor: '#ddd', padding: 5, width: 30, alignItems: 'center', borderRadius: 5 },
    btnText: { fontSize: 18, fontWeight: 'bold' },
    qtyText: { marginHorizontal: 15, fontSize: 16 },
    deleteBtn: { marginTop: 10 },
    deleteBtnText: { color: 'red' },
    summary: { padding: 20, paddingBottom: 40, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ccc' },
    totalText: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 }
});

export default CartScreen;
```

### 3. Membuat `screens/AddressSelectionScreen.js`
File ini men-*fetch* alamat dari API dan menggunakan antarmuka *Card*.

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import apiClient from '../api/config';

const AddressSelectionScreen = ({ navigation }) => {
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchAddresses();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/addresses.php');
            setAddresses(response.data);
            if (response.data.length > 0) {
                setSelectedAddressId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderAddress = ({ item }) => (
        <TouchableOpacity
            style={[styles.addressCard, selectedAddressId === item.id && styles.selectedCard]}
            onPress={() => setSelectedAddressId(item.id)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.label}>{item.label}</Text>
                {selectedAddressId === item.id && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={styles.recipientName}>{item.recipient_name} ({item.phone})</Text>
            <Text style={styles.addressText}>{item.full_address}</Text>
            <Text style={styles.addressText}>{item.city}, {item.postal_code}</Text>
        </TouchableOpacity>
    );

    if (loading && addresses.length === 0) {
        return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            {addresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text>Tidak ada alamat tersimpan.</Text>
                    <Button title="Tambah Alamat (TODO)" onPress={() => {}} />
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderAddress}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 15 }}
                />
            )}
            
            <View style={styles.footer}>
                <Button
                    title="Lanjutkan"
                    onPress={() => navigation.navigate('ShippingMethod', { addressId: selectedAddressId })}
                    disabled={!selectedAddressId}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    addressCard: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' },
    selectedCard: { borderColor: '#007bff', backgroundColor: '#eef5ff' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    label: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    checkIcon: { color: '#007bff', fontWeight: 'bold', fontSize: 18 },
    recipientName: { fontSize: 15, marginBottom: 3 },
    addressText: { color: '#666', fontSize: 14 },
    footer: { padding: 15, paddingBottom: 40, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' }
});

export default AddressSelectionScreen;
```

### 4. Membuat `screens/ShippingMethodScreen.js`
Sebagai placeholder kelanjutan alur *checkout*:

```javascript
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const ShippingMethodScreen = ({ route, navigation }) => {
    const { addressId } = route.params || {};

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Langkah 3: Metode Pengiriman</Text>
            <Text style={styles.info}>Alamat ID yang dipilih: {addressId}</Text>
            
            <View style={styles.placeholderBox}>
                <Text>Halaman ini adalah placeholder untuk kelanjutan checkout.</Text>
                <Text style={{ marginTop: 10 }}>Di sini pengguna akan memilih kurir, menghitung ongkir, dan melanjutkan ke pembayaran.</Text>
            </View>

            <Button 
                title="Selesaikan Pesanan (Mock)" 
                onPress={() => {
                    alert('Pesanan berhasil dibuat!');
                    navigation.navigate('ProductCatalog');
                }} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    info: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    placeholderBox: { backgroundColor: '#f0f0f0', padding: 20, borderRadius: 8, marginBottom: 30 }
});

export default ShippingMethodScreen;
```

### 5. Integrasikan ke `ProductListScreen.js`
Terakhir, kita hubungkan list produk dengan API Keranjang yang baru. Pada file `screens/ProductListScreen.js`, tambahkan fungsi baru:

```javascript
    const addToDatabaseCart = async (product) => {
        try {
            await apiClient.post('/cart.php', {
                product_id: product.id,
                quantity: 1
            });
            alert(`${product.name} berhasil ditambahkan ke keranjang!`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Gagal menambahkan ke keranjang');
        }
    };
```

Ganti pemanggilan Context `addItem` pada tombol "+ Tambah Keranjang" menjadi memanggil fungsi di atas:
```javascript
<TouchableOpacity
    style={styles.addToCartButton}
    onPress={() => addToDatabaseCart(item)}
>
    <Text style={styles.addToCartText}>+ Tambah Keranjang</Text>
</TouchableOpacity>
```

Dan update tombol 🛒 di *Header* agar langsung mengarah ke `Cart` (bukan Transaction):
```javascript
<TouchableOpacity
    style={styles.cartButton}
    onPress={() => navigation.navigate('Cart')}
>
    <Text style={styles.cartButtonText}>🛒 Keranjang</Text>
</TouchableOpacity>
```

---

## Tahap 4: Verifikasi & Pengujian
Seluruh logika *backend* dan *frontend* telah disambungkan.

Langkah Pengujian Mandiri:
1. Jalankan emulator, buka layar "Daftar Produk".
2. Tekan **"+ Tambah Keranjang"** pada sebuah produk. Anda akan melihat notifikasi berhasil.
3. Klik tombol **"🛒 Keranjang"** di atas. Layar ini seharusnya otomatis menampilkan isi data langsung dari Database!
4. Ubah angka *quantity*, otomatis total harga akan menyesuaikan dengan cepat.
5. Tekan **"Lanjut ke Checkout"**. 
6. Halaman **"Pilih Alamat"** akan terbuka dan Anda bisa melanjutkan *flow* pemesanan.

*Selesai! Anda berhasil menciptakan sistem keranjang modern yang stabil.*
