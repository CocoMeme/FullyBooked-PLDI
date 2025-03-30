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
import API_URL from '../../services/api';
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

  // Fetch data from the backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch this data from your API
        // const booksResponse = await axios.get(API_URL.GET_ALL_BOOKS);
        // const ordersResponse = await axios.get(API_URL.GET_RECENT_ORDERS);
        // const usersResponse = await axios.get(API_URL.GET_RECENT_USERS);
        // const statsResponse = await axios.get(API_URL.GET_DASHBOARD_STATS);
        
        // Dummy data for demonstration
        const dummyBooks = [
          {
            _id: '1',
            title: 'The Great Gatsby',
            category: 'Fiction',
            price: 12.99,
            image: 'https://m.media-amazon.com/images/I/71FTb9X6wsL._AC_UF1000,1000_QL80_.jpg'
          },
          {
            _id: '2',
            title: 'To Kill a Mockingbird',
            category: 'Fiction',
            price: 14.50,
            image: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/To_Kill_a_Mockingbird_%28first_edition_cover%29.jpg'
          },
          {
            _id: '3',
            title: 'The Hobbit',
            category: 'Fantasy',
            price: 16.75,
            image: 'https://m.media-amazon.com/images/I/710+HcoP38L._AC_UF1000,1000_QL80_.jpg'
          }
        ];
        
        const dummyOrders = [
          {
            _id: '1',
            orderNumber: 'ORD-001-2025',
            date: '2025-03-15T14:30:00.000Z',
            status: 'delivered',
            totalAmount: 85.97
          },
          {
            _id: '2',
            orderNumber: 'ORD-002-2025',
            date: '2025-03-20T09:45:00.000Z',
            status: 'processing',
            totalAmount: 42.50
          }
        ];

        const dummyUsers = [
          {
            _id: '1',
            username: 'johndoe',
            email: 'john@example.com',
            createdAt: '2025-01-15T08:30:00.000Z'
          },
          {
            _id: '2',
            username: 'janedoe',
            email: 'jane@example.com',
            createdAt: '2025-02-05T10:15:00.000Z'
          }
        ];
        
        const dummyStats = {
          totalBooks: 245,
          totalOrders: 187,
          totalUsers: 312,
          totalSales: 9678.50
        };
        
        setBooks(dummyBooks);
        setOrders(dummyOrders);
        setUsers(dummyUsers);
        setStats(dummyStats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        Alert.alert('Error', 'Failed to load dashboard data');
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
        source={{ uri: item.image }}
        style={styles.bookImage}
        resizeMode="cover"
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.bookCategory}>{item.category}</Text>
        <Text style={styles.bookPrice}>${item.price.toFixed(2)}</Text>
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
            `$${stats.totalSales.toFixed(2)}`, 
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
                <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                <Text style={styles.orderDate}>{new Date(order.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.orderMeta}>
                <Text style={styles.orderAmount}>${order.totalAmount.toFixed(2)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
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