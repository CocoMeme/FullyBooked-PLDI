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
  Alert
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import Header from '../Header';

const OrderDetails = ({ route, navigation }) => {
  const { order } = route.params;
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    fetchOrderDetails();
  }, []);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch detailed order information from your API
      // For now, we'll just use the order data passed in via route params
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setOrderDetails(order);
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Unable to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to get the color based on order status
  const getStatusColor = (status) => {
    switch(status) {
      case 'delivered':
        return COLORS.success;
      case 'processing':
        return COLORS.warning;
      case 'shipped':
        return COLORS.info;
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  // Calculate estimated delivery date
  const getEstimatedDelivery = (date, status) => {
    const orderDate = new Date(date);
    let deliveryDate = new Date(orderDate);
    
    if (status === 'processing') {
      deliveryDate.setDate(orderDate.getDate() + 7);
    } else if (status === 'shipped') {
      deliveryDate.setDate(orderDate.getDate() + 3);
    } else if (status === 'delivered') {
      // For delivered orders, just return the order date + 5 days as estimated delivery
      deliveryDate.setDate(orderDate.getDate() + 5);
    }
    
    return formatDate(deliveryDate);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Details" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
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
            <Text style={styles.orderId}>Order #{orderDetails.orderNumber}</Text>
            <View style={[
              styles.statusBadge, 
              { backgroundColor: getStatusColor(orderDetails.status) + '20' }
            ]}>
              <Text style={[
                styles.statusText, 
                { color: getStatusColor(orderDetails.status) }
              ]}>
                {orderDetails.status.toUpperCase()}
              </Text>
            </View>
          </View>
          
          <View style={styles.orderDateContainer}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Order Date:</Text>
              <Text style={styles.dateValue}>{formatDate(orderDetails.date)}</Text>
            </View>
            
            {orderDetails.status !== 'cancelled' && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>
                  {orderDetails.status === 'delivered' ? 'Delivered On:' : 'Est. Delivery:'}
                </Text>
                <Text style={styles.dateValue}>
                  {getEstimatedDelivery(orderDetails.date, orderDetails.status)}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <FlatList
            data={orderDetails.items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.productItem}>
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.productImageText}>{item.title.charAt(0)}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle}>{item.title}</Text>
                  <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
                </View>
                <View style={styles.productTotalContainer}>
                  <Text style={styles.productTotalLabel}>Subtotal</Text>
                  <Text style={styles.productTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              </View>
            )}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
        
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${orderDetails.total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>Free</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>Included</Text>
          </View>
          <View style={styles.separatorFull} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${orderDetails.total.toFixed(2)}</Text>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          {orderDetails.status === 'delivered' && !orderDetails.reviewed && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('WriteReview', { 
                order: orderDetails
              })}
            >
              <Text style={styles.actionButtonText}>Write a Review</Text>
            </TouchableOpacity>
          )}
          
          {(orderDetails.status === 'processing' || orderDetails.status === 'shipped') && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.trackButton]}
              onPress={() => Alert.alert('Coming Soon', 'Order tracking will be available in the next update.')}
            >
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.supportButton]}
            onPress={() => Alert.alert('Coming Soon', 'Order support will be available in the next update.')}
          >
            <Text style={styles.supportButtonText}>Get Support</Text>
          </TouchableOpacity>
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
  productImagePlaceholder: {
    width: 50,
    height: 50,
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