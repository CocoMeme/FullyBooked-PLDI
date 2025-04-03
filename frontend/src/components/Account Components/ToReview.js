import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const ToReview = ({ orders, navigation }) => {
  // Filter orders with the status "delivered"
  const deliveredOrders = orders.filter(order => order.status === 'delivered');

  // Function to format date to a readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to handle review button press
  const handleReviewPress = (order, product) => {
    // Navigate to the review screen with product and order information
    navigation.navigate('WriteReview', { 
      product,
      orderId: order.id,
      orderNumber: order.orderNumber
    });
  };

  // Function to render each order item
  const renderOrderItem = ({ item: order }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.orderDate}>Delivered on: {formatDate(order.date)}</Text>
          </View>
          <View style={styles.deliveredBadge}>
            <Text style={styles.statusText}>DELIVERED</Text>
          </View>
        </View>
        
        <Text style={styles.reviewPrompt}>Please rate your purchases:</Text>
        
        <FlatList
          data={order.items}
          keyExtractor={(product) => product.id}
          renderItem={({ item: product }) => (
            <View style={styles.productContainer}>
              <View style={styles.productInfo}>
                <View style={styles.productImagePlaceholder}>
                  <Text style={styles.productImageText}>{product.title.charAt(0)}</Text>
                </View>
                <View style={styles.productDetails}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {product.title}
                  </Text>
                  <Text style={styles.productQuantity}>
                    Qty: {product.quantity} × ${product.price.toFixed(2)}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.reviewButton}
                onPress={() => handleReviewPress(order, product)}
              >
                <Text style={styles.reviewButtonText}>Rate</Text>
              </TouchableOpacity>
            </View>
          )}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    );
  };

  // Show a message if no delivered items to review
  if (deliveredOrders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You don't have any delivered items to review.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={deliveredOrders}
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
  deliveredBadge: {
    paddingHorizontal: SIZES.small,
    paddingVertical: 4,
    borderRadius: SIZES.small / 2,
    backgroundColor: COLORS.success + '20',
  },
  statusText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 2,
    textTransform: 'uppercase',
  },
  reviewPrompt: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    marginBottom: SIZES.small,
  },
  productContainer: {
    marginVertical: SIZES.small,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small,
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
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
  productQuantity: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.8,
  },
  reviewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.small / 2,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.small / 2,
    alignSelf: 'flex-start',
  },
  reviewButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: SIZES.small,
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

export default ToReview;