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
import PaymentScreen from './screens/PaymentScreen';
import PaymentStatusScreen from './screens/PaymentStatusScreen';

import { CartProvider } from './context/CartContext'; // Provider untuk state keranjang

// Membuat instance/objek Stack yang akan digunakan untuk mendefinisikan navigasi
const Stack = createNativeStackNavigator();

const CheckoutStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="AddressSelection" component={AddressSelectionScreen} options={{ title: 'Pilih Alamat' }} />
    <Stack.Screen name="ShippingMethod" component={ShippingMethodScreen} options={{ title: 'Metode Pengiriman' }} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pembayaran' }} />
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
        {/* Layar Status Pembayaran (Pertemuan 15) */}
        <Stack.Screen
          name="PaymentStatus"
          component={PaymentStatusScreen}
          options={{ title: 'Status Pembayaran', headerBackVisible: false }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
    </CartProvider>
  );
}