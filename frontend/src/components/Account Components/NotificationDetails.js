/**
 * NotificationDetails Component
 * 
 * This component displays detailed information about a notification, including:
 * - Notification title and message
 * - Order details if the notification is order-related
 * - Order items and summary if available
 * - Status information and navigation to the full order screen
 * 
 * It handles various notification types and displays appropriate UI accordingly.
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { markAsRead } from '../../services/notificationsDB';
import { api, API_URL } from '../../services/api';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import Header from '../Header';

const NotificationDetails = ({ route, navigation }) => {
  const { notification } = route.params;
  const [orderDetails, setOrderDetails] = useState(null);
  const [booksDetails, setBooksDetails] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setupNotification = async () => {
      try {
        if (notification?.id) {
          await markAsRead(notification.id);
        }

        // If it's an order notification, fetch the order details
        if ((notification?.data?.type === 'ORDER_STATUS_UPDATE' || 
             notification?.data?.type === 'ORDER_PLACED') && 
             notification?.data?.orderId) {
          await fetchOrderDetails(notification.data.orderId);
        }
      } catch (error) {
        console.error('Error setting up notification:', error);
        Alert.alert('Error', 'Failed to load notification details.');
      } finally {
        setLoading(false);
      }
    };

    setupNotification();
  }, [notification]);

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoading(true);
      console.log(`Fetching order details for ID: ${orderId}`);
      const response = await api.get(API_URL.GET_ORDER_DETAILS(orderId));
      const orderData = response.data;
      console.log('Order data received:', orderData);

      setOrderDetails(orderData);

      if (orderData?.items?.length) {
        await fetchBooksDetails(orderData.items);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Unable to load order details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksDetails = async (items) => {
    try {
      const bookIds = new Set();
      items.forEach(item => {
        const bookId = typeof item.book === 'object' ? item.book._id : item.book;
        bookIds.add(String(bookId));
      });
      
      console.log(`Fetching details for ${bookIds.size} books`);
      
      const booksData = {};
      await Promise.all(
        Array.from(bookIds).map(async (bookId) => {
          try {
            const response = await api.get(`/books/${bookId}`);
            if (response.data && response.data.book) {
              booksData[bookId] = response.data.book;
              console.log(`Loaded book: ${response.data.book.title}`);
            }
          } catch (error) {
            console.error(`Error fetching book ${bookId}:`, error.message);
          }
        })
      );
      
      console.log(`Successfully loaded ${Object.keys(booksData).length} books`);
      setBooksDetails(booksData);
    } catch (error) {
      console.error('Error fetching books details:', error);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0.00';
    return '₱' + Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  const calculateOrderTotals = () => {
    if (!orderDetails?.items) return { originalTotal: 0, discountedTotal: 0, saved: 0 };

    let originalTotal = 0;
    let discountedTotal = 0;

    orderDetails.items.forEach(item => {
      const bookId = typeof item.book === 'object' ? item.book._id : item.book;
      const bookIdString = String(bookId);
      const book = booksDetails[bookIdString] || {};

      const price = book.price || 0;
      const discountPrice = book.discountPrice || 0;
      const hasDiscount = book.tag === 'Sale' && discountPrice > 0;
      const finalPrice = hasDiscount ? discountPrice : price;

      originalTotal += price * item.quantity;
      discountedTotal += finalPrice * item.quantity;
    });

    return {
      originalTotal,
      discountedTotal,
      saved: originalTotal - discountedTotal,
    };
  };

  const renderBookItem = ({ item }) => {
    const bookId = typeof item.book === 'object' ? item.book._id : item.book;
    const bookIdString = String(bookId);
    const bookDetails = booksDetails[bookIdString] || {};
    const bookTitle = bookDetails.title || 'Book details not available';
    const bookPrice = bookDetails.price || 0;
    const bookDiscountPrice = bookDetails.discountPrice || 0;
    const hasDiscount = bookDetails.tag === 'Sale' && bookDiscountPrice > 0;
    const finalPrice = hasDiscount ? bookDiscountPrice : bookPrice;
    const bookCover = bookDetails.coverImage?.[0] || null;
    
    return (
      <View style={styles.productItem}>
        {bookCover ? (
          <Image 
            source={{ uri: bookCover }} 
            style={styles.productImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImageText}>{bookTitle.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>{bookTitle}</Text>
          {hasDiscount ? (
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>{formatCurrency(bookPrice)}</Text>
              <Text style={styles.discountPrice}>{formatCurrency(bookDiscountPrice)}</Text>
            </View>
          ) : (
            <Text style={styles.productPrice}>{formatCurrency(bookPrice)}</Text>
          )}
          <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
        </View>
        <View style={styles.productTotalContainer}>
          <Text style={styles.productTotalLabel}>Subtotal</Text>
          <Text style={styles.productTotal}>{formatCurrency(finalPrice * item.quantity)}</Text>
        </View>
      </View>
    );
  };

  const renderOrderDetails = () => {
    if (!orderDetails) return null;

    const { originalTotal, discountedTotal, saved } = calculateOrderTotals();
    const notificationType = notification?.data?.type;
    const isOrder = notificationType === 'ORDER_STATUS_UPDATE' || notificationType === 'ORDER_PLACED';
    
    return (
      <View style={styles.orderDetailsContainer}>
        <View style={styles.orderHeaderRow}>
          <Text style={styles.orderId}>
            Order #{orderDetails._id ? orderDetails._id.substring(0, 8).toUpperCase() : 'N/A'}
          </Text>
          <TouchableOpacity 
            style={styles.viewOrderButton}
            onPress={() => navigation.navigate('Account', {
              screen: 'OrderDetails',
              params: { orderId: orderDetails._id }
            })}
          >
            <Text style={styles.viewOrderText}>View Full Order</Text>
            <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.orderStatusRow}>
          <Text style={styles.orderStatusLabel}>Status:</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(orderDetails.status) + '20' }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: getStatusColor(orderDetails.status) }
            ]}>
              {orderDetails.status ? orderDetails.status.toUpperCase() : 'PENDING'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.dateInfo}>Order Date: {formatDate(orderDetails.createdAt)}</Text>
        
        {isOrder && orderDetails.items && orderDetails.items.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Order Items</Text>
            <FlatList
              data={orderDetails.items}
              keyExtractor={(item, index) => item._id || index.toString()}
              renderItem={renderBookItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              style={styles.itemsList}
            />
            
            <View style={styles.orderSummary}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(originalTotal)}</Text>
              </View>
              
              {saved > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.discountLabel}>Discount Savings</Text>
                  <Text style={styles.discountValue}>-{formatCurrency(saved)}</Text>
                </View>
              )}
              
              <View style={styles.separatorFull} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(discountedTotal)}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };
  
  const getStatusColor = (status) => {
    if (!status) return COLORS.primary;
    
    switch(status.toLowerCase()) {
      case 'delivered':
        return COLORS.success;
      case 'processing':
      case 'pending':
        return COLORS.warning;
      case 'shipped':
        return COLORS.info;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
        <Header title="Notification Details" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left', 'bottom']}>
      <Header title="Notification Details" showBackButton={true} onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.notificationTitle}>{notification?.title}</Text>
          <Text style={styles.notificationBody}>{notification?.body}</Text>
          
          {(notification?.data?.type === 'ORDER_STATUS_UPDATE' || 
            notification?.data?.type === 'ORDER_PLACED') && renderOrderDetails()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.medium,
  },
  notificationTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    marginBottom: SIZES.small,
  },
  notificationBody: {
    fontSize: SIZES.medium,
    marginBottom: SIZES.medium,
  },
  orderDetailsContainer: {
    marginTop: SIZES.medium,
    padding: SIZES.medium,
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  orderId: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  viewOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewOrderText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginRight: 4,
  },
  orderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  orderStatusLabel: {
    fontSize: SIZES.medium,
    marginRight: SIZES.small,
  },
  statusBadge: {
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: SIZES.small / 2,
  },
  statusText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 2,
  },
  dateInfo: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginTop: SIZES.medium,
    marginBottom: SIZES.small,
  },
  itemsList: {
    marginBottom: SIZES.medium,
  },
  productItem: {
    flexDirection: 'row',
    paddingVertical: SIZES.small,
  },
  productImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    marginRight: SIZES.small,
  },
  productImagePlaceholder: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.small,
  },
  productImageText: {
    ...FONTS.bold,
    color: COLORS.primary,
    fontSize: SIZES.medium,
  },
  productInfo: {
    flex: 1,
    marginRight: SIZES.small,
    justifyContent: 'center',
  },
  productTitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    marginBottom: 2,
  },
  productPrice: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    marginBottom: 2,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    textDecorationLine: 'line-through',
    marginRight: SIZES.small / 2,
  },
  discountPrice: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.success,
  },
  productQuantity: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
  },
  productTotalContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  productTotalLabel: {
    ...FONTS.regular,
    fontSize: SIZES.small - 1,
    color: COLORS.onBackground,
    marginBottom: 2,
  },
  productTotal: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
  },
  orderSummary: {
    marginTop: SIZES.small,
  },
  summaryTitle: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    marginBottom: SIZES.small,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.small / 2,
  },
  summaryLabel: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  summaryValue: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
  discountLabel: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
    color: COLORS.success,
  },
  discountValue: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.success,
  },
  totalLabel: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
  },
  totalValue: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  separatorFull: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: SIZES.small,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.small,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
});

export default NotificationDetails;