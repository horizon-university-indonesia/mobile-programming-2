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
