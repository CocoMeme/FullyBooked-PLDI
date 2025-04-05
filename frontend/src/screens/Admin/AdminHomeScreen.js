import React, { useEffect, useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../constants/theme';
import Header from '../../components/Header';
import { API_URL, api } from '../../services/api';
import AuthGlobal from '../../context/store/AuthGlobal';
import { logoutUser } from '../../context/actions/auth.action';
import { CommonActions } from '@react-navigation/native';

const AdminHomeScreen = ({ navigation }) => {
  const context = useContext(AuthGlobal);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalSales: 0
  });
  const [loading, setLoading] = useState(true);

  // Helper function for formatting currency with peso sign and thousand separators
  const formatCurrency = (amount) => {
    return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  // Format date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  // Fetch data from the backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from API endpoints
        const booksResponse = await api.get(API_URL.GET_ALL_BOOKS);
        const ordersResponse = await api.get(API_URL.GET_ALL_ORDERS);
        const usersResponse = await api.get('/users/all');
        
        // Set the fetched data - handle nested response formats correctly
        const fetchedBooks = booksResponse.data.books || []; // Access the 'books' property from the response
        const fetchedOrders = ordersResponse.data.orders || []; // Access the 'orders' property from the response
        const fetchedUsers = usersResponse.data || [];
        
        console.log('Fetched books:', fetchedBooks.length);
        console.log('Fetched orders:', fetchedOrders.length);
        console.log('Fetched users:', fetchedUsers.length);
        
        // Calculate total sales from orders
        const totalSales = fetchedOrders.reduce((total, order) => {
          return total + (order.totalAmount || 0);
        }, 0);
        
        // Set state with real data
        setBooks(fetchedBooks.slice(0, 5)); // Show only the most recent 5 books
        setOrders(fetchedOrders.slice(0, 5)); // Show only the most recent 5 orders
        setUsers(fetchedUsers.slice(0, 5)); // Store users for potential future use
        
        // Set statistics data
        setStats({
          totalBooks: fetchedBooks.length,
          totalOrders: fetchedOrders.length,
          totalUsers: fetchedUsers.length,
          totalSales: totalSales
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        Alert.alert(
          'Error', 
          'Failed to load dashboard data. ' + (error.response?.data?.message || error.message)
        );
        
        // Set some fallback data if API calls fail
        setBooks([]);
        setOrders([]);
        setUsers([]);
        setStats({
          totalBooks: 0,
          totalOrders: 0,
          totalUsers: 0,
          totalSales: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return '#4CAF50';
      case 'processing':
        return '#2196F3';
      case 'pending':
        return '#FF9800';
      case 'cancelled':
        return '#F44336';
      default:
        return COLORS.secondary;
    }
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookItem}
      onPress={() => navigation.navigate('ProductManagement', { productId: item._id })}
    >
      <Image 
        source={{ uri: item.coverImage && item.coverImage.length > 0 ? item.coverImage[0] : 'https://via.placeholder.com/140x160?text=No+Image' }}
        style={styles.bookImage}
        resizeMode="cover"
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bookCategory}>{item.category}</Text>
        <Text style={styles.bookPrice}>{formatCurrency(item.price || 0)}</Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderStatCard = (title, value, icon, color, onPress) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
    </TouchableOpacity>
  );

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            logoutUser(context.dispatch);
            // Reset to the auth stack with the correct name 'AuthRoot'
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'AuthRoot' }],
              })
            );
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text>Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Admin Dashboard" 
        rightComponent={(
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        )}
      />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {renderStatCard(
            'Books', 
            stats.totalBooks, 
            'book-outline', 
            '#4CAF50', 
            () => navigation.navigate('AdminBooks')
          )}
          {renderStatCard(
            'Orders', 
            stats.totalOrders, 
            'cart-outline', 
            '#2196F3', 
            () => navigation.navigate('OrderManagement')
          )}
          {renderStatCard(
            'Users', 
            stats.totalUsers, 
            'people-outline', 
            '#FF9800', 
            () => navigation.navigate('UserManagement')
          )}
          {renderStatCard(
            'Sales', 
            formatCurrency(stats.totalSales), 
            'cash-outline', 
            '#F44336', 
            () => navigation.navigate('OrderManagement')
          )}
        </View>

        {/* Admin Menu Options */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('AdminBooks')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#4CAF5020' }]}>
                <Ionicons name="library-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.menuText}>Manage Books</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('OrderManagement')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#2196F320' }]}>
                <Ionicons name="receipt-outline" size={24} color="#2196F3" />
              </View>
              <Text style={styles.menuText}>Manage Orders</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#FF980020' }]}>
                <Ionicons name="people-outline" size={24} color="#FF9800" />
              </View>
              <Text style={styles.menuText}>Manage Users</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => Alert.alert('Info', 'Settings feature coming soon')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#9C27B020' }]}>
                <Ionicons name="settings-outline" size={24} color="#9C27B0" />
              </View>
              <Text style={styles.menuText}>Settings</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#F4433620' }]}>
                <Ionicons name="log-out-outline" size={24} color="#F44336" />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Books */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Books</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AdminBooks')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={books}
            keyExtractor={(item) => item._id}
            renderItem={renderBookItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.booksList}
          />
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrderManagement')}>
              <Text style={styles.seeAllButton}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {orders.map((order) => (
            <TouchableOpacity 
              key={order._id} 
              style={styles.orderItem}
              onPress={() => navigation.navigate('OrderManagement')}
            >
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>Order #{order._id.substring(0, 8)}</Text>
                <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
              </View>
              <View style={styles.orderMeta}>
                <Text style={styles.orderAmount}>{formatCurrency(order.totalAmount || 0)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status?.toUpperCase() || 'PENDING'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: SIZES.medium,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SIZES.medium,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    ...SHADOWS.medium,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.7,
  },
  statValue: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
    marginBottom: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuSection: {
    marginBottom: SIZES.large,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  menuText: {
    ...FONTS.medium,
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  section: {
    marginBottom: SIZES.large,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
    marginBottom: SIZES.small,
  },
  seeAllButton: {
    ...FONTS.medium,
    color: COLORS.primary,
    fontSize: SIZES.small,
  },
  booksList: {
    paddingRight: SIZES.small,
  },
  bookItem: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: SIZES.medium,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  bookImage: {
    width: '100%',
    height: 160,
  },
  bookInfo: {
    padding: SIZES.small,
  },
  bookTitle: {
    ...FONTS.bold,
    fontSize: SIZES.small,
    marginBottom: 4,
  },
  bookCategory: {
    ...FONTS.regular,
    fontSize: SIZES.small - 2,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  bookPrice: {
    ...FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: SIZES.medium,
    marginBottom: SIZES.small,
    ...SHADOWS.small,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    ...FONTS.bold,
    fontSize: SIZES.small,
    marginBottom: 4,
  },
  orderDate: {
    ...FONTS.regular,
    fontSize: SIZES.small - 2,
    color: COLORS.onBackground,
    opacity: 0.7,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    ...FONTS.bold,
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  statusText: {
    ...FONTS.medium,
    fontSize: SIZES.small - 4,
    color: '#fff',
  },
  logoutMenuItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    ...FONTS.medium,
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.error,
  },
});

export default AdminHomeScreen;