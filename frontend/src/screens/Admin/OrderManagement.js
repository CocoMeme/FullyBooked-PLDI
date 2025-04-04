import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  FlatList,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { fetchAllOrders, updateOrderStatus } from '../../redux/actions/orderActions';

const OrderManagement = ({ navigation }) => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      await dispatch(fetchAllOrders());
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'You need to be logged in to access this feature');
      } else if (error.response?.status === 403) {
        Alert.alert('Permission Error', 'You do not have permission to view orders. Admin access required.');
      } else {
        Alert.alert('Error', 'Failed to load orders. Please try again later.');
      }
    }
  };

  const handleUpdateStatus = (orderId) => {
    Alert.alert(
      'Update Order Status',
      'Select new status',
      [
        { text: 'Pending', onPress: () => handleStatusChange(orderId, 'Pending') },
        { text: 'Shipped', onPress: () => handleStatusChange(orderId, 'Shipped') },
        { text: 'Delivered', onPress: () => handleStatusChange(orderId, 'Delivered') },
        { text: 'Cancelled', onPress: () => handleStatusChange(orderId, 'Cancelled') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus(orderId, newStatus));
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50'; // Green
      case 'processing':
        return '#2196F3'; // Blue
      case 'pending':
        return '#FF9800'; // Orange
      case 'cancelled':
        return '#F44336'; // Red
      default:
        return COLORS.secondary;
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber || 'N/A'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Customer:</Text>
          <Text style={styles.detailValue}>{item.customerUsername || 'Unknown'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{item.customerEmail || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>
            {item.items.map((orderItem) => `${orderItem.book.title} (x${orderItem.quantity})`).join(', ')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${item.totalAmount ? item.totalAmount.toFixed(2) : '0.00'}</Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => Alert.alert('Info', 'View order details feature coming soon')}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleUpdateStatus(item._id)}
        >
          <Ionicons name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>Status</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Order Management" 
        showBackButton={true}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: SIZES.medium,
    paddingBottom: 100,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: SIZES.medium,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNumber: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SIZES.base,
  },
  statusText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 2,
    color: '#fff',
  },
  orderDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    width: 70,
    color: COLORS.onBackground,
    opacity: 0.7,
  },
  detailValue: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    flex: 1,
    color: COLORS.onBackground,
  },
  totalAmount: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  viewButton: {
    backgroundColor: COLORS.secondary,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: '#fff',
  },
  emptyContainer: {
    padding: SIZES.extraLarge,
    alignItems: 'center',
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    opacity: 0.6,
  },
});

export default OrderManagement;