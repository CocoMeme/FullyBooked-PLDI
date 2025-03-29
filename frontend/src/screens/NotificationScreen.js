import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // In a real app, you would fetch notifications from an API
      // For now, we'll use AsyncStorage as a placeholder
      const storedNotifications = await AsyncStorage.getItem('notifications');
      let parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
      
      // If no notifications exist yet, create sample notifications
      if (parsedNotifications.length === 0) {
        parsedNotifications = [
          {
            id: '1',
            title: 'Welcome to FullyBooked!',
            message: 'Thank you for joining our book-loving community.',
            date: new Date().toISOString(),
            read: false,
            type: 'info'
          },
          {
            id: '2',
            title: 'New Book Arrivals',
            message: 'Check out our latest book collection with titles from your favorite authors.',
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            read: false,
            type: 'promo'
          },
          {
            id: '3',
            title: 'Weekend Sale!',
            message: 'Enjoy 20% off on all books this weekend only. Use code: WEEKEND20',
            date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            read: true,
            type: 'promo'
          }
        ];
        await AsyncStorage.setItem('notifications', JSON.stringify(parsedNotifications));
      }
      
      setNotifications(parsedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const updatedNotifications = notifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      
      setNotifications(updatedNotifications);
      await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'promo') {
      navigation.navigate('Books');
    }
    
    // Show notification details
    Alert.alert(notification.title, notification.message);
  };

  const clearAllNotifications = async () => {
    try {
      await AsyncStorage.removeItem('notifications');
      setNotifications([]);
      Alert.alert('Success', 'All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  // Custom right component with clear button for header
  const ClearButton = () => {
    if (notifications.length === 0) return null;
    
    return (
      <TouchableOpacity 
        onPress={() => Alert.alert(
          'Clear Notifications',
          'Are you sure you want to clear all notifications?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear', style: 'destructive', onPress: clearAllNotifications }
          ]
        )}
      >
        <Ionicons name="trash-outline" size={22} color={COLORS.error} />
      </TouchableOpacity>
    );
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, item.read ? styles.readNotification : styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.notificationDate}>{formatDate(item.date)}</Text>
      </View>
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Notifications" 
        rightComponent={<ClearButton />}
      />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: SIZES.small,
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: SIZES.base,
    marginBottom: SIZES.small,
    padding: SIZES.medium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadNotification: {
    backgroundColor: '#fffde7',
  },
  readNotification: {
    backgroundColor: '#fff',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    marginBottom: 4,
  },
  notificationMessage: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    marginBottom: 8,
  },
  notificationDate: {
    ...FONTS.regular,
    fontSize: SIZES.small - 2,
    color: COLORS.secondary,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
  },
});

export default NotificationScreen;