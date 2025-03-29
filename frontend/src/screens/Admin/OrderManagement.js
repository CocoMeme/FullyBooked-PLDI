import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import API_URL from '../../services/api';

const OrderManagement = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // This would be replaced with an actual API call in production
      // const response = await axios.get(API_URL.GET_ALL_ORDERS);

      // Dummy data for demonstration
      const dummyOrders = [
        {
          _id: '1',
          orderNumber: 'ORD-001-2025',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          date: '2025-03-15T14:30:00.000Z',
          status: 'delivered',
          totalAmount: 85.97,
          items: 3
        },
        {
          _id: '2',
          orderNumber: 'ORD-002-2025',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          date: '2025-03-20T09:45:00.000Z',
          status: 'processing',
          totalAmount: 42.50,
          items: 2
        },
        {
          _id: '3',
          orderNumber: 'ORD-003-2025',
          customerName: 'Mike Johnson',
          customerEmail: 'mike@example.com',
          date: '2025-03-22T16:20:00.000Z',
          status: 'pending',
          totalAmount: 124.75,
          items: 5
        },
        {
          _id: '4',
          orderNumber: 'ORD-004-2025',
          customerName: 'Sarah Williams',
          customerEmail: 'sarah@example.com',
          date: '2025-03-25T11:10:00.000Z',
          status: 'cancelled',
          totalAmount: 67.30,
          items: 2
        }
      ];

      setOrders(dummyOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
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

  const handleUpdateStatus = (orderId) => {
    Alert.alert(
      'Update Order Status',
      'Select new status',
      [
        { text: 'Pending', onPress: () => updateOrderStatus(orderId, 'pending') },
        { text: 'Processing', onPress: () => updateOrderStatus(orderId, 'processing') },
        { text: 'Delivered', onPress: () => updateOrderStatus(orderId, 'delivered') },
        { text: 'Cancelled', onPress: () => updateOrderStatus(orderId, 'cancelled') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const updateOrderStatus = (orderId, newStatus) => {
    try {
      // In a real app, you would call API to update the status
      // await axios.put(API_URL.UPDATE_ORDER_STATUS(orderId), { status: newStatus });
      
      // For now, we'll just update it in the local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      Alert.alert('Success', 'Order status updated successfully');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Customer:</Text>
          <Text style={styles.detailValue}>{item.customerName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{item.customerEmail}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Items:</Text>
          <Text style={styles.detailValue}>{item.items}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total:</Text>
          <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
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
    paddingBottom: 100, // Extra padding at the bottom
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