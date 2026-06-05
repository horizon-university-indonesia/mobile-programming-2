import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, Button, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import apiClient from '../api/config';

const AddressSelectionScreen = ({navigation}) => {
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchAddresses();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/addresses.php');
            setAddresses(response.data);
            if (response.data.length > 0) {
                setSelectedAddressId(response.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderAddress = ({item}) => (
        <TouchableOpacity
            style={[styles.addressCard, selectedAddressId === item.id && styles.selectedCard]}
            onPress={() => setSelectedAddressId(item.id)}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.label}>{item.label}</Text>
                {selectedAddressId === item.id && <Text style={styles.checkIcon}>✓</Text>}
            </View>
            <Text style={styles.recipientName}>{item.recipient_name} ({item.phone})</Text>
            <Text style={styles.addressText}>{item.full_address}</Text>
            <Text style={styles.addressText}>{item.city}, {item.postal_code}</Text>
        </TouchableOpacity>
    );

    if (loading && addresses.length === 0) {
        return <ActivityIndicator style={{flex: 1}} size="large" color="#0000ff"/>;
    }

    return (
        <View style={styles.container}>
            {addresses.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text>Tidak ada alamat tersimpan.</Text>
                    {/* Placeholder untuk fitur tambah alamat baru */}
                    <Button title="Tambah Alamat (TODO)" onPress={() => {
                    }}/>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    renderItem={renderAddress}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{padding: 15}}
                />
            )}

            <View style={styles.footer}>
                <Button
                    title="Lanjutkan"
                    onPress={() => navigation.navigate('ShippingMethod', {addressId: selectedAddressId})}
                    disabled={!selectedAddressId}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f5f5f5'},
    emptyContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    addressCard: {backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#ddd'},
    selectedCard: {borderColor: '#007bff', backgroundColor: '#eef5ff'},
    cardHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5},
    label: {fontWeight: 'bold', fontSize: 16, color: '#333'},
    checkIcon: {color: '#007bff', fontWeight: 'bold', fontSize: 18},
    recipientName: {fontSize: 15, marginBottom: 3},
    addressText: {color: '#666', fontSize: 14},
    footer: {padding: 15, paddingBottom: 40, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd'}
});

export default AddressSelectionScreen;
