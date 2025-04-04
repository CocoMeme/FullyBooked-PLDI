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
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearCart, removeFromCart } from '../redux/actions/cartActions';
import { placeOrder } from '../redux/actions/orderActions';
import { getCartItems, updateCartItemQuantity } from '../services/database'; // SQLite functions
import API_URL from '../services/api';
import { FontAwesome, MaterialIcons, Ionicons, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
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
    let discount = 0;

    cartItems.forEach((item) => {
      total += item.product_price * item.quantity;
      // Calculate discount if discountPrice exists
      if (item.discountPrice && item.discountPrice < item.product_price) {
        discount += (item.product_price - item.discountPrice) * item.quantity;
      }
    });

    setTotalAmount(total);
    setDiscountAmount(discount);
    setFinalAmount(total - discount);
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
      setDiscountAmount(0);
      setFinalAmount(0);
      Alert.alert('Success', 'Cart cleared successfully');
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert('Error', 'Failed to clear cart');
    }
  };

  // Place order function
  const handlePlaceOrder = async () => {
    try {
      if (cartItems.length === 0) {
        Alert.alert('Error', 'Your cart is empty. Add items to proceed.');
        return;
      }

      // Format order data to match backend expectations
      const orderData = {
        products: cartItems.map((item) => ({
          productId: item.product_id,
          quantity: item.quantity,
          price: item.discountPrice || item.product_price,
        })),
        paymentMethod,
        totalAmount: finalAmount
      };

      // Dispatch the order action
      await dispatch(placeOrder(orderData));

      // Clear cart and reset state after successful order
      setCartItems([]);
      setTotalAmount(0);
      setDiscountAmount(0);
      setFinalAmount(0);
      
      Alert.alert(
        'Success',
        'Order placed successfully!',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('MyOrders'),
          },
          {
            text: 'Continue Shopping',
            onPress: () => navigation.navigate('Books'),
          },
        ]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to place order. Please try again.'
      );
    }
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'COD':
        return <MaterialIcons name="attach-money" size={24} color={COLORS.primary} />;
      case 'Card':
        return <AntDesign name="creditcard" size={24} color={COLORS.primary} />;
      case 'PayPal':
        return <FontAwesome name="paypal" size={24} color={COLORS.primary} />;
      case 'Bank Transfer':
        return <MaterialCommunityIcons name="bank-transfer" size={24} color={COLORS.primary} />;
      default:
        return <MaterialIcons name="attach-money" size={24} color={COLORS.primary} />;
    }
  };

  // Render a single cart item
  const renderCartItem = ({ item }) => {
    const hasDiscount = item.discountPrice && item.discountPrice < item.product_price;
    
    return (
      <View style={styles.cartItem}>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item.product_id)}
        >
          <AntDesign name="close" size={18} color={COLORS.white} />
        </TouchableOpacity>
        
        <Image 
          source={{ uri: item.product_image || 'https://via.placeholder.com/100' }}
          style={styles.bookCover}
          resizeMode="cover"
        />
        
        <View style={styles.itemDetails}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.product_name}</Text>
          
          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <Text style={styles.originalPrice}>₱{item.product_price.toFixed(2)}</Text>
                <Text style={styles.discountPrice}>₱{item.discountPrice.toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.price}>₱{item.product_price.toFixed(2)}</Text>
            )}
          </View>
          
          <View style={styles.quantityControlsContainer}>
            <TouchableOpacity 
              style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]} 
              onPress={() => updateQuantity(item.product_id, 'decrease')}
              disabled={item.quantity <= 1}
            >
              <AntDesign name="minus" size={16} color={COLORS.white} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={() => updateQuantity(item.product_id, 'increase')}
            >
              <AntDesign name="plus" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
          <MaterialCommunityIcons name="cart-outline" size={80} color={COLORS.gray} />
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
            <View style={styles.priceBreakdownContainer}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal:</Text>
                <Text style={styles.priceValue}>₱{totalAmount.toFixed(2)}</Text>
              </View>
              
              {discountAmount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Discount:</Text>
                  <Text style={styles.discountValue}>-₱{discountAmount.toFixed(2)}</Text>
                </View>
              )}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>₱{finalAmount.toFixed(2)}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.paymentMethodSelector}
              onPress={() => setShowPaymentModal(true)}
            >
              <View style={styles.paymentMethodHeader}>
                <Text style={styles.paymentMethodLabel}>Payment Method</Text>
                <MaterialIcons name="keyboard-arrow-down" size={24} color={COLORS.primary} />
              </View>
              
              <View style={styles.selectedPaymentMethod}>
                {getPaymentMethodIcon(paymentMethod)}
                <Text style={styles.paymentMethodText}>
                  {paymentMethod === 'COD' ? 'Cash On Delivery' : 
                   paymentMethod === 'Card' ? 'Credit/Debit Card' : 
                   paymentMethod === 'PayPal' ? 'PayPal' : 'Bank Transfer'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <Button 
              title="Proceed to Checkout" 
              onPress={handlePlaceOrder}
              style={styles.checkoutButton}
              icon={<MaterialIcons name="shopping-cart-checkout" size={20} color={COLORS.white} style={styles.buttonIcon} />}
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
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Payment Method</Text>
                  <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                    <AntDesign name="close" size={24} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView>
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'COD' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('COD');
                      setShowPaymentModal(false);
                    }}
                  >
                    <MaterialIcons name="attach-money" size={24} color={COLORS.primary} />
                    <Text style={styles.paymentOptionText}>Cash On Delivery</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'Card' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('Card');
                      setShowPaymentModal(false);
                    }}
                  >
                    <AntDesign name="creditcard" size={24} color={COLORS.primary} />
                    <Text style={styles.paymentOptionText}>Credit/Debit Card</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'PayPal' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('PayPal');
                      setShowPaymentModal(false);
                    }}
                  >
                    <FontAwesome name="paypal" size={24} color={COLORS.primary} />
                    <Text style={styles.paymentOptionText}>PayPal</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'Bank Transfer' && styles.selectedPaymentOption]}
                    onPress={() => {
                      setPaymentMethod('Bank Transfer');
                      setShowPaymentModal(false);
                    }}
                  >
                    <MaterialCommunityIcons name="bank-transfer" size={24} color={COLORS.primary} />
                    <Text style={styles.paymentOptionText}>Bank Transfer</Text>
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
    padding: 20,
  },
  emptyCartText: {
    fontSize: 18,
    color: COLORS.gray,
    marginTop: 10,
    marginBottom: 20,
  },
  browseButton: {
    width: '60%',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent', // Changed from COLORS.error to transparent
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  bookCover: {
    width: 60,
    height: 85,
    borderRadius: 6,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  price: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
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
  disabledButton: {
    backgroundColor: COLORS.lightGray,
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  checkoutContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  priceBreakdownContainer: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  discountValue: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  paymentMethodSelector: {
    marginBottom: 10, // Reduced from 15
    padding: 8, // Reduced from 12
    backgroundColor: COLORS.lightBackground,
    borderRadius: 10,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5, // Reduced from 8
  },
  selectedPaymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  checkoutButton: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: COLORS.lightBackground,
  },
  selectedPaymentOption: {
    backgroundColor: COLORS.lightPrimary,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  paymentOptionText: {
    fontSize: 16,
    marginLeft: 15,
  },
});

export default CartScreen;