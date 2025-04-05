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
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications, initNotificationsDB, clearAllNotifications } from '../../src/services/notificationsDB';

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isClearing, setIsClearing] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      await initNotificationsDB();
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;

      const { firebaseUid } = JSON.parse(userData);
      const userNotifications = await getNotifications(firebaseUid);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) return;

      const { firebaseUid } = JSON.parse(userData);
      Alert.alert(
        "Clear Notifications",
        "Are you sure you want to clear all notifications?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear",
            style: "destructive",
            onPress: async () => {
              setIsClearing(true);
              await clearAllNotifications(firebaseUid);
              await loadNotifications();
              setIsClearing(false);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setIsClearing(false);
    }
  };

  useEffect(() => {
    const initNotifications = async () => {
      try {
        setIsInitializing(true);
        await loadNotifications();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initNotifications();
    const unsubscribe = navigation.addListener('focus', loadNotifications);
    return unsubscribe;
  }, []);

  if (isInitializing || loading || isClearing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, item.read ? styles.readNotification : styles.unreadNotification]}
      onPress={() => {
        navigation.navigate('NotificationDetails', { notification: item });
      }}
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notificationDate}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      {!item.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Notifications" 
        rightComponent={
          notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearNotifications}>
              <Ionicons name="trash-outline" size={22} color={COLORS.error} />
            </TouchableOpacity>
          )
        }
      />
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => `notification-${item.id}`}
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