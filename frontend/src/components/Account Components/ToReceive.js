import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const ToReceive = ({ orders, navigation }) => {
  // Function to format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Estimate delivery date (just adding days to the order date for demo)
  const estimateDeliveryDate = (dateString, status) => {
    const date = new Date(dateString);
    
    // Add days based on status
    if (status === 'processing') {
      date.setDate(date.getDate() + 7); // Processing orders deliver in ~7 days
    } else if (status === 'shipped') {
      date.setDate(date.getDate() + 3); // Shipped orders deliver in ~3 days
    }
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Function to render each order item
  const renderOrderItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { order: item })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.orderDate}>Ordered on: {formatDate(item.date)}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            item.status === 'processing' 
              ? styles.processingBadge 
              : styles.shippedBadge
          ]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.deliveryInfoContainer}>
          <Text style={styles.deliveryEstimateLabel}>
            {item.status === 'processing' ? 'Expected to ship:' : 'Expected delivery:'}
          </Text>
          <Text style={styles.deliveryDate}>
            {estimateDeliveryDate(item.date, item.status)}
          </Text>
        </View>
        
        <FlatList
          data={item.items}
          keyExtractor={(product) => product.id}
          renderItem={({ item: product }) => (
            <View style={styles.productItem}>
              <View style={styles.productImagePlaceholder}>
                <Text style={styles.productImageText}>{product.title.charAt(0)}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.title}
                </Text>
                <Text style={styles.productQuantity}>
                  Qty: {product.quantity} × ${product.price.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
        
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
            <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      keyExtractor={item => item.id}
      renderItem={renderOrderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: SIZES.extra_large,
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
  processingBadge: {
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
  productImagePlaceholder: {
    width: 40,
    height: 40,
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