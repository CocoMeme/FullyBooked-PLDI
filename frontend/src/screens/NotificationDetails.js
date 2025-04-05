import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { markAsRead } from '../../services/notificationsDB';
import { api, API_URL } from '../../services/api';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

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

        if (notification?.data?.type === 'ORDER_STATUS_UPDATE' && notification?.data?.orderId) {
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
      const response = await api.get(API_URL.GET_ORDER_DETAILS(orderId));
      const orderData = response.data;

      setOrderDetails(orderData);

      if (orderData?.items?.length) {
        const bookIds = orderData.items.map(item => item.book._id || item.book);
        const booksResponse = await Promise.all(
          bookIds.map(async (id) => {
            const bookResponse = await api.get(`/books/${id}`);
            return { id, data: bookResponse.data.book };
          })
        );

        const booksMap = booksResponse.reduce((acc, { id, data }) => {
          acc[id] = data;
          return acc;
        }, {});

        setBooksDetails(booksMap);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Unable to load order details.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `₱${Number(amount).toFixed(2)}`;

  const calculateOrderTotals = () => {
    if (!orderDetails?.items) return { originalTotal: 0, discountedTotal: 0, saved: 0 };

    let originalTotal = 0;
    let discountedTotal = 0;

    orderDetails.items.forEach(item => {
      const book = booksDetails[item.book._id || item.book] || {};
      const price = book.price || 0;
      const discountPrice = book.discountPrice || 0;
      const finalPrice = book.tag === 'Sale' && discountPrice > 0 ? discountPrice : price;

      originalTotal += price * item.quantity;
      discountedTotal += finalPrice * item.quantity;
    });

    return {
      originalTotal,
      discountedTotal,
      saved: originalTotal - discountedTotal,
    };
  };

  const renderOrderDetails = () => {
    if (!orderDetails) return null;

    const { originalTotal, discountedTotal, saved } = calculateOrderTotals();

    return (
      <View style={styles.orderDetailsContainer}>
        <Text style={styles.orderId}>Order #{orderDetails._id}</Text>
        <Text style={styles.orderStatus}>Status: {orderDetails.status}</Text>
        <Text style={styles.orderTotal}>Original Total: {formatCurrency(originalTotal)}</Text>
        <Text style={styles.orderTotal}>Discounted Total: {formatCurrency(discountedTotal)}</Text>
        <Text style={styles.orderTotal}>You Saved: {formatCurrency(saved)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Details</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.notificationTitle}>{notification?.title}</Text>
        <Text style={styles.notificationBody}>{notification?.body}</Text>
        {notification?.data?.type === 'ORDER_STATUS_UPDATE' && renderOrderDetails()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.medium,
  },
  headerTitle: {
    marginLeft: SIZES.small,
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.primary,
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
  orderId: {
    fontSize: SIZES.medium,
    fontWeight: 'bold',
    marginBottom: SIZES.small,
  },
  orderStatus: {
    fontSize: SIZES.medium,
    marginBottom: SIZES.small,
  },
  orderTotal: {
    fontSize: SIZES.medium,
    marginBottom: SIZES.small / 2,
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