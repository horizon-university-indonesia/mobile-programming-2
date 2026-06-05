import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, Button, ActivityIndicator} from 'react-native';
import apiClient from '../api/config';

const ShippingMethodScreen = ({route, navigation}) => {
    const {addressId} = route.params || {};
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await apiClient.get('/cart.php');
            setCartItems(response.data);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (loading) {
        return <ActivityIndicator style={{flex: 1}} size="large" color="#0000ff" />;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Langkah 3: Metode Pengiriman</Text>
            <Text style={styles.info}>Alamat ID yang dipilih: {addressId}</Text>

            <View style={styles.placeholderBox}>
                <Text>Halaman ini adalah placeholder untuk kelanjutan checkout.</Text>
                <Text style={{marginTop: 10}}>Di sini pengguna akan memilih kurir, menghitung ongkir, dan melanjutkan ke pembayaran.</Text>
            </View>

            <Button
                title="Lanjut ke Pembayaran"
                onPress={() => {
                    navigation.navigate('Payment', {
                        addressId: addressId,
                        cartItems: cartItems,
                        subtotal: subtotal,
                        shippingCost: 15000
                    });
                }}
                disabled={cartItems.length === 0}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, padding: 20, backgroundColor: '#fff', justifyContent: 'center'},
    title: {fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center'},
    info: {fontSize: 16, marginBottom: 20, textAlign: 'center'},
    placeholderBox: {backgroundColor: '#f0f0f0', padding: 20, borderRadius: 8, marginBottom: 30}
});

export default ShippingMethodScreen;
