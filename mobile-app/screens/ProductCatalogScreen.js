// Praktikum: Screen ini menampilkan katalog produk dengan pencarian, pagination, dan filter.
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

// Fungsi fetchProducts: mengambil data produk dari backend dengan fitur pagination, pencarian, dan filter.
// Menggunakan useCallback untuk memoize sehingga tidak berubah setiap render, sekaligus loadingRef mencegah race condition.
    const fetchProducts = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            // Membuat objek params untuk API: halaman, batas item, kata kunci pencarian, dan filter harga/kategori.
            const params = {
                page: pageNum,
                limit: 10,
                search: search,
                ...filters
            };
            const response = await apiClient.get('/products.php', {params});
            const newProducts = response.data.data;
            const pagination = response.data.pagination;

            // Menentukan apakah data harus di-refresh (reset) atau ditambahkan (infinite scroll).
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

    // useEffect: dipanggil saat komponen mount untuk memuat data awal.
    useEffect(() => {
        fetchProducts(1, true); // Fetch awal
    }, [fetchProducts]);

    // handleLoadMore: dipanggil oleh FlatList ketika mendekati akhir layar untuk memuat halaman berikutnya.
    const handleLoadMore = () => {
        if (page < totalPages && !loading) {
            fetchProducts(page + 1);
        }
    };

    // renderFooter: menampilkan spinner loading di bagian bawah list saat data sedang di-fetch.
    const renderFooter = () => {
        return loading ? <ActivityIndicator style={{marginVertical: 20}} size="large" color="#0000ff"/> : null;
    };

    // renderItem: mendefinisikan tampilan tiap item produk dalam FlatList.
// Menampilkan nama, harga (format IDR), kategori, dan rating beserta jumlah ulasan.
    const renderItem = ({item}) => (
        <View style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>Rp. {parseFloat(item.price).toLocaleString('id-ID')}</Text>
            <Text style={styles.itemMeta}>Kategori: {item.category_name || 'Umum'}</Text>
            <Text style={styles.itemRating}>
                {/* Menampilkan rating produk beserta jumlah ulasan. */}
                Rating: {item.rating} ({item.num_reviews} ulasan)
            </Text>
        </View>
    );

    // UI utama: Search bar di atas, kemudian list produk dengan FlatList.
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

// styles: definisi styling untuk komponen menggunakan StyleSheet React Native.
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

// Ekspor komponen utama agar dapat digunakan dalam navigasi aplikasi.
export default ProductCatalogScreen;
