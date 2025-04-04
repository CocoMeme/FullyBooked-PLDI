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
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Button from '../components/Button';
import Header from '../components/Header';
import { useDispatch } from 'react-redux';
import { clearCart, removeFromCart, updateCartItemQuantityAction } from '../redux/actions/cartActions';
import { getCartItems,updateCartItemQuantity } from '../services/database';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
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
      const items = await getCartItems(); // Fetch items from the database
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
  
      // Find the item in the cart
      const item = cartItems.find((item) => item.product_id === itemId);
      if (!item) {
        console.error(`Item with product_id: ${itemId} not found in cart`);
        throw new Error(`Item with product_id: ${itemId} not found in cart`);
      }
  
      // Calculate the new quantity
      const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
  
      // Prevent quantity from going below 1
      if (newQuantity < 1) {
        Alert.alert('Error', 'Quantity cannot be less than 1.');
        return;
      }
  
      // Update the quantity in the database
      await updateCartItemQuantity(itemId, newQuantity);
  
      // Update the specific item in the cart state
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

      // Simulate sending order details to a backend or saving locally
      const orderDetails = {
        items: cartItems,
        totalAmount,
        orderDate: new Date().toISOString(),
      };

      console.log('Placing order:', orderDetails);

      // Simulate API call (replace with actual API call if needed)
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay

      // Clear the cart after successful order placement
      dispatch(clearCart());
      setCartItems([]);
      setTotalAmount(0);

      Alert.alert('Success', 'Your order has been placed successfully!');
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place the order. Please try again.');
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
            
            <Button 
              title="Proceed to Checkout" 
              onPress={placeOrder} // Call the placeOrder function
              style={styles.checkoutButton}
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
    position: 'relative',
    minHeight: 120,
  },
  bookCover: {
    width: 70,
    height: 100,
    borderRadius: SIZES.base,
  },
  itemDetails: {
    flex: 1,
    marginLeft: SIZES.medium,
    justifyContent: 'flex-start',
  },
  bookTitle: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
    marginTop: 5,
  },
  price: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  quantityControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  quantityButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  disabledButton: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.7,
  },
  quantityText: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    marginHorizontal: 5,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
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
    ...FONTS.semiBold,
    fontSize: SIZES.large,
  },
  totalAmount: {
    ...FONTS.extraBold,
    fontSize: SIZES.large,
    color: COLORS.primary,
  },
  checkoutButton: {
    marginTop: SIZES.small,
  },
  clearButtonText: {
    ...FONTS.medium,
    color: COLORS.error,
    fontSize: SIZES.small,
  },
});

export default CartScreen;