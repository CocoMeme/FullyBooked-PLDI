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
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartScreen = ({ navigation }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    loadCartItems();
    
    // Refresh cart when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadCartItems();
    });

    return unsubscribe;
  }, [navigation]);

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const cartData = await AsyncStorage.getItem('cart');
      let parsedCart = cartData ? JSON.parse(cartData) : [];
      setCartItems(parsedCart);
      
      // Calculate total
      const total = parsedCart.reduce((sum, item) => {
        const itemPrice = item.discountPrice || item.price;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading cart items:', error);
      Alert.alert('Error', 'Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, action) => {
    try {
      const updatedCart = cartItems.map(item => {
        if (item._id === itemId) {
          if (action === 'increase') {
            return { ...item, quantity: item.quantity + 1 };
          } else if (action === 'decrease' && item.quantity > 1) {
            return { ...item, quantity: item.quantity - 1 };
          }
        }
        return item;
      });
      
      setCartItems(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
      
      // Recalculate total
      const total = updatedCart.reduce((sum, item) => {
        const itemPrice = item.discountPrice || item.price;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      setTotalAmount(total);
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      const updatedCart = cartItems.filter(item => item._id !== itemId);
      setCartItems(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
      
      // Recalculate total
      const total = updatedCart.reduce((sum, item) => {
        const itemPrice = item.discountPrice || item.price;
        return sum + (itemPrice * item.quantity);
      }, 0);
      
      setTotalAmount(total);
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert('Error', 'Failed to remove item');
    }
  };

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

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before checking out');
      return;
    }
    
    // Navigate to checkout screen
    navigation.navigate('Checkout', { cartItems, totalAmount });
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => Alert.alert(
              'Clear Cart',
              'Are you sure you want to clear your cart?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCart }
              ]
            )}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
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
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          
          <View style={styles.checkoutContainer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            <Button 
              title="Proceed to Checkout" 
              onPress={handleCheckout}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.medium,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
  },
  clearButton: {
    padding: SIZES.small,
  },
  clearButtonText: {
    ...FONTS.medium,
    color: COLORS.error,
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