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
