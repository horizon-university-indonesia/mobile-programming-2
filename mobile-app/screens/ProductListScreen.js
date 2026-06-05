/*
 * Mengimpor React dan hooks yang dibutuhkan (useState, useEffect)
 * useState: untuk menyimpan data lokal di dalam komponen
 * useEffect: untuk menjalankan fungsi saat komponen dimuat atau state berubah
 */
import React, {useState, useEffect} from 'react';

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
import {useCart} from '../context/CartContext';

const BASE_URL = 'http://10.25.210.16/'; // Sesuaikan dengan folder root project di HTDOCS

/*
 * Komponen utama layar daftar produk
 * Menerima props 'navigation' untuk berpindah ke layar lain
 */
const ProductListScreen = ({navigation}) => {
    // Menyimpan daftar produk yang sedang ditampilkan
    const [products, setProducts] = useState([]);

    // Memanggil fungsi addItem dan state items dari CartContext
    const {addItem, items} = useCart();

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
            // Menambahkan parameter timestamp (_t) untuk mencegah caching response API oleh OS Android/iOS
            const response = await apiClient.get('/products.php?_t=' + new Date().getTime());
            setProducts(response.data.data);
            setFullProductList(response.data.data);
        } catch (error) {
            console.log('Error fetch:', error);
        }
    };

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

    /*
     * useEffect ini bereaksi setiap kali nilai 'search' atau 'fullProductList' berubah.
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
    }, [search, fullProductList]);

    /*
     * renderItem berfungsi menentukan desain/tampilan dari setiap item produk 
     * di dalam daftar (FlatList)
     */
    const renderItem = ({item}) => {
        // Menentukan URL gambar produk. Jika tidak ada, pakai gambar placeholder.
        let imagePath = item.image_url;
        // Jika path tidak mengandung '/', berarti itu cuma nama file lama (contoh: keripik.jpg)
        if (imagePath && !imagePath.includes('/')) {
            imagePath = 'uploads/products/' + imagePath;
        }

        const imageUri = imagePath
            ? `${BASE_URL}${imagePath}?t=${new Date().getTime()}`
            : 'https://via.placeholder.com/80';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() =>
                    navigation.navigate('AddEditProduct', {productId: item.id})
                }
            >
                <Image
                    source={{
                        uri: imageUri,
                        headers: {'Host': 'api-project.local'}
                    }}
                    style={styles.image}
                />
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text>Kategori: {item.category_name || '-'}</Text>
                    <Text>Harga: Rp {item.price}</Text>
                    <Text>Stok: {item.stock}</Text>
                    <TouchableOpacity
                        style={styles.addToCartButton}
                        onPress={() => addToDatabaseCart(item)}
                    >
                        <Text style={styles.addToCartText}>+ Tambah Keranjang</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    /*
     * Tampilan (UI) utama untuk layar ini dikembalikan (return) di bawah sini
     */
    return (
        <View style={styles.container}>
            {/* Header pencarian dan tombol keranjang */}
            <View style={styles.headerRow}>
                <TextInput
                    placeholder="Cari produk..."
                    value={search}
                    onChangeText={setSearch}
                    style={[styles.search, {flex: 1, marginBottom: 0}]}
                />
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <Text style={styles.cartButtonText}>
                        🛒 Keranjang
                    </Text>
                </TouchableOpacity>
            </View>

            {/* FlatList digunakan untuk menampilkan daftar data panjang secara efisien */}
            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
            />

            <View style={styles.footerButtons}>
                <TouchableOpacity
                    style={[styles.button, {flex: 1, marginRight: 5}]}
                    onPress={() => navigation.navigate('AddEditProduct')}
                >
                    <Text style={styles.buttonText}>+ Tambah Produk</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, {flex: 1, marginHorizontal: 5, backgroundColor: '#6200EE'}]}
                    onPress={() => navigation.navigate('Dashboard')}
                >
                    <Text style={styles.buttonText}>📊 Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, {flex: 1, marginLeft: 5, backgroundColor: '#E91E63'}]}
                    onPress={() => navigation.navigate('ProductCatalog')}
                >
                    <Text style={styles.buttonText}>🛍️ Katalog</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

export default ProductListScreen;

const styles = StyleSheet.create({
    container: {flex: 1, padding: 10},
    headerRow: {flexDirection: 'row', marginBottom: 10},
    search: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    cartButton: {
        backgroundColor: '#000000',
        justifyContent: 'center',
        paddingHorizontal: 15,
        borderRadius: 8,
        marginLeft: 10,
    },
    cartButtonText: {color: '#fff', fontWeight: 'bold'},
    card: {
        flexDirection: 'row',
        marginBottom: 10,
        padding: 10,
        borderWidth: 1,
        borderRadius: 10,
    },
    image: {width: 80, height: 80, borderRadius: 8},
    info: {marginLeft: 10, flex: 1},
    name: {fontWeight: 'bold', fontSize: 16},
    button: {
        backgroundColor: 'blue',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    footerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },

    buttonText: {color: '#fff', textAlign: 'center'},
    addToCartButton: {
        backgroundColor: '#28a745',
        padding: 8,
        borderRadius: 5,
        marginTop: 8,
    },
    addToCartText: {color: '#fff', textAlign: 'center', fontSize: 13, fontWeight: 'bold'},
});