import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AuthGlobal from '../context/store/AuthGlobal';
import { logoutUser } from '../context/actions/auth.action';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Header from '../components/Header';

const AccountScreen = () => {
  const context = useContext(AuthGlobal);
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch user data from your API
      // For now, we'll use the data from context and some placeholder data
      
      const user = context.stateUser.user;
      
      if (user && user.id) {
        setUserData({
          id: user.id,
          username: user.username || 'User',
          email: user.email || 'user@example.com',
          avatar: user.avatar || 'https://via.placeholder.com/150',
          phone: user.phone || '',
          address: {
            city: user.address?.city || '',
            country: user.address?.country || '',
            state: user.address?.state || '',
            zipcode: user.address?.zipcode || '',
          }
        });
      } else {
        // If no user data found in context, check AsyncStorage
        const token = await AsyncStorage.getItem('jwt');
        if (token) {
          // Placeholder user data if token exists but no user in context
          setUserData({
            username: 'FullyBooked User',
            email: 'user@fullybooked.com',
            avatar: 'https://via.placeholder.com/150',
          });
        } else {
          // No authenticated user
          setUserData(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

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
          }
        }
      ]
    );
  };

  const navigateToEditProfile = () => {
    // This would navigate to an EditProfile screen in a real app
    Alert.alert('Coming Soon', 'Profile editing will be available in the next update.');
  };

  const navigateToOrderHistory = () => {
    // Navigate to order history screen
    Alert.alert('Coming Soon', 'Order history will be available in the next update.');
  };

  const navigateToSettings = () => {
    // Navigate to settings screen
    Alert.alert('Coming Soon', 'Settings will be available in the next update.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Account" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: userData?.avatar || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage} 
          />
          <Text style={styles.username}>{userData?.username || 'Guest User'}</Text>
          <Text style={styles.email}>{userData?.email || 'Sign in to view your profile'}</Text>
          
          {userData ? (
            <Button
              title="Edit Profile"
              onPress={navigateToEditProfile}
              style={styles.editButton}
              variant="outline"
            />
          ) : (
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              style={styles.editButton}
            />
          )}
        </View>

        {userData && (
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={navigateToOrderHistory}>
              <Text style={styles.menuItemText}>Order History</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Shipping addresses will be available in the next update.')}>
              <Text style={styles.menuItemText}>Shipping Addresses</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Payment methods will be available in the next update.')}>
              <Text style={styles.menuItemText}>Payment Methods</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={navigateToSettings}>
              <Text style={styles.menuItemText}>Settings</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.menuItem, styles.logoutMenuItem]} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>FullyBooked v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    padding: SIZES.large,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SIZES.medium,
  },
  username: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    marginBottom: SIZES.small / 2,
  },
  email: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    marginBottom: SIZES.medium,
  },
  editButton: {
    width: 150,
  },
  menuSection: {
    marginTop: SIZES.medium,
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    overflow: 'hidden',
    marginHorizontal: SIZES.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
  menuItemArrow: {
    fontSize: 24,
    color: COLORS.onBackground,
    opacity: 0.5,
  },
  logoutMenuItem: {
    justifyContent: 'center',
    borderBottomWidth: 0,
  },
  logoutText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.error,
  },
  appInfo: {
    padding: SIZES.large,
    alignItems: 'center',
    marginTop: 'auto',
  },
  appVersion: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    opacity: 0.6,
  },
});

export default AccountScreen;