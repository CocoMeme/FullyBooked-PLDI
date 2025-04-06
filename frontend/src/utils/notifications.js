import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../assets/common/baseurl';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications
 * This function:
 * 1. Sets notification channels for Android
 * 2. Requests permission for push notifications
 * 3. Gets the Expo push token
 * 4. Formats the token
 * 5. Sends the token to the backend
 */
export async function registerForPushNotificationsAsync() {
  let token;
  
  // Set up notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Check if device is a physical device (not an emulator/simulator)
  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // If permission isn't granted, request it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // If permission still isn't granted, exit
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get the Expo push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      // Format the token (remove the brackets)
      const originalToken = tokenData.data;
      const formattedToken = originalToken.replace('ExponentPushToken[', '').replace(']', '');
      
      // Small delay to ensure we don't have race conditions
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the authentication token from storage
      const authToken = await AsyncStorage.getItem('jwt');
      if (!authToken) {
        console.error('No authentication token found in storage');
        return null;
      }

      // Send the token to the backend
      const response = await fetch(`${baseURL}users/update-fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          fcmToken: formattedToken,
          deviceType: Platform.OS,
          tokenType: 'expo'
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update FCM token on server');
      }

      console.log('FCM token successfully updated on server');
      return formattedToken;
    } catch (error) {
      console.error('Push notification setup error:', error);
      return null;
    }
  } else {
    console.log('Must use physical device for push notifications');
  }

  return null;
}

/**
 * Remove push notification token from the server
 * This is typically called when a user logs out
 */
export async function removePushNotificationToken() {
  try {
    const authToken = await AsyncStorage.getItem('jwt');
    if (!authToken) {
      console.error('No authentication token found in storage');
      return false;
    }

    const response = await fetch(`${baseURL}users/remove-fcm-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove FCM token');
    }
    
    console.log('FCM token successfully removed from server');
    return true;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return false;
  }
}

/**
 * Set up notification listeners
 * This function sets up listeners for:
 * 1. When a notification is received
 * 2. When a notification is tapped
 * @param {Function} setNotification - Function to update notification state
 * @returns {Function} - Cleanup function to remove listeners
 */
export function setupNotifications(setNotification) {
  // Listen for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    notification => {
      console.log('Notification received:', notification);
      setNotification(notification);
    }
  );

  // Listen for user interactions with notifications
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    response => {
      console.log('Notification tapped:', response);
      const { data } = response.notification.request.content;
      
      // Handle navigation based on notification data
      // For example, if the notification contains order details
      if (data && data.orderId) {
        // You'll need to implement navigation to the order details screen
        // This will depend on your navigation setup
        console.log('Navigate to order details:', data.orderId);
      }
    }
  );

  // Return a cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Send an order notification to the user
 * @param {Object} order - The order object
 */
export async function sendOrderNotification(order) {
  try {
    // Format the notification content
    const title = 'Order Placed Successfully';
    const body = `Your order #${order.orderNumber || order._id} has been placed!`;
    
    // Schedule a notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { 
          orderId: order._id,
          screen: 'OrderDetails'
        },
      },
      trigger: null, // Display immediately
    });
    
    console.log('Order notification sent successfully');
  } catch (error) {
    console.error('Error sending order notification:', error);
  }
}