import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const OrderHistory = ({ orders, navigation }) => {
  // Function to format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate total order amount
  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Function to get status badge style
  const getStatusBadgeStyle = (status) => {
    switch(status) {
      case 'delivered':
        return styles.deliveredBadge;
      case 'shipped':
        return styles.shippedBadge;
      case 'processing':
        return styles.processingBadge;
      case 'cancelled':
        return styles.cancelledBadge;
      default:
        return styles.processingBadge;
    }
  };

  // Function to render each order item
  const renderOrderItem = ({ item }) => {
    // Calculate total order amount
    const orderTotal = calculateTotal(item.items);
    
    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { order: item })}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber || 'Order #'}</Text>
            <Text style={styles.orderDate}>Placed: {formatDate(item.createdAt)}</Text>
            {item.estimatedDeliveryDate && (
              <Text style={styles.deliveryDate}>
                Est. Delivery: {formatDate(item.estimatedDeliveryDate)}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <FlatList
          data={item.items}
          keyExtractor={(product, index) => product._id ? product._id : `fallback-key-${index}`}
          renderItem={({ item: product }) => (
            <View style={styles.productItem}>
              <View style={styles.productImagePlaceholder}>
                <Text style={styles.productImageText}>
                  {product.book && typeof product.book === 'object' 
                    ? product.book.title?.charAt(0) || 'B'
                    : 'B'}
                </Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {product.book && typeof product.book === 'object' 
                    ? product.book.title 
                    : 'Book'}
                </Text>
                <Text style={styles.productQuantity}>
                  Qty: {product.quantity} × ${product.price?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </View>
          )}
          scrollEnabled={false}
        />
        
        {item.shippedAt && (
          <Text style={styles.shippingInfo}>
            Shipped: {formatDate(item.shippedAt)}
          </Text>
        )}
        
        {item.deliveredAt && (
          <Text style={styles.shippingInfo}>
            Delivered: {formatDate(item.deliveredAt)}
          </Text>
        )}
        
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotalLabel}>Order Total:</Text>
          <Text style={styles.orderTotal}>${orderTotal.toFixed(2)}</Text>
        </View>
        
        <View style={styles.paymentMethod}>
          <Text style={styles.paymentMethodLabel}>Payment Method:</Text>
          <Text style={styles.paymentMethodValue}>{item.paymentMethod}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Show a message if no orders found
  if (!orders || orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={item => item._id || item.id}
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
  deliveryDate: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.primary,
    opacity: 0.9,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: SIZES.small / 2,
  },
  deliveredBadge: {
    backgroundColor: COLORS.success + '20',
  },
  processingBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  shippedBadge: {
    backgroundColor: COLORS.info + '20',
  },
  cancelledBadge: {
    backgroundColor: COLORS.error + '20',
  },
  statusText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 2,
    textTransform: 'uppercase',
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
  shippingInfo: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.8,
    marginTop: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SIZES.small,
    paddingTop: SIZES.small,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
  paymentMethod: {
    flexDirection: 'row',
    marginTop: SIZES.small / 2,
  },
  paymentMethodLabel: {
    ...FONTS.regular,
    fontSize: SIZES.small - 1,
    color: COLORS.onBackground,
    opacity: 0.7,
    marginRight: SIZES.small / 2,
  },
  paymentMethodValue: {
    ...FONTS.medium,
    fontSize: SIZES.small - 1,
    color: COLORS.onBackground,
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

export default OrderHistory;