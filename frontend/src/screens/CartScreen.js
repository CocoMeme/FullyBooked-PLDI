import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Button from '../components/Button';
import Header from '../components/Header';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCart, removeFromCart } from '../redux/actions/cartActions';
import { getCartItems, updateCartItemQuantity } from '../services/database'; // SQLite functions
import API_URL from '../services/api';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // Default payment method
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const dispatch = useDispatch();

  // Load cart items when screen is focused
  useEffect(() => {
    loadCartItems();

    const unsubscribe = navigation.addListener('focus', () => {
      loadCartItems();
    });

    return unsubscribe;
  }, [navigation]);

  // Calculate total amount whenever cart items change
  useEffect(() => {
    let total = 0;

    cartItems.forEach((item) => {
      total += item.product_price * item.quantity;
    });

    setTotalAmount(total);
  }, [cartItems]);

  // Load cart items from SQLite database
  const loadCartItems = async () => {
    try {
      setLoading(true);
      const items = await getCartItems(); // Fetch items from SQLite database
      console.log('Loaded cart items:', JSON.stringify(items, null, 2)); // Debug log
      setCartItems(items); // Update state with fetched items
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  // Update quantity of an item
  const updateQuantity = async (itemId, action) => {
    try {
      console.log('Updating quantity for item ID:', itemId, 'Action:', action);

      const item = cartItems.find((item) => item.product_id === itemId);
      if (!item) {
        console.error(`Item with product_id: ${itemId} not found in cart`);
        throw new Error(`Item with product_id: ${itemId} not found in cart`);
      }

      const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;

      if (newQuantity < 1) {
        Alert.alert('Error', 'Quantity cannot be less than 1.');
        return;
      }

      await updateCartItemQuantity(itemId, newQuantity); // Update quantity in SQLite database

      setCartItems((prevItems) =>
        prevItems.map((cartItem) =>
          cartItem.product_id === itemId
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      );

      console.log(`Quantity updated for item ID: ${itemId} to ${newQuantity}`);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', error.message || 'Failed to update quantity');
    }
  };

  // Remove an item from cart
  const removeItem = async (itemId) => {
    try {
      dispatch(removeFromCart(itemId));
      loadCartItems(); // Reload cart items after removal
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // Clear all items from cart
  const clearCartItems = async () => {
    try {
      dispatch(clearCart());
      setCartItems([]);
      setTotalAmount(0);
      Alert.alert('Success', 'Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Failed to clear cart');
    }
  };

  // Place order function
  const placeOrder = async () => {
    try {
      if (cartItems.length === 0) {
        Alert.alert('Error', 'Your cart is empty. Add items to proceed.');
        return;
      }
  
      const orderDetails = {
        products: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.product_price,
        })),
        paymentMethod: paymentMethod, // Use selected payment method
      };
  
      console.log('Placing order:', orderDetails);
  
      // Debug log for the full API URL
      console.log('Full API URL for placing order:', `${API_URL}orders/place`);
  
      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        Alert.alert('Error', 'User not authenticated. Please log in.');
        navigation.navigate('Login');
        return;
      }
  
      // Use axios.post to send the request
      const response = await axios.post(
        `${API_URL}orders/place`,
        orderDetails,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200 || response.status === 201) {
        dispatch(clearCart());
        setCartItems([]);
        setTotalAmount(0);
  
        Alert.alert('Success', 'Your order has been placed successfully!');
      } else {
        console.error('Error placing order:', response.data);
        Alert.alert('Error', response.data.message || 'Failed to place the order. Please try again.');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to place the order. Please try again.');
    }
  };

  // Render a single cart item
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItem(item.product_id)}
      >
        <Text style={styles.removeButtonText}>X</Text>
      </TouchableOpacity>
      
      <Image 
        source={{ uri: item.product_image || 'https://via.placeholder.com/100' }}
        style={styles.bookCover}
        resizeMode="cover"
      />
      
      <View style={styles.itemDetails}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.price}>₱{item.product_price.toFixed(2)}</Text>
      </View>
      
      <View style={styles.quantityControlsContainer}>
        <TouchableOpacity 
          style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]} 
          onPress={() => updateQuantity(item.product_id, 'decrease')}
          disabled={item.quantity <= 1}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={() => updateQuantity(item.product_id, 'increase')}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Your Cart" 
        showBackButton={true}
        rightComponent={
          cartItems.length > 0 && (
            <TouchableOpacity onPress={clearCartItems}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )
        }
      />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyCartContainer}>
          <Text style={styles.emptyCartText}>Your cart is empty</Text>
          <Button 
            title="Browse Books" 
            onPress={() => navigation.navigate('Books')}
            style={styles.browseButton}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product_id.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.checkoutContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>₱{totalAmount.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.paymentMethodSelector}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
              <Text style={styles.paymentMethodText}>
                {paymentMethod === 'COD' ? 'Cash On Delivery' : paymentMethod}
              </Text>
            </TouchableOpacity>
            
            <Button 
              title="Proceed to Checkout" 
              onPress={placeOrder}
              style={styles.checkoutButton}
            />
          </View>
          
          <Modal
            visible={showPaymentModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPaymentModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                <ScrollView>
                  <TouchableOpacity 
                    style={styles.paymentOption}
                    onPress={() => {
                      setPaymentMethod('COD');
                      setShowPaymentModal(false);
                    }}
                  >
                    <Text>Cash On Delivery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.paymentOption}
                    onPress={() => {
                      setPaymentMethod('Card');
                      setShowPaymentModal(false);
                    }}
                  >
                    <Text>Credit/Debit Card</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 18,
    color: COLORS.gray,
  },
  listContainer: {
    padding: 10,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  bookCover: {
    width: 50,
    height: 70,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 10,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 14,
    color: COLORS.primary,
  },
  quantityControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 15,
  },
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
  checkoutContainer: {
    padding: 10,
    backgroundColor: '#fff',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 16,
    color: COLORS.primary,
  },
  paymentMethodSelector: {
    marginBottom: 10,
  },
  paymentMethodLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkoutButton: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paymentOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default CartScreen;