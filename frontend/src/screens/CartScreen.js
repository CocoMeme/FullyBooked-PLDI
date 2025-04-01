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
  Alert
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Button from '../components/Button';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

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
    const total = cartItems.reduce((sum, item) => {
      const itemPrice = item.discountPrice || item.price;
      return sum + (itemPrice * item.quantity);
    }, 0);
    
    setTotalAmount(total);
  }, [cartItems]);

  // Load cart items from AsyncStorage
  const loadCartItems = async () => {
    try {
      setLoading(true);
      const cartData = await AsyncStorage.getItem('cart');
      const parsedCart = cartData ? JSON.parse(cartData) : [];

      // Debugging: Log cart items to check for missing _id
      console.log('Loaded Cart Items:', parsedCart);

      // Validate cart items to ensure all have _id
      const validatedCart = parsedCart.map((item, index) => {
        if (!item._id) {
          console.warn(`Item at index ${index} is missing _id.`, item);
          return { ...item, _id: `temp-id-${index}` }; // Assign a temporary ID
        }
        return item;
      });

      setCartItems(validatedCart);
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
      console.log(`Updating quantity for item: ${itemId}, Action: ${action}`);
      
      const updatedCart = cartItems.map((item) => {
        if (item._id === itemId) {
          const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
          return { ...item, quantity: Math.max(newQuantity, 1) }; // Ensure quantity is at least 1
        }
        return item;
      });

      console.log('Updated Cart:', updatedCart);

      setCartItems(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // Remove an item from cart
  const removeItem = async (itemId) => {
    try {
      console.log(`Removing item: ${itemId}`);
      
      const updatedCart = cartItems.filter((item) => item._id !== itemId);

      console.log('Updated Cart After Removal:', updatedCart);

      setCartItems(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // Clear all items from cart
  const clearCart = async () => {
    try {
      await AsyncStorage.removeItem('cart');
      setCartItems([]);
      setTotalAmount(0);
      Alert.alert('Success', 'Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Failed to clear cart');
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out');
      return;
    }

    try {
      setCheckoutLoading(true);

      const userId = await AsyncStorage.getItem('userId'); // Assuming userId is stored in AsyncStorage
      if (!userId) {
        Alert.alert('Error', 'User not logged in.');
        return;
      }

      const orderData = {
        userId,
        products: cartItems.map((item) => ({
          bookId: item._id,
          quantity: item.quantity,
        })),
        paymentMethod: 'COD', // Example: Cash on Delivery
      };

      console.log('Order Data:', orderData);

      const response = await axios.post('http://192.168.112.70:3000/api/orders/place', orderData);

      console.log('Response:', response.data);

      if (response.status === 201) {
        await AsyncStorage.removeItem('cart');
        setCartItems([]);

        Alert.alert('Success', 'Order placed successfully');
        navigation.navigate('OrderDetails', { orderId: response.data.order._id });
      }
    } catch (error) {
      console.error('Error during checkout:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Render a single cart item
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.coverImage?.[0] || 'https://via.placeholder.com/100' }}
        style={styles.bookCover}
        resizeMode="cover"
      />
      <View style={styles.itemDetails}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookCategory}>{item.category}</Text>
        <View style={styles.priceContainer}>
          {item.discountPrice ? (
            <Text style={styles.price}>${item.discountPrice.toFixed(2)}</Text>
          ) : (
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          )}
        </View>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={() => updateQuantity(item._id, 'decrease')}
          disabled={item.quantity <= 1}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={() => updateQuantity(item._id, 'increase')}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item._id)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ClearCartButton = () => {
    if (cartItems.length === 0) return null;

    return (
      <TouchableOpacity 
        onPress={() => Alert.alert(
          'Clear Cart',
          'Are you sure you want to clear your cart?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearCart }
          ]
        )}
      >
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Your Cart" 
        showBackButton={true}
        rightComponent={<ClearCartButton />}
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
            keyExtractor={(item) => item._id.toString()} // Ensure unique key for each item
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.checkoutContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            <Button 
              title={checkoutLoading ? 'Processing...' : 'Proceed to Checkout'} 
              onPress={handleCheckout}
              style={styles.checkoutButton}
              disabled={checkoutLoading}
            />
          </View>
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
  clearButtonText: {
    ...FONTS.medium,
    color: COLORS.error,
    fontSize: SIZES.small,
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
    padding: SIZES.large,
  },
  emptyCartText: {
    ...FONTS.medium,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
    marginBottom: SIZES.large,
  },
  browseButton: {
    width: 200,
  },
  listContainer: {
    padding: SIZES.small,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: SIZES.base,
    marginBottom: SIZES.medium,
    padding: SIZES.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCover: {
    width: 70,
    height: 100,
    borderRadius: SIZES.base,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SIZES.medium,
    justifyContent: 'space-between',
  },
  bookTitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
  bookCategory: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.secondary,
  },
  priceContainer: {
    marginTop: SIZES.small,
  },
  price: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  quantityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  quantityText: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    marginVertical: 5,
  },
  removeButton: {
    marginTop: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  checkoutContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: SIZES.medium,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  totalLabel: {
    ...FONTS.medium,
    fontSize: SIZES.large,
  },
  totalAmount: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
  },
  checkoutButton: {
    marginTop: SIZES.small,
  },
});

export default CartScreen;