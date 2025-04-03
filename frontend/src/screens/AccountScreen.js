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
  ActivityIndicator,
  Modal
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AuthGlobal from '../context/store/AuthGlobal';
import { logoutUser } from '../context/actions/auth.action';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Button from '../components/Button';
import Header from '../components/Header';
import AccountProfile from '../components/Account Components/AccountProfile';

// Default avatar image from Cloudinary
const DEFAULT_AVATAR = "https://res.cloudinary.com/do8azqoyg/image/upload/v1743471290/Fully%20Booked/cryphitleu7qbgugiov8.png";

const AccountScreen = () => {
  const context = useContext(AuthGlobal);
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refetch user data when coming back from edit mode
  useEffect(() => {
    if (!showProfileEditor) {
      fetchUserData();
    }
  }, [showProfileEditor]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get user from context - use both user and userProfile fields
      const user = context.stateUser.user;
      const userProfile = context.stateUser.userProfile;
      
      console.log('Context user data:', { user, userProfile });
      
      if (user && user.id) {
        // Combine data from both user and userProfile if available
        setUserData({
          id: user.id,
          // Try multiple possible paths to get username
          username: user.username || userProfile?.username || 'Username',
          email: user.email || userProfile?.email || 'user@example.com',
          avatar: user.avatar || userProfile?.avatar || DEFAULT_AVATAR,
          phone: user.phone || userProfile?.phone || '0987654321',
          role: user.role || 'customer',
          address: {
            city: user.address?.city || userProfile?.address?.city || '',
            country: user.address?.country || userProfile?.address?.country || '',
            state: user.address?.state || userProfile?.address?.state || '',
            zipcode: user.address?.zipcode || userProfile?.address?.zipcode || '',
          }
        });
      } else {
        // If no user data found in context, check AsyncStorage
        const token = await AsyncStorage.getItem('jwt');
        if (token) {
          // Try to get userData from AsyncStorage
          try {
            const storedUserData = await AsyncStorage.getItem('userData');
            const parsedUserData = storedUserData ? JSON.parse(storedUserData) : null;
            
            if (parsedUserData) {
              setUserData({
                username: parsedUserData.username || 'FullyBooked User',
                email: parsedUserData.email || 'user@fullybooked.com',
                avatar: parsedUserData.avatar || DEFAULT_AVATAR,
                role: parsedUserData.role || 'customer',
                address: parsedUserData.address || { city: '', country: '', state: '', zipcode: '' },
              });
            } else {
              // Fallback to placeholder data
              setUserData({
                username: 'FullyBooked User',
                email: 'user@fullybooked.com',
                avatar: DEFAULT_AVATAR,
                role: 'customer',
              });
            }
          } catch (parseError) {
            console.error('Error parsing stored user data:', parseError);
            // Fallback to placeholder data
            setUserData({
              username: 'FullyBooked User',
              email: 'user@fullybooked.com',
              avatar: DEFAULT_AVATAR,
              role: 'customer',
            });
          }
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

  const toggleProfileEditor = () => {
    setShowProfileEditor(!showProfileEditor);
  };

  const navigateToOrderHistory = () => {
    // Navigate to the order history screen
    navigation.navigate('MyOrders');
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
          <View style={styles.profileLayout}>
            <View style={styles.avatarContainer}>
              <Image 
                source={userData?.avatar && typeof userData.avatar === 'string' 
                  ? { uri: userData.avatar } 
                  : DEFAULT_AVATAR} 
                style={styles.profileImage} 
              />
              {userData && (
                <TouchableOpacity onPress={toggleProfileEditor} style={styles.editProfileLink}>
                  <Text style={styles.editProfileText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.userInfoContainer}>
              <Text style={styles.username}>{userData?.username || 'Guest User'}</Text>
              <Text style={styles.email}>{userData?.email || 'Sign in to view your profile'}</Text>
              {userData?.id && (
                <View style={styles.idContainer}>
                  <Text style={styles.idLabel}>User ID: </Text>
                  <Text style={styles.idValue}>{userData.id}</Text>
                </View>
              )}
              {userData?.role && (
                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>Role: </Text>
                  <Text style={styles.roleValue}>{userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}</Text>
                </View>
              )}
            </View>
          </View>
          
          {!userData && (
            <Button
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              style={styles.signInButton}
            />
          )}
        </View>

        {userData && (
          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={navigateToOrderHistory}>
              <Text style={styles.menuItemText}>My Orders</Text>
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

      {/* Profile Editor Modal */}
      <Modal 
        visible={showProfileEditor} 
        animationType="slide"
        onRequestClose={toggleProfileEditor}
      >
        <SafeAreaView style={styles.modalContainer}>
          <Header title="Edit Profile" showBackButton={true} onBackPress={toggleProfileEditor} />
          <AccountProfile onComplete={toggleProfileEditor} />
        </SafeAreaView>
      </Modal>
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
    padding: SIZES.large,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  avatarContainer: {
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 40,
    marginBottom: 2,
    marginHorizontal: SIZES.extraLarge,
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: SIZES.small / 2,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idLabel: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
  },
  idValue: {
    ...FONTS.semiBold,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
  },
  roleValue: {
    ...FONTS.semiBold,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  editProfileLink: {
    marginTop: SIZES.small,
    alignItems: 'center',
  },
  editProfileText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  signInButton: {
    marginTop: SIZES.small,
    alignSelf: 'flex-end',
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
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default AccountScreen;