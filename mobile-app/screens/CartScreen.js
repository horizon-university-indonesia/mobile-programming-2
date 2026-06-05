import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, Button, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import apiClient from '../api/config';

const CartScreen = ({navigation}) => {
    const [cartItems, setCartItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchCart();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchCart = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/cart.php');
            setCartItems(response.data);
            const total = response.data.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            setSubtotal(total);
        } catch (error) {
            console.error('Error fetching cart:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, currentQuantity, change) => {
        const newQuantity = currentQuantity + change;
        if (newQuantity <= 0) {
            await removeItem(productId);
            return;
        }

        // Optimistic UI update
        const updatedItems = cartItems.map(item =>
            item.product_id === productId ? {...item, quantity: newQuantity} : item
        );
        setCartItems(updatedItems);
        const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setSubtotal(newSubtotal);

        try {
            await apiClient.put('/cart.php', {product_id: productId, quantity: newQuantity});
        } catch (error) {
            console.error('Error updating quantity:', error);
            fetchCart(); // Revert on failure
        }
    };

    const removeItem = async (productId) => {
        // Optimistic UI update
        const updatedItems = cartItems.filter(item => item.product_id !== productId);
        setCartItems(updatedItems);
        const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setSubtotal(newSubtotal);

        try {
            await apiClient.delete('/cart.php', {data: {product_id: productId}});
        } catch (error) {
            console.error('Error removing item:', error);
            fetchCart(); // Revert on failure
        }
    };

    const renderItem = ({item}) => (
        <View style={styles.itemContainer}>
            <View style={{flex: 1}}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text>Rp. {parseFloat(item.price).toLocaleString('id-ID')} x {item.quantity}</Text>
                <Text style={{fontWeight: 'bold', marginTop: 5}}>Total: Rp. {(item.price * item.quantity).toLocaleString('id-ID')}</Text>
            </View>
            <View style={styles.actionContainer}>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity style={styles.btn} onPress={() => updateQuantity(item.product_id, item.quantity, -1)}>
                        <Text style={styles.btnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.btn} onPress={() => updateQuantity(item.product_id, item.quantity, 1)}>
                        <Text style={styles.btnText}>+</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.product_id)}>
                    <Text style={styles.deleteBtnText}>Hapus</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading && cartItems.length === 0) {
        return <ActivityIndicator style={{flex: 1}} size="large" color="#0000ff"/>;
    }

    return (
        <View style={styles.container}>
            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text>Keranjang belanja kosong.</Text>
                </View>
            ) : (
                <FlatList
                    data={cartItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.product_id.toString()}
                    contentContainerStyle={{paddingBottom: 20}}
                />
            )}
            <View style={styles.summary}>
                <Text style={styles.totalText}>Subtotal: Rp. {subtotal.toLocaleString('id-ID')}</Text>
                <Button
                    title="Lanjut ke Checkout"
                    onPress={() => navigation.navigate('CheckoutStack')}
                    disabled={cartItems.length === 0}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#f9f9f9'},
    emptyContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    itemContainer: {flexDirection: 'row', backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#eee'},
    itemName: {fontSize: 16, fontWeight: 'bold'},
    actionContainer: {alignItems: 'flex-end', justifyContent: 'space-between'},
    quantityContainer: {flexDirection: 'row', alignItems: 'center'},
    btn: {backgroundColor: '#ddd', padding: 5, width: 30, alignItems: 'center', borderRadius: 5},
    btnText: {fontSize: 18, fontWeight: 'bold'},
    qtyText: {marginHorizontal: 15, fontSize: 16},
    deleteBtn: {marginTop: 10},
    deleteBtnText: {color: 'red'},
    summary: {padding: 20, paddingBottom: 40, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ccc'},
    totalText: {fontSize: 18, fontWeight: 'bold', marginBottom: 15}
});

export default CartScreen;
