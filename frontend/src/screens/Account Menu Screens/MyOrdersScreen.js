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
import { useDispatch, useSelector } from 'react-redux';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import Header from '../../components/Header';
import AuthGlobal from '../../context/store/AuthGlobal';
import OrderHistory from '../../components/Account Components/OrderHistory';
import ToReceive from '../../components/Account Components/ToReceive';
import ToReview from '../../components/Account Components/ToReview';
import { fetchMyOrders } from '../../redux/actions/orderActions';
import { checkConnection } from '../../services/api';

const MyOrdersScreen = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('history');
  const [retrying, setRetrying] = useState(false);
  const { orders, loading, error } = useSelector(state => state.orders);

  // Load orders when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserOrders();
    });
    
    return unsubscribe;
  }, [navigation]);

  const fetchUserOrders = async () => {
    try {
      // Check connection first
      const isConnected = await checkConnection();
      if (!isConnected) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your internet connection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Retry',
              onPress: () => {
                setRetrying(true);
                fetchUserOrders().finally(() => setRetrying(false));
              }
            }
          ]
        );
        return;
      }

      await dispatch(fetchMyOrders());
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Please log in again to view your orders.',
          [
            { 
              text: 'Login',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Error',
          error.message || 'Failed to fetch your orders. Please try again later.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Retry',
              onPress: () => {
                setRetrying(true);
                fetchUserOrders().finally(() => setRetrying(false));
              }
            }
          ]
        );
      }
    }
  };

  // Make sure we have the user ID for filtering
  const userId = context?.stateUser?.user?.userId || 
                context?.stateUser?.user?.id || 
                context?.stateUser?.user?._id;

  const renderTabContent = () => {
    if (loading || retrying) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {retrying ? 'Retrying...' : 'Loading orders...'}
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={() => {
              setRetrying(true);
              fetchUserOrders().finally(() => setRetrying(false));
            }} 
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'history':
        return <OrderHistory orders={orders} navigation={navigation} />;
      case 'toReceive':
        const pendingOrders = orders.filter(order => 
          order.status === 'Pending' || order.status === 'Shipped'
        );
        return <ToReceive orders={pendingOrders} navigation={navigation} />;
      case 'toReview':
        return <ToReview 
          orders={orders.filter(order => order.status === 'Delivered')} 
          navigation={navigation} 
          userId={userId}
        />;
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
  loadingText: {
    marginTop: SIZES.small,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  errorContainer: {
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
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.medium,
    textAlign: 'center',
    marginBottom: SIZES.small,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: SIZES.medium,
    textAlign: 'center',
  },
});

export default MyOrdersScreen;