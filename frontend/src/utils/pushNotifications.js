/**
 * Push Notifications Module
 * 
 * This module handles all push notification functionality for the FullyBooked app:
 * - Registering for push tokens
 * - Handling notification permissions
 * - Sending different types of notifications (order, product discounts)
 * - Setting up notification listeners
 * - Storing notifications in local database
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveNotification, saveSaleBook, markUserNotifiedAboutSaleBook } from '../services/notificationsDB';
import axios from 'axios';
import baseURL from '../assets/common/baseurl';
import { getOrderById } from '../redux/actions/orderActions';

// This configuration is now moved to App.js for global setup
// Left here for reference but commented out to avoid duplication
/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
*/

/**
 * Register for push notifications
 * 
 * This function:
 * 1. Sets notification channels for Android
 * 2. Requests permission for push notifications
 * 3. Gets the Expo push token
 * 4. Formats the token
 * 5. Sends the token to the backend
 * 
 * @returns {string|null} The push notification token or null if registration failed
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
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      // Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // Exit if permission not granted
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get the Expo push token with project ID
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
      await updateTokenOnServer(formattedToken, authToken);
      
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
 * Update the FCM token on the server
 * 
 * @param {string} token - The formatted push notification token
 * @param {string} authToken - The JWT auth token
 * @returns {boolean} Success or failure
 */
async function updateTokenOnServer(token, authToken) {
  try {
    const response = await fetch(`${baseURL}users/update-fcm-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ 
        fcmToken: token,
        deviceType: Platform.OS,
        tokenType: 'expo'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || 'Failed to update FCM token on server');
    }

    console.log('FCM token successfully updated on server');
    return true;
  } catch (error) {
    console.error('Error updating token on server:', error);
    return false;
  }
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

// Existing function for order status update notifications
export const sendOrderStatusNotification = async (order, newStatus) => {
  try {
    console.log('Initial order data:', order);

    // Fetch complete order data if needed
    if (!order.products) {
      const orderDetails = await getOrderById(order.id);
      order = { ...order, ...orderDetails };
    }

    // Format order summary for notification
    const title = 'Order Status Updated';
    const body = `${order.orderNumber} status changed to ${newStatus.toUpperCase()}`;

    // Prepare notification data
    const notificationData = {
      type: 'ORDER_STATUS_UPDATE',
      orderId: order.id,
      status: newStatus,
      screen: 'NotificationDetails',
      orderNumber: order.orderNumber,
      products: order.products,
      customer: order.customer,
      orderDate: order.date || order.createdAt,
      paymentMethod: order.paymentMethod,
      userId: order.userId
    };

    // Save to local DB
    await saveNotification(order.userId, title, body, notificationData);

    // Send push notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: notificationData,
      },
      trigger: null,
    });

    console.log('Push notification sent successfully.');
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Existing helper function for basic notifications
const sendBasicNotification = async (userId, title, body, orderId, status) => {
  await saveNotification(userId, title, body, {
    type: 'ORDER_STATUS_UPDATE',
    orderId: orderId,
    status: status,
    screen: 'NotificationDetails'
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: {
        screen: 'NotificationDetails',
        orderId: orderId,
        type: 'ORDER_STATUS_UPDATE',
        status: status
      },
    },
    trigger: null,
  });
};

// Existing function for product discount notifications
export const sendProductDiscountNotification = async (product) => {
  try {
    console.log('Starting product discount notification for:', product);

    if (!product.discount || product.discount <= 0) {
      console.log('No discount to notify for:', product.name);
      return;
    }

    const title = `${product.name} is on ${product.discount}% discount!`;
    const body = 'Order Now!!';
    
    // Calculate discounted price if not provided
    const discountedPrice = product.discountedPrice || 
      (product.price - (product.price * (product.discount / 100)));

    // Prepare notification data
    const notificationData = {
      type: 'PRODUCT_DISCOUNT',
      productId: product._id,
      productName: product.name,
      image: product.images?.[0]?.url || null,
      discount: product.discount,
      price: product.price,
      discountedPrice: discountedPrice,
      screen: 'NotificationDetails'  // Add this to ensure consistent navigation
    };

    // Get all users
    const users = await getAllUsers();
    console.log(`Sending notifications to ${users.length} users`);

    // Send notification to each user
    const successfulNotifications = [];
    const failedNotifications = [];

    for (const user of users) {
      try {
        console.log(`Processing notification for user:`, user);
        
        // Save to local database with specific type
        await saveNotification(
          user.firebaseUid, 
          title, 
          body, 
          notificationData, 
          'PRODUCT_DISCOUNT'
        );
        console.log(`Notification saved to database for user: ${user.firebaseUid}`);

        // Schedule push notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: notificationData,
            sound: true,
            badge: 1,
          },
          trigger: null,
        });
        console.log(`Push notification sent to user: ${user.firebaseUid}`);
        
        successfulNotifications.push(user.firebaseUid);
      } catch (error) {
        console.error(`Error sending notification to user ${user.firebaseUid}:`, error);
        failedNotifications.push({ userId: user.firebaseUid, error: error.message });
      }
    }

    console.log('Product discount notifications completed:', {
      successful: successfulNotifications.length,
      failed: failedNotifications.length
    });

    return {
      successful: successfulNotifications,
      failed: failedNotifications
    };
  } catch (error) {
    console.error('Error in sendProductDiscountNotification:', error);
    throw error;
  }
};

// Existing helper function to get all users
const getAllUsers = async () => {
  try {
    const token = await AsyncStorage.getItem('jwt');
    const currentUserData = await AsyncStorage.getItem('userData');
    const currentUser = currentUserData ? JSON.parse(currentUserData) : null;

    console.log('Current user:', currentUser);

    if (!currentUser || !currentUser.firebaseUid) {
      console.log('No valid current user found');
      return [];
    }

    const response = await axios.get(`${baseURL}users/all`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // If we can't get other users, at least notify the current user
    if (!response.data.users || response.data.users.length === 0) {
      console.log('No users found in response, using current user');
      return [currentUser];
    }

    // Include current user in notifications
    const allUsers = response.data.users.map(user => ({
      ...user,
      firebaseUid: user.firebaseUid || user.uid || null
    }));

    // Add current user if not already included
    if (!allUsers.some(user => user.firebaseUid === currentUser.firebaseUid)) {
      allUsers.push(currentUser);
    }

    const validUsers = allUsers.filter(user => user.firebaseUid);
    console.log(`Found ${validUsers.length} users with valid firebaseUid`);

    return validUsers;
  } catch (error) {
    console.error('Error fetching users:', error);
    // Fallback to current user
    const currentUserData = await AsyncStorage.getItem('userData');
    const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
    return currentUser?.firebaseUid ? [currentUser] : [];
  }
};

/**
 * Send an order checkout notification to the user
 * @param {Object} order - The order object
 */
export async function sendOrderCheckoutNotification(order) {
  try {
    console.log('Sending notification for order:', JSON.stringify(order, null, 2));
    
    // Get the total number of items
    const totalItems = order.products?.reduce((total, item) => total + item.quantity, 0) || 
                       order.items?.reduce((total, item) => total + item.quantity, 0) || 0;
    
    // Calculate the correct total price
    let totalPrice = 0;
    
    // First, try to get the total from the order object directly
    if (typeof order.totalPrice === 'number') {
      totalPrice = order.totalPrice;
    } else if (typeof order.totalAmount === 'number') {
      totalPrice = order.totalAmount;
    } else if (typeof order.total === 'number') {
      totalPrice = order.total;
    } else {
      // If total isn't available directly, calculate it from the items
      const items = order.products || order.items || [];
      items.forEach(item => {
        const itemPrice = item.price || 0;
        const quantity = item.quantity || 1;
        totalPrice += itemPrice * quantity;
      });
    }
    
    // Create a descriptive title that includes item count
    const title = `Order Placed Successfully`;
    
    // Create a descriptive body that includes item count and total price
    const orderId = order.orderNumber || order._id?.substring(0, 8) || '';
    const body = `Your order #${orderId} with ${totalItems} item${totalItems !== 1 ? 's' : ''} has been placed! Total: ₱${totalPrice.toFixed(2)}`;
    
    // We need to fetch book details to get proper book titles for the notification
    const items = order.products || order.items || [];
    let bookDetails = {};
    
    // First, try to extract book information from the order
    if (items.length > 0) {
      // If items already have book details nested inside them, extract those
      for (const item of items) {
        if (item.book && typeof item.book === 'object' && item.book._id) {
          bookDetails[item.book._id] = item.book;
        }
      }
      
      // If we need to fetch book details (they weren't nested in the order)
      if (Object.keys(bookDetails).length === 0) {
        try {
          const bookIds = new Set();
          
          // Get all unique book IDs from the order
          items.forEach(item => {
            const bookId = typeof item.book === 'object' ? item.book._id : item.book;
            if (bookId) bookIds.add(String(bookId));
          });
          
          // Only fetch if we have book IDs
          if (bookIds.size > 0) {
            const token = await AsyncStorage.getItem('jwt');
            
            await Promise.all(
              Array.from(bookIds).map(async (bookId) => {
                try {
                  const response = await axios.get(`${baseURL}books/${bookId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  
                  if (response.data && response.data.book) {
                    bookDetails[bookId] = response.data.book;
                  }
                } catch (error) {
                  console.error(`Error fetching book ${bookId}:`, error.message);
                }
              })
            );
          }
        } catch (error) {
          console.error('Error fetching book details for notification:', error);
        }
      }
    }
    
    // Format a summary of the items using the book details we fetched
    let itemSummary = '';
    
    if (items.length > 0) {
      // Get the first 2 items to mention in the notification
      const firstItems = items.slice(0, 2);
      const remainingCount = items.length - 2;
      
      firstItems.forEach((item, index) => {
        // Get the book ID consistently
        const bookId = typeof item.book === 'object' ? item.book._id : item.book;
        const bookIdStr = String(bookId);
        
        // Try to get the actual product name from our fetched book details
        let productName;
        const book = bookDetails[bookIdStr];
        
        if (book) {
          productName = book.title || book.name;
        } else if (item.productName) {
          productName = item.productName;
        } else {
          productName = `Book ${index+1}`;
        }
        
        itemSummary += `${productName} (x${item.quantity})${index < firstItems.length - 1 ? ', ' : ''}`;
      });
      
      if (remainingCount > 0) {
        itemSummary += ` and ${remainingCount} more item${remainingCount !== 1 ? 's' : ''}`;
      }
    }
    
    // Prepare notification data with detailed order information
    const notificationData = {
      type: 'ORDER_PLACED',
      orderId: order._id || order.id,
      orderNumber: order.orderNumber,
      screen: 'NotificationDetails',
      notificationId: Math.random().toString(36).substring(2, 15),
      products: order.products || order.items,
      totalAmount: totalPrice,
      status: order.status || 'Pending',
      orderDate: order.createdAt || order.date || new Date().toISOString(),
      itemSummary: itemSummary
    };
    
    // Save to local notifications database
    if (order.userId || order.user) {
      const userId = order.userId || order.user;
      const extendedBody = itemSummary ? `${body}\n\nItems: ${itemSummary}` : body;
      await saveNotification(userId, title, extendedBody, notificationData);
    }
    
    // Schedule a notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: itemSummary ? `${body}\n\nItems: ${itemSummary}` : body,
        data: notificationData,
      },
      trigger: null, // Display immediately
    });
    
    console.log('Order checkout notification sent successfully with itemSummary:', itemSummary);
    return true;
  } catch (error) {
    console.error('Error sending order checkout notification:', error);
    return false;
  }
}

/**
 * Send a notification to all users about a book on sale
 * @param {Object} book - The book object with sale information
 * @returns {Object} Result of the notification sending operation
 */
export const sendBookSaleNotification = async (book) => {
  try {
    console.log('Starting book sale notification for:', book.title);

    if (!book || book.tag !== 'Sale' || !book.discountPrice) {
      console.log('Not a valid sale book to notify for:', book.title);
      return;
    }

    // Always save the sale book to the database for future notifications
    // This will ensure users who log in later will be notified
    try {
      await saveSaleBook(book);
      console.log('Sale book saved to database for future notifications');
    } catch (dbError) {
      console.error('Error saving sale book to database:', dbError);
      // Continue with the rest of the function - we still want to send notifications to online users
    }

    // Format prices for display
    const originalPrice = typeof book.price === 'number' ? book.price.toFixed(2) : book.price;
    const salePrice = typeof book.discountPrice === 'number' ? book.discountPrice.toFixed(2) : book.discountPrice;
    
    // Calculate discount percentage
    const discountPercent = Math.round(((book.price - book.discountPrice) / book.price) * 100);
    
    // Create an attention-grabbing notification
    const title = `${book.title} is now on sale!`;
    const body = `Save ${discountPercent}%! Now ₱${salePrice} (was ₱${originalPrice})`;
    
    // Prepare notification data that will allow navigation to book details
    const notificationData = {
      type: 'BOOK_SALE',
      bookId: book._id,
      bookTitle: book.title,
      author: book.author,
      coverImage: book.coverImage?.[0] || null,
      price: book.price,
      discountPrice: book.discountPrice,
      screen: 'BookDetails', // This will be used for navigation when notification is tapped
      notificationId: Math.random().toString(36).substring(2, 15)
    };

    // Get all users to notify
    const users = await getAllUsers();
    console.log(`Sending book sale notifications to ${users.length} users`);

    // Send notification to each user
    const successfulNotifications = [];
    const failedNotifications = [];

    for (const user of users) {
      try {
        console.log(`Processing book sale notification for user:`, user.firebaseUid);
        
        // Save to local database with specific type
        await saveNotification(
          user.firebaseUid, 
          title, 
          body, 
          notificationData, 
          'BOOK_SALE'
        );
        
        // Schedule push notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: notificationData,
            sound: true,
            badge: 1,
          },
          trigger: null, // Display immediately
        });
        
        // Mark this user as notified about this sale book
        await markUserNotifiedAboutSaleBook(book._id, user.firebaseUid);
        
        successfulNotifications.push(user.firebaseUid);
      } catch (error) {
        console.error(`Error sending book sale notification to user ${user.firebaseUid}:`, error);
        failedNotifications.push({ userId: user.firebaseUid, error: error.message });
      }
    }

    console.log('Book sale notifications completed:', {
      successful: successfulNotifications.length,
      failed: failedNotifications.length
    });

    return {
      successful: successfulNotifications,
      failed: failedNotifications
    };
  } catch (error) {
    console.error('Error in sendBookSaleNotification:', error);
    throw error;
  }
};

/**
 * Check for and send notifications about sale books that the user hasn't been notified about yet
 * This should be called when a user logs in
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Whether any notifications were sent
 */
export const checkPendingSaleNotifications = async (userId) => {
  try {
    if (!userId) {
      console.log('No user ID provided for checking pending sale notifications');
      return false;
    }
    
    console.log(`Checking pending sale notifications for user: ${userId}`);
    
    // Get unnotified sale books from the database
    const { getUnnotifiedSaleBooks } = await import('../services/notificationsDB');
    const saleBooks = await getUnnotifiedSaleBooks(userId);
    
    console.log(`Found ${saleBooks.length} unnotified sale books for user ${userId}`);
    
    if (saleBooks.length === 0) {
      return false;
    }
    
    // Process each sale book and send notification
    for (const book of saleBooks) {
      try {
        // Format prices for display
        const originalPrice = book.price.toFixed(2);
        const salePrice = book.discount_price.toFixed(2);
        
        // Calculate discount percentage
        const discountPercent = Math.round(((book.price - book.discount_price) / book.price) * 100);
        
        // Create notification content
        const title = `${book.book_title} is on sale!`;
        const body = `Save ${discountPercent}%! Now ₱${salePrice} (was ₱${originalPrice})`;
        
        // Prepare notification data
        const notificationData = {
          type: 'BOOK_SALE',
          bookId: book.book_id,
          bookTitle: book.book_title,
          price: book.price,
          discountPrice: book.discount_price,
          screen: 'BookDetails', // Used for navigation when tapped
          notificationId: Math.random().toString(36).substring(2, 15)
        };
        
        // Save to local notifications database
        await saveNotification(
          userId,
          title,
          body,
          notificationData,
          'BOOK_SALE'
        );
        
        // Schedule push notification with a small delay to avoid overwhelming the user
        // with multiple notifications at once
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data: notificationData,
            sound: true,
            badge: 1,
          },
          trigger: { seconds: 2 * (saleBooks.indexOf(book) + 1) }, // Stagger notifications by 2 seconds each
        });
        
        // Mark as notified
        await markUserNotifiedAboutSaleBook(book.book_id, userId);
        
        console.log(`Pending sale notification sent for book ${book.book_title} to user ${userId}`);
      } catch (error) {
        console.error(`Error sending pending sale notification for book ${book.book_id}:`, error);
        // Continue with other books even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking pending sale notifications:', error);
    return false;
  }
};