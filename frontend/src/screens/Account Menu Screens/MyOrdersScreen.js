import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import Header from '../../components/Header';
import AuthGlobal from '../../context/store/AuthGlobal';
import OrderHistory from '../../components/Account Components/OrderHistory';
import ToReceive from '../../components/Account Components/ToReceive';
import ToReview from '../../components/Account Components/ToReview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';

const MyOrdersScreen = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const [activeTab, setActiveTab] = useState('history');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch user orders when component mounts
    fetchUserOrders();
    
    // Add a listener to refresh orders when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserOrders();
    });
    
    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      
      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem('jwt');
      
      if (!token) {
        console.log('No authentication token found');
        // If no token, we can show an empty state or basic message
        setOrders([]);
        return;
      }
      
      // Create request configuration with authorization header
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      console.log('Fetching orders with token:', token.substring(0, 10) + '...');
      
      // Make the API call to fetch user orders
      const response = await axios.get(
        `${baseURL}orders/user-orders`,
        config
      );
      
      console.log('Orders API response status:', response.status);
      console.log('Orders response data:', response.data);
      
      if (response.status === 200) {
        // If the response is an empty array, set orders to empty and return
        if (Array.isArray(response.data) && response.data.length === 0) {
          console.log('No orders found for user');
          setOrders([]);
          return;
        }
        
        // Transform the data to match the expected structure
        const formattedOrders = Array.isArray(response.data) ? response.data.map(order => ({
          id: order._id,
          _id: order._id, // Include both id and _id for consistency
          orderNumber: order.orderNumber || `ORD-${Math.floor(Math.random() * 100000)}`,
          date: order.createdAt,
          createdAt: order.createdAt,
          status: (order.status || 'processing').toLowerCase(),
          items: Array.isArray(order.items) ? order.items.map(item => ({
            id: item._id,
            book: item.book,
            title: item.book?.title || 'Book',
            quantity: item.quantity || 1,
            price: item.price || 0,
          })) : [],
          paymentMethod: order.paymentMethod || 'Not specified',
          total: order.totalAmount || 
            (Array.isArray(order.items) ? 
              order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0) : 0),
          reviewed: Boolean(order.reviewed),
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
        })) : [];
        
        console.log(`Formatted ${formattedOrders.length} orders`);
        setOrders(formattedOrders);
      } else {
        // Handle unexpected status codes
        console.error('Unexpected response status:', response.status);
        Alert.alert('Error', 'Failed to fetch orders. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to view your orders.');
        // You could navigate to login screen here
      } else if (error.response?.status === 404) {
        console.error('API endpoint not found. Check your routes configuration.');
        Alert.alert('Error', 'Order history service is currently unavailable. Please try again later.');
      } else {
        Alert.alert('Error', 'Failed to fetch your orders. Please try again later.');
      }
      
      // Set empty orders array in case of error
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'history':
        return <OrderHistory orders={orders} navigation={navigation} />;
      case 'toReceive':
        // Filter orders that are not delivered yet (processing or shipped)
        const pendingOrders = orders.filter(order => 
          order.status === 'processing' || order.status === 'shipped'
        );
        return <ToReceive orders={pendingOrders} navigation={navigation} />;
      case 'toReview':
        // Filter delivered orders that haven't been reviewed
        const toReviewOrders = orders.filter(order => 
          order.status === 'delivered' && !order.reviewed
        );
        return <ToReview orders={toReviewOrders} navigation={navigation} />;
      default:
        return <OrderHistory orders={orders} navigation={navigation} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Orders" showBackButton={true} onBackPress={() => navigation.goBack()} />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'history' && styles.activeTabButton]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'toReceive' && styles.activeTabButton]}
          onPress={() => setActiveTab('toReceive')}
        >
          <Text style={[styles.tabText, activeTab === 'toReceive' && styles.activeTabText]}>
            To Receive
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'toReview' && styles.activeTabButton]}
          onPress={() => setActiveTab('toReview')}
        >
          <Text style={[styles.tabText, activeTab === 'toReview' && styles.activeTabText]}>
            To Review
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  activeTabText: {
    color: COLORS.primary,
  },
  contentContainer: {
    flexGrow: 1,
    padding: SIZES.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SIZES.xxxLarge,
  },
});

export default MyOrdersScreen;