import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Button,
    ActivityIndicator,
} from 'react-native';
import apiClient from '../api/config';

const PaymentStatusScreen = ({ route, navigation }) => {
    const { orderId, orderNumber, snapToken, totalAmount } = route.params || {};

    const [orderStatus, setOrderStatus] = useState('pending');
    const [isChecking, setIsChecking] = useState(true);

    const intervalRef = useRef(null);

    useEffect(() => {
        checkOrderStatus();

        intervalRef.current = setInterval(checkOrderStatus, 3000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const checkOrderStatus = async () => {
        try {
            const response = await apiClient.get('/order_status.php', {
                params: { order_id: orderId }
            });

            if (response.data.success) {
                const status = response.data.order.status;
                setOrderStatus(status);

                if (status === 'paid' || status === 'cancelled') {
                    setIsChecking(false);
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking order status:', error);
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending':
                return {
                    text: 'Pesanan dibuat, menunggu pembayaran...',
                    color: '#ffc107',
                    icon: '⏳'
                };
            case 'waiting_for_payment':
                return {
                    text: 'Menunggu pembayaran...',
                    color: '#ffc107',
                    icon: '⏳'
                };
            case 'paid':
                return {
                    text: 'Pembayaran BERHASIL! Pesanan sedang diproses.',
                    color: '#28a745',
                    icon: '✅'
                };
            case 'cancelled':
                return {
                    text: 'Pembayaran dibatalkan atau gagal.',
                    color: '#dc3545',
                    icon: '❌'
                };
            default:
                return {
                    text: 'Status tidak diketahui',
                    color: '#6c757d',
                    icon: '❓'
                };
        }
    };

    const statusInfo = getStatusInfo(orderStatus);

    return (
        <View style={styles.container}>
            <Text style={[styles.icon, { color: statusInfo.color }]}>
                {statusInfo.icon}
            </Text>

            <Text style={styles.orderNumber}>
                Pesanan: {orderNumber}
            </Text>

            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>

            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalAmount}>
                Rp. {(totalAmount || 0).toLocaleString('id-ID')}
            </Text>

            {isChecking && (
                <View style={styles.checkingContainer}>
                    <ActivityIndicator size="small" color="#007bff" />
                    <Text style={styles.checkingText}>
                        Mengecek status pembayaran...
                    </Text>
                </View>
            )}

            {orderStatus === 'paid' && (
                <Button
                    title="Lihat Pesanan Saya"
                    onPress={() => navigation.navigate('ProductCatalog')}
                    color="#28a745"
                />
            )}

            {orderStatus === 'cancelled' && (
                <Button
                    title="Coba Lagi"
                    onPress={() => navigation.goBack()}
                    color="#dc3545"
                />
            )}
        </View>
    );
};

export default PaymentStatusScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    icon: {
        fontSize: 64,
        marginBottom: 20,
    },
    orderNumber: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 30,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 30,
    },
    checkingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkingText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#007bff',
    },
});
