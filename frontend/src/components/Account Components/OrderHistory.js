import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

const OrderHistory = ({ orders, navigation }) => {
  if (!orders || orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.noOrdersText}>No orders found.</Text>
      </View>
    );
  }

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format price to show currency symbol
  const formatPrice = (price) => {
    return `₱${price.toFixed(2)}`;
  };

  // Get status color based on order status
  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered':
        return COLORS.success;
      case 'Shipped':
        return COLORS.primary;
      case 'Pending':
        return COLORS.warning;
      case 'Cancelled':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  // Render each order item
  const renderOrderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderIdText}>ORDER ID: {item._id.toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderInfoRow}>
        <MaterialIcons name="date-range" size={16} color={COLORS.gray} />
        <Text style={styles.orderInfoText}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      
      <View style={styles.orderInfoRow}>
        <MaterialIcons name="shopping-bag" size={16} color={COLORS.gray} />
        <Text style={styles.orderInfoText}>
          {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      
      <View style={styles.orderInfoRow}>
        <MaterialIcons name="payments" size={16} color={COLORS.gray} />
        <Text style={styles.orderInfoText}>
          {item.paymentMethod}
        </Text>
      </View>
      
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}</Text>
      </View>
      
      <View style={styles.viewDetailsContainer}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <MaterialIcons name="arrow-forward-ios" size={14} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item._id}
      renderItem={renderOrderItem}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: SIZES.small,
    paddingBottom: SIZES.large,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.medium,
  },
  noOrdersText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.gray,
    textAlign: 'center',
  },
  orderItem: {
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
    alignItems: 'center',
    marginBottom: SIZES.small,
    paddingBottom: SIZES.small,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderIdText: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
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
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  orderInfoText: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    marginLeft: SIZES.small,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.small,
    paddingTop: SIZES.small,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  totalAmount: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SIZES.small,
  },
  viewDetailsText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginRight: 4,
  },
})

export default OrderHistory;