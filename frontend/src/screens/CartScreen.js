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
  ScrollView
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Button from '../components/Button';
import Header from '../components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../assets/common/baseurl';
import { AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { clearCart as clearCartAction, removeFromCart, updateCartItemQuantity } from '../redux/actions/cartActions';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
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
    let totalDiscount = 0;
    
    cartItems.forEach(item => {
      const originalPrice = item.price * item.quantity;
      const discountedPrice = item.discountPrice ? item.discountPrice * item.quantity : originalPrice;
      
      total += discountedPrice;
      
      // Calculate savings if there's a discount
      if (item.discountPrice) {
        totalDiscount += (originalPrice - discountedPrice);
      }
    });
    
    setTotalAmount(total);
    setTotalDiscount(totalDiscount);
  }, [cartItems]);

  // Load cart items from AsyncStorage
  const loadCartItems = async () => {
    try {
      setLoading(true);
      const cartData = await AsyncStorage.getItem('cart');
      const parsedCart = cartData ? JSON.parse(cartData) : [];

      // Debugging: Log cart items to check structure
      console.log('Loaded Cart Items:', parsedCart);

      // Map the id to _id if missing to fix the warning
      const validatedCart = parsedCart.map(item => {
        // If item has id but no _id, use id as _id
        if (item.id && !item._id) {
          return { ...item, _id: item.id };
        }
        // If missing both, create a temporary id
        if (!item._id && !item.id) {
          return { ...item, _id: `temp-id-${Math.random().toString(36).substring(2, 9)}` };
        }
        return item;
      });

      // Fetch additional details for each book if description is missing
      const updatedCart = await Promise.all(
        validatedCart.map(async (item) => {
          // If description is missing, try to fetch it
          if (!item.description) {
            try {
              const response = await axios.get(`${baseURL}books/${item._id}`);
              if (response.status === 200 && response.data) {
                // Update with additional details from the API
                return {
                  ...item,
                  description: response.data.description || 'No description available',
                  coverImage: item.coverImage || response.data.coverImage
                };
              }
            } catch (error) {
              console.error(`Error fetching details for book ${item._id}:`, error);
            }
          }
          return item;
        })
      );

      setCartItems(updatedCart);
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
      
      // Use Redux action to update quantity
      dispatch(updateCartItemQuantity(itemId, action));
      
      // Update local state for immediate UI feedback
      const updatedCart = cartItems.map((item) => {
        if (item._id === itemId) {
          const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
          return { ...item, quantity: Math.max(newQuantity, 1) }; // Ensure quantity is at least 1
        }
        return item;
      });
      
      console.log('Updated Cart with Redux action:', updatedCart);
      setCartItems(updatedCart);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  // Remove an item from cart
  const removeItem = async (itemId) => {
    try {
      console.log(`Removing item: ${itemId}`);
      
      // Use the Redux action to remove the item
      dispatch(removeFromCart(itemId));
      
      // Update local state for immediate UI update
      const updatedCart = cartItems.filter((item) => item._id !== itemId);
      setCartItems(updatedCart);
      
      console.log('Item removed from cart successfully using Redux action');
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

  // Clear all items from cart
  const clearCart = async () => {
    try {
      // Use the Redux action to clear the cart
      // This will handle both the Redux state and AsyncStorage
      dispatch(clearCartAction());
      
      // Ensure the local state is also updated
      setCartItems([]);
      setTotalAmount(0);
      
      // Add debug logging
      console.log('Cart cleared successfully using Redux action');
      
      Alert.alert('Success', 'Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Failed to clear cart');
    }
  };

  // Handle checkout
  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);

      // Retrieve the token from AsyncStorage
      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        console.log('Token not found in AsyncStorage');
        Alert.alert('Error', 'Please log in to place an order');
        setCheckoutLoading(false);
        navigation.navigate('Login');
        return;
      }

      // Set Authorization header
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      };
      
      // Prepare order data directly without separate user check
      const orderData = {
        products: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.discountPrice || item.price,
        })),
        paymentMethod: paymentMethod, // Use the selected payment method
      };

      console.log('Placing order with data:', orderData);

      // Place order directly
      const response = await axios.post(
        `${baseURL}orders/place`,
        orderData,
        config
      );
      
      console.log('Order response:', response.data);

      if (response.status === 201) {
        // Clear cart after successful order
        dispatch(clearCartAction());
        setCartItems([]);
        setTotalAmount(0);

        Alert.alert('Success', 'Order placed successfully');
        navigation.navigate('OrderDetails', { orderId: response.data.order._id });
      }
    } catch (error) {
      handleOrderError(error);
    } finally {
      setCheckoutLoading(false);
    }
  };
  
  // Helper function to handle order errors
  const handleOrderError = (error) => {
    console.error('Error during checkout:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      Alert.alert('Session Expired', 'Please log in again to continue.');
      navigation.navigate('Login');
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Your account does not have customer privileges. Please contact support.');
    } else {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order. Please try again.');
    }
  };

  // Render a single cart item
  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      {/* Remove button at top right */}
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeItem(item._id)}
      >
        <MaterialIcons name="delete" size={16} color="#fff" />
      </TouchableOpacity>
      
      <Image 
        source={{ uri: typeof item.coverImage === 'string' ? item.coverImage : (item.coverImage?.[0] || 'https://via.placeholder.com/100') }}
        style={styles.bookCover}
        resizeMode="cover"
      />
      
      <View style={styles.itemDetails}>
        {/* Price moved to top */}
        <View style={styles.priceContainer}>
          {item.discountPrice ? (
            <>
              <Text style={styles.discountPrice}>${item.discountPrice.toFixed(2)}</Text>
              <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
            </>
          ) : (
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          )}
        </View>
        
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookDescription} numberOfLines={2}>{item.description || 'No description available'}</Text>
      </View>
      
      {/* Quantity controls moved to horizontal layout at bottom */}
      <View style={styles.quantityControlsContainer}>
        <TouchableOpacity 
          style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]} 
          onPress={() => updateQuantity(item._id, 'decrease')}
          disabled={item.quantity <= 1}
        >
          <AntDesign name="minus" size={14} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.quantityText}>{item.quantity}</Text>
        
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={() => updateQuantity(item._id, 'increase')}
        >
          <AntDesign name="plus" size={14} color="#fff" />
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
            
            {totalDiscount > 0 && (
              <View style={styles.discountContainer}>
                <Text style={styles.discountLabel}>You Save:</Text>
                <Text style={styles.discountAmount}>${totalDiscount.toFixed(2)}</Text>
              </View>
            )}
            
            {/* Payment method selection */}
            <TouchableOpacity 
              style={styles.paymentMethodSelector}
              onPress={() => setShowPaymentModal(true)}
            >
              <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
              <View style={styles.paymentMethodValue}>
                <Text style={styles.paymentMethodText}>
                  {paymentMethod === 'COD' ? 'Cash On Delivery' : 
                   paymentMethod === 'Card' ? 'Credit/Debit Card' : 
                   paymentMethod === 'PayPal' ? 'PayPal' : 'Bank Transfer'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
            
            <Button 
              title={checkoutLoading ? 'Processing...' : 'Proceed to Checkout'} 
              onPress={handleCheckout}
              style={styles.checkoutButton}
              disabled={checkoutLoading}
            />
          </View>
          
          {/* Payment Method Modal */}
          <Modal
            visible={showPaymentModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPaymentModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Payment Method</Text>
                
                <ScrollView style={styles.paymentOptions}>
                  {/* Cash On Delivery Option */}
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'COD' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('COD');
                      setShowPaymentModal(false);
                    }}
                  >
                    <View style={styles.paymentIconContainer}>
                      <FontAwesome name="money" size={24} color={paymentMethod === 'COD' ? COLORS.white : COLORS.primary} />
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={[styles.paymentOptionTitle, paymentMethod === 'COD' && styles.selectedPaymentText]}>Cash On Delivery</Text>
                      <Text style={[styles.paymentOptionDesc, paymentMethod === 'COD' && styles.selectedPaymentText]}>Pay when you receive your order</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Credit/Debit Card Option */}
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'Card' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('Card');
                      setShowPaymentModal(false);
                    }}
                  >
                    <View style={styles.paymentIconContainer}>
                      <FontAwesome name="credit-card" size={24} color={paymentMethod === 'Card' ? COLORS.white : COLORS.primary} />
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={[styles.paymentOptionTitle, paymentMethod === 'Card' && styles.selectedPaymentText]}>Credit/Debit Card</Text>
                      <Text style={[styles.paymentOptionDesc, paymentMethod === 'Card' && styles.selectedPaymentText]}>Pay securely with your card</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* PayPal Option */}
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'PayPal' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('PayPal');
                      setShowPaymentModal(false);
                    }}
                  >
                    <View style={styles.paymentIconContainer}>
                      <FontAwesome name="paypal" size={24} color={paymentMethod === 'PayPal' ? COLORS.white : COLORS.primary} />
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={[styles.paymentOptionTitle, paymentMethod === 'PayPal' && styles.selectedPaymentText]}>PayPal</Text>
                      <Text style={[styles.paymentOptionDesc, paymentMethod === 'PayPal' && styles.selectedPaymentText]}>Pay with your PayPal account</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Bank Transfer Option */}
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'Bank Transfer' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('Bank Transfer');
                      setShowPaymentModal(false);
                    }}
                  >
                    <View style={styles.paymentIconContainer}>
                      <FontAwesome name="bank" size={24} color={paymentMethod === 'Bank Transfer' ? COLORS.white : COLORS.primary} />
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={[styles.paymentOptionTitle, paymentMethod === 'Bank Transfer' && styles.selectedPaymentText]}>Bank Transfer</Text>
                      <Text style={[styles.paymentOptionDesc, paymentMethod === 'Bank Transfer' && styles.selectedPaymentText]}>Pay via bank transfer</Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
                
                <Button 
                  title="Cancel" 
                  onPress={() => setShowPaymentModal(false)}
                  style={styles.cancelButton}
                />
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
  bookDescription: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    marginTop: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  discountPrice: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginRight: 8,
  },
  originalPrice: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.green,
    textDecorationLine: 'line-through',
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
  editIcon: {
    fontSize: SIZES.large,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  discountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.small,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.base,
  },
  discountLabel: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.darkGreen,
  },
  discountAmount: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.darkGreen,
  },
  // Payment method selector styles
  paymentMethodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.base,
    marginBottom: SIZES.medium,
  },
  paymentMethodLabel: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  paymentMethodValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginRight: SIZES.small,
  },
  // Payment method modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: SIZES.base,
    padding: SIZES.medium,
    maxHeight: '70%',
  },
  modalTitle: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    marginBottom: SIZES.medium,
    textAlign: 'center',
  },
  paymentOptions: {
    maxHeight: 300,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.base,
    marginBottom: SIZES.small,
    backgroundColor: COLORS.lightBackground,
  },
  selectedPaymentOption: {
    backgroundColor: COLORS.primary,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.small,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentOptionTitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  paymentOptionDesc: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.8,
  },
  selectedPaymentText: {
    color: COLORS.white,
  },
  cancelButton: {
    marginTop: SIZES.medium,
  },
});

export default CartScreen;