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
                            uri: `http://10.200.205.16/${existingImageUrl}`,
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