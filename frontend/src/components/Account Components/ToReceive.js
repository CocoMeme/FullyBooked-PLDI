import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { api } from '../../services/api';
import baseURL from '../../assets/common/baseurl';

const ToReceive = ({ orders, navigation }) => {
  const [booksDetails, setBooksDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [pendingOrders, setPendingOrders] = useState([]);

  // First useEffect for filtering orders
  useEffect(() => {
    console.log('ToReceive - Orders received:', orders.length);
    setPendingOrders(orders); // Since the orders are already filtered in MyOrdersScreen.js
  }, [orders]);

  // Second useEffect to fetch book details - separate from filtering
  useEffect(() => {
    const fetchBooksDetails = async () => {
      if (pendingOrders.length === 0) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Extract all unique book IDs from all orders
        const bookIds = new Set();
        pendingOrders.forEach(order => {
          order.items.forEach(item => {
            // Make sure we're getting the ID as a string
            if (item.book) {
              // If book is an object with _id, use that, otherwise use the value directly
              const bookId = typeof item.book === 'object' ? item.book._id : item.book;
              console.log('Adding book ID to fetch for pending order:', bookId);
              bookIds.add(bookId);
            }
          });
        });
        
        // Fetch details for each book
        const booksData = {};
        await Promise.all(
          Array.from(bookIds).map(async (bookId) => {
            try {
              // Convert bookId to string to ensure it's a valid parameter
              const id = String(bookId);
              console.log('Fetching book details for pending order, ID:', id);
              
              // Use the configured api instance
              const response = await api.get(`/books/${id}`);
              console.log(`Book ${id} fetch response:`, response.status, response.data?.success);
              
              if (response.data && response.data.book) {
                booksData[id] = response.data.book;
                console.log(`Successfully loaded book: ${response.data.book.title}`);
              } else {
                console.log(`No book data found for ID: ${id}`);
              }
            } catch (error) {
              console.error(`Error fetching details for book ${bookId}:`, error.message);
              console.log('Full error details:', error);
            }
          })
        );
        
        console.log(`Loaded ${Object.keys(booksData).length} books out of ${bookIds.size} IDs`);
        setBooksDetails(booksData);
      } catch (error) {
        console.error('Error fetching books details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooksDetails();
  }, [pendingOrders]);

  // Function to format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Estimate delivery date based on status
  const estimateDeliveryDate = (dateString, status) => {
    const date = new Date(dateString);
    
    // Add days based on status
    if (status === 'Pending') {
      date.setDate(date.getDate() + 7); // Pending orders deliver in ~7 days
    } else if (status === 'Shipped') {
      date.setDate(date.getDate() + 3); // Shipped orders deliver in ~3 days
    }
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Function to render each product in an order
  const renderProductItem = (order, item) => {
    // Get the book ID consistently 
    const bookId = typeof item.book === 'object' ? item.book._id : item.book;
    const bookIdString = String(bookId);
    
    // Look up book details using the string ID
    const bookDetails = booksDetails[bookIdString] || {};
    const bookTitle = bookDetails.title || 'Loading...';
    const bookPrice = bookDetails.price || 0;
    const bookCover = bookDetails.coverImage?.[0] || null;
    
    console.log(`Rendering book: ${bookIdString}, Title: ${bookTitle}, Has cover: ${!!bookCover}`);
    
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
          <Text style={styles.productTitle} numberOfLines={1}>
            {bookTitle}
          </Text>
          <Text style={styles.productQuantity}>
            Qty: {item.quantity} × ₱{bookPrice.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  // Function to render each order item
  const renderOrderItem = ({ item: order }) => {
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>ORDER ID: {order._id.toUpperCase()}</Text>
            <Text style={styles.orderDate}>Ordered on: {formatDate(order.createdAt)}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            order.status === 'Pending' 
              ? styles.pendingBadge 
              : styles.shippedBadge
          ]}>
            <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.deliveryInfoContainer}>
          <Text style={styles.deliveryEstimateLabel}>
            {order.status === 'Pending' ? 'Expected to ship:' : 'Expected delivery:'}
          </Text>
          <Text style={styles.deliveryDate}>
            {estimateDeliveryDate(order.createdAt, order.status)}
          </Text>
        </View>
        
        {order.items.map((item, index) => (
          <React.Fragment key={item._id || index}>
            {renderProductItem(order, item)}
            {index < order.items.length - 1 && <View style={styles.itemSeparator} />}
          </React.Fragment>
        ))}
        
        <View style={styles.orderFooter}>
          <View style={styles.trackContainer}>
            <TouchableOpacity 
              style={styles.trackButton}
              onPress={() => alert('Tracking information will be available here')}
            >
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.totalContainer}>
            <Text style={styles.orderTotalLabel}>Order Total:</Text>
            <Text style={styles.orderTotal}>₱{order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading indicator while fetching book details
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  // Show a message if no pending orders found
  if (!orders || orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No orders to receive at the moment.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={item => item._id}
      renderItem={renderOrderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SIZES.small,
    paddingBottom: SIZES.extra_large,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginTop: SIZES.small,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: SIZES.small,
  },
  orderNumber: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
  },
  orderDate: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.7,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: SIZES.small / 2,
  },
  pendingBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  shippedBadge: {
    backgroundColor: COLORS.info + '20',
  },
  statusText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 2,
    textTransform: 'uppercase',
  },
  deliveryInfoContainer: {
    backgroundColor: COLORS.lightGrey + '50',
    borderRadius: SIZES.small / 2,
    padding: SIZES.small,
    marginBottom: SIZES.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryEstimateLabel: {
    ...FONTS.medium,
    fontSize: SIZES.small,
  },
  deliveryDate: {
    ...FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  productImage: {
    width: 40,
    height: 60,
    borderRadius: 4,
    marginRight: SIZES.small,
  },
  productImagePlaceholder: {
    width: 40,
    height: 60,
    borderRadius: 4,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.small,
  },
  productImageText: {
    ...FONTS.bold,
    color: COLORS.primary,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    ...FONTS.medium,
    fontSize: SIZES.small,
  },
  productQuantity: {
    ...FONTS.regular,
    fontSize: SIZES.small - 1,
    color: COLORS.onBackground,
    opacity: 0.8,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: SIZES.small / 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.small,
    paddingTop: SIZES.small,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  trackContainer: {
    flex: 1,
  },
  trackButton: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SIZES.small,
    paddingVertical: SIZES.small / 2,
    borderRadius: SIZES.small / 2,
    alignItems: 'center',
  },
  trackButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  totalContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  orderTotalLabel: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    marginRight: SIZES.small,
  },
  orderTotal: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.extra_large,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default ToReceive;