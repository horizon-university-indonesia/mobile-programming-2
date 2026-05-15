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
import { CartProvider } from './context/CartContext'; // Provider untuk state keranjang

// Membuat instance/objek Stack yang akan digunakan untuk mendefinisikan navigasi
const Stack = createNativeStackNavigator();

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
        
      </Stack.Navigator>
    </NavigationContainer>
    </CartProvider>
  );
}