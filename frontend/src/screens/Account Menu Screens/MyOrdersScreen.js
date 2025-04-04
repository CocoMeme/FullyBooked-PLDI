import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
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
        setOrders([]);
        Alert.alert('Error', 'You are not logged in. Please log in to view your orders.');
        navigation.navigate('Login'); // Redirect to login if no token
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
      const response = await axios.get(`${baseURL}orders/my-orders`, config);
  
      if (response.status === 200) {
        const ordersData = response.data.orders;
  
        // Transform the data to match the expected structure
        const formattedOrders = ordersData.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber || `ORD-${Math.floor(Math.random() * 100000)}`,
          date: order.createdAt,
          status: (order.status || 'processing').toLowerCase(),
          items: Array.isArray(order.items) ? order.items.map(item => ({
            id: item._id,
            title: item.book?.title || 'Book',
            quantity: item.quantity || 1,
            price: item.price || 0,
          })) : [],
          total: order.totalAmount || 0,
        }));
  
        setOrders(formattedOrders);
      } else {
        Alert.alert('Error', 'Failed to fetch orders. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error.response?.data || error.message);
  
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to view your orders.');
        navigation.navigate('Login'); // Redirect to login if session expired
      } else {
        Alert.alert('Error', 'Failed to fetch your orders. Please try again later.');
      }
  
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
      
      {/* Replace ScrollView with View */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
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
    borderRadius: 8,
    margin: SIZES.small,
    padding: SIZES.small,
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
  tabButton: {
    flex: 1,
    paddingVertical: SIZES.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: COLORS.lightPrimary,
  },
  activeTabButton: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: SIZES.small,
    padding: SIZES.medium,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: SIZES.small,
    padding: SIZES.medium,
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
});

export default MyOrdersScreen;