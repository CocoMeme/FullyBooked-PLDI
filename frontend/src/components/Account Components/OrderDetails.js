import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Alert,
  Image
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import Header from '../Header';
import { api, API_URL } from '../../services/api';
import axios from 'axios';

const OrderDetails = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState(null);
  const [booksDetails, setBooksDetails] = useState({});

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
  
      const response = await api.get(API_URL.GET_ORDER_DETAILS(orderId));
      console.log('Order details fetched:', response.data); 
      
      const orderData = response.data;
      setOrderDetails(orderData);
      
      if (orderData && orderData.items && orderData.items.length) {
        await fetchBooksDetails(orderData.items);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Unable to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBooksDetails = async (items) => {
    try {
      const bookIds = new Set();
      items.forEach(item => {
        if (item.book) {
          const bookId = typeof item.book === 'object' ? item.book._id : item.book;
          bookIds.add(bookId);
        }
      });
      
      const booksData = {};
      await Promise.all(
        Array.from(bookIds).map(async (bookId) => {
          try {
            const id = String(bookId);
            console.log('Fetching book details, ID:', id);
            
            const response = await api.get(`/books/${id}`);
            
            if (response.data && response.data.book) {
              booksData[id] = response.data.book;
              console.log(`Successfully loaded book: ${response.data.book.title}`);
            } else {
              console.log(`No book data found for ID: ${id}`);
            }
          } catch (error) {
            console.error(`Error fetching details for book ${bookId}:`, error.message);
          }
        })
      );
      
      console.log(`Loaded ${Object.keys(booksData).length} books out of ${bookIds.size} IDs`);
      setBooksDetails(booksData);
    } catch (error) {
      console.error('Error fetching books details:', error);
    }
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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₱0.00';
    return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
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

  const getEstimatedDelivery = (date, status) => {
    if (!date) return 'N/A';
    
    try {
      const orderDate = new Date(date);
      let deliveryDate = new Date(orderDate);
      
      if (!status) return formatDate(deliveryDate);
      
      switch(status.toLowerCase()) {
        case 'processing':
        case 'pending':
          deliveryDate.setDate(orderDate.getDate() + 7);
          break;
        case 'shipped':
          deliveryDate.setDate(orderDate.getDate() + 3);
          break;
        case 'delivered':
          deliveryDate.setDate(orderDate.getDate() + 5);
          break;
      }
      
      return formatDate(deliveryDate);
    } catch (error) {
      console.error('Error calculating estimated delivery:', error);
      return 'N/A';
    }
  };

  const calculateOrderTotal = () => {
    if (!orderDetails || !orderDetails.items) return 0;
    
    let total = 0;
    orderDetails.items.forEach(item => {
      const bookId = typeof item.book === 'object' ? item.book._id : item.book;
      const bookIdString = String(bookId);
      const bookDetails = booksDetails[bookIdString] || {};
      
      const bookPrice = bookDetails.price || 0;
      const bookDiscountPrice = bookDetails.discountPrice || 0;
      const hasDiscount = bookDetails.tag === 'Sale' && bookDiscountPrice > 0;
      const finalPrice = hasDiscount ? bookDiscountPrice : bookPrice;
      
      total += finalPrice * item.quantity;
    });
    
    return total;
  };

  const calculateOrderTotals = () => {
    if (!orderDetails || !orderDetails.items) {
      return { originalTotal: 0, discountedTotal: 0, saved: 0 };
    }
    
    let originalTotal = 0;
    let discountedTotal = 0;
    
    orderDetails.items.forEach(item => {
      const bookId = typeof item.book === 'object' ? item.book._id : item.book;
      const bookIdString = String(bookId);
      const bookDetails = booksDetails[bookIdString] || {};
      
      const bookPrice = bookDetails.price || 0;
      const bookDiscountPrice = bookDetails.discountPrice || 0;
      const hasDiscount = bookDetails.tag === 'Sale' && bookDiscountPrice > 0;
      const finalPrice = hasDiscount ? bookDiscountPrice : bookPrice;
      
      // Add to original total (always use original price)
      originalTotal += bookPrice * item.quantity;
      
      // Add to discounted total (use discounted price if available)
      discountedTotal += finalPrice * item.quantity;
    });
    
    const saved = originalTotal - discountedTotal;
    
    return { originalTotal, discountedTotal, saved };
  };

  const renderBookItem = ({ item }) => {
    // Get the book ID consistently 
    const bookId = typeof item.book === 'object' ? item.book._id : item.book;
    const bookIdString = String(bookId);
    
    // Look up book details using the string ID
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
          <Text style={styles.productTitle}>{bookTitle}</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Details" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Details" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order details not found.</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchOrderDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Order Details" showBackButton={true} onBackPress={() => navigation.goBack()} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.orderInfoCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>ORDER #{orderDetails._id ? orderDetails._id.substring(0, 8).toUpperCase() : 'N/A'}</Text>
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
          
          <View style={styles.orderDateContainer}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Order Date:</Text>
              <Text style={styles.dateValue}>{formatDate(orderDetails.createdAt)}</Text>
            </View>
            
            {orderDetails.status !== 'Cancelled' && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>
                  {orderDetails.status === 'Delivered' ? 'Delivered On:' : 'Est. Delivery:'}
                </Text>
                <Text style={styles.dateValue}>
                  {getEstimatedDelivery(orderDetails.createdAt, orderDetails.status)}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <FlatList
            data={orderDetails.items}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderBookItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {/* Calculate all totals once for efficiency */}
          {(() => {
            const { originalTotal, discountedTotal, saved } = calculateOrderTotals();
            const hasSavings = saved > 0;
            
            return (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal (Original)</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(originalTotal)}</Text>
                </View>
                
                {hasSavings && (
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
                
                {hasSavings && (
                  <View style={styles.savingsContainer}>
                    <Text style={styles.savingsText}>You saved {formatCurrency(saved)} on this order!</Text>
                  </View>
                )}
              </>
            );
          })()}
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
  scrollContent: {
    padding: SIZES.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    marginTop: SIZES.small,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  errorText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    marginBottom: SIZES.medium,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.small,
    borderRadius: SIZES.small,
  },
  retryButtonText: {
    ...FONTS.medium,
    color: '#fff',
  },
  orderInfoCard: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  orderId: {
    ...FONTS.bold,
    fontSize: SIZES.large,
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
  orderDateContainer: {
    marginTop: SIZES.small,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: SIZES.small / 2,
  },
  dateLabel: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    width: 110,
  },
  dateValue: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
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
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  separatorFull: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: SIZES.small,
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
  totalLabel: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
  },
  totalValue: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
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
  savingsContainer: {
    marginTop: SIZES.small,
  },
  savingsText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.success,
  },
  actionsContainer: {
    marginVertical: SIZES.medium,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  actionButtonText: {
    ...FONTS.medium,
    color: COLORS.primary,
  },
  trackButton: {
    backgroundColor: COLORS.primary + '10',
  },
  trackButtonText: {
    ...FONTS.medium,
    color: COLORS.primary,
  },
  supportButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  supportButtonText: {
    ...FONTS.medium,
    color: COLORS.onBackground,
  },
});

export default OrderDetails;