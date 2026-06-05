import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    ActivityIndicator,
    Alert,
    ScrollView
} from 'react-native';
import apiClient from '../api/config';

const PaymentScreen = ({ route, navigation }) => {
    const { addressId, cartItems, subtotal, shippingCost } = route.params || {};

    const [isLoading, setIsLoading] = useState(false);

    const shipping = shippingCost || 15000;
    const tax = subtotal ? subtotal * 0.1 : 0;
    const total = (subtotal || 0) + shipping + tax;

    const handlePayment = async () => {
        if (!cartItems || cartItems.length === 0) {
            Alert.alert('Error', 'Tidak ada item untuk dibayar');
            return;
        }

        setIsLoading(true);

        try {
            const items = cartItems.map(item => ({
                product_id: item.productId || item.product_id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            }));

            const response = await apiClient.post('/create_order.php', {
                items: items,
                address_id: addressId,
                shipping_cost: shipping
            });

            const { snapToken, orderId, orderNumber, totalAmount } = response.data;

            navigation.navigate('PaymentStatus', {
                orderId: orderId,
                orderNumber: orderNumber,
                snapToken: snapToken,
                totalAmount: totalAmount
            });

        } catch (error) {
            console.error('Payment failed:', error);
            Alert.alert(
                'Pembayaran Gagal',
                error.response?.data?.message || 'Terjadi kesalahan. Silakan coba lagi.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Ringkasan Pembayaran</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
                <Text style={styles.sectionContent}>
                    Alamat ID: {addressId || 'Tidak dipilih'}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Produk Dipesan</Text>
                {cartItems && cartItems.length > 0 ? (
                    cartItems.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQty}>x{item.quantity}</Text>
                            <Text style={styles.itemPrice}>
                                Rp. {(item.price * item.quantity).toLocaleString('id-ID')}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.sectionContent}>Tidak ada produk</Text>
                )}
            </View>

            <View style={styles.section}>
                <View style={styles.totalRow}>
                    <Text>Subtotal</Text>
                    <Text>Rp. {(subtotal || 0).toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text>Ongkos Kirim</Text>
                    <Text>Rp. {shipping.toLocaleString('id-ID')}</Text>
                </View>
                <View style={styles.totalRow}>
                    <Text>Pajak (10%)</Text>
                    <Text>Rp. {tax.toLocaleString('id-ID')}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotal]}>
                    <Text style={styles.totalLabel}>Total Pembayaran</Text>
                    <Text style={styles.totalAmount}>
                        Rp. {total.toLocaleString('id-ID')}
                    </Text>
                </View>
            </View>

            <View style={styles.buttonContainer}>
                <Button
                    title={isLoading ? 'Memproses...' : 'Bayar Sekarang'}
                    onPress={handlePayment}
                    disabled={isLoading || !cartItems || cartItems.length === 0}
                    color="#28a745"
                />
                {isLoading && (
                    <ActivityIndicator
                        size="small"
                        color="#28a745"
                        style={{ marginTop: 10 }}
                    />
                )}
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Info Praktikum:</Text>
                <Text style={styles.infoText}>
                    Karena kita belum memiliki akun Midtrans sungguhan, pembayaran
                    menggunakan Snap Token SIMULASI. Di dunia nyata, setelah
                    menekan "Bayar Sekarang", aplikasi akan membuka halaman
                    pembayaran Midtrans (kartu kredit, transfer, GoPay, dll).
                </Text>
                <Text style={styles.infoText}>
                    Setelah pembayaran "selesai", status pesanan akan diperbarui
                    oleh webhook (Tahap 3).
                </Text>
            </View>
        </ScrollView>
    );
};

export default PaymentScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    section: {
        backgroundColor: '#fff',
        margin: 10,
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    sectionContent: {
        fontSize: 14,
        color: '#666',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    itemName: {
        flex: 2,
        fontSize: 14,
    },
    itemQty: {
        flex: 1,
        fontSize: 14,
        textAlign: 'center',
    },
    itemPrice: {
        flex: 1,
        fontSize: 14,
        textAlign: 'right',
        fontWeight: 'bold',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    grandTotal: {
        borderTopWidth: 2,
        borderTopColor: '#333',
        marginTop: 10,
        paddingTop: 10,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
    },
    buttonContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    infoBox: {
        backgroundColor: '#fff3cd',
        margin: 10,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffc107',
        marginBottom: 40,
    },
    infoTitle: {
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 5,
    },
    infoText: {
        fontSize: 13,
        color: '#856404',
        marginBottom: 5,
        lineHeight: 20,
    },
});
