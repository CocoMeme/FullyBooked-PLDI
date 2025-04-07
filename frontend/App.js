import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import * as Font from 'expo-font';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/RootNavigation'; // We'll create this file
import SplashScreen from './src/components/SplashScreen';
import Auth from './src/context/store/Auth';
import Toast from 'react-native-toast-message';
import { initDatabase } from './src/services/database';
import { registerForPushNotificationsAsync, setupNotifications } from './src/utils/pushNotifications';
import { configureGoogleSignin } from './src/services/googleAuthService';


/**
 * Configure how notifications appear when the app is in the foreground
 * This ensures notifications are visible even when the app is being actively used
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,  // Show a visible alert when the app is open
    shouldPlaySound: true,  // Play a sound when notification arrives
    shouldSetBadge: true,   // Update the app badge count
  }),
});

export default function App() {
  // App state
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [notification, setNotification] = useState(false);
  
  // References for cleanup
  const notificationListener = useRef();
  const responseListener = useRef();

    // Configure GoogleSignin at app startup
    useEffect(() => {
      try {
        // Explicitly import the configuration function
        const { configureGoogleSignin } = require('./src/services/googleAuthService');
        configureGoogleSignin();
        console.log("Google Sign-In configured on app startup");
      } catch (error) {
        console.error("Failed to configure Google Sign-In:", error);
      }
    }, []);

  // Initialize app resources and services
  useEffect(() => {
    async function initializeApp() {
      try {
        // 1. Load custom fonts
        await Font.loadAsync({
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        });
        setFontsLoaded(true);

        // 2. Initialize the database
        await initDatabase();
        console.log('Database initialized successfully');
        
        // 3. Initialize push notifications
        await initializePushNotifications();
      } catch (error) {
        console.error('Error initializing app:', error);
        setFontsLoaded(true); // Fallback to continue app loading
      }
    }

    initializeApp();
    
    // Clean up notification listeners when the app unmounts
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  /**
   * Initialize push notification system
   * - Registers for push tokens
   * - Sets up notification listeners
   * - Configures notification taps to navigate to appropriate screens
   */
  const initializePushNotifications = async () => {
    try {
      // Register for push notifications and get token
      const token = await registerForPushNotificationsAsync();
      console.log("Push notification token:", token);
      
      // Setup notification received listeners
      const cleanupNotifications = setupNotifications(setNotification);
      
      // Setup notification tap handler
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped!', response);
        const data = response.notification.request.content.data;
        
        // Navigate based on notification type
        if (data) {
          console.log('Notification data:', data);
          
          // Handle different notification types
          if (data.type === 'BOOK_SALE' && data.bookId) {
            // For book sale notifications, navigate directly to BookDetails
            setTimeout(() => {
              if (navigationRef.current) {
                try {
                  console.log('Navigating to BookDetails for book:', data.bookId);
                  // Navigate to home tab first, then to BookDetails
                  navigationRef.current.navigate('CustomerRoot', {
                    screen: 'Home',
                    params: {
                      screen: 'BookDetails',
                      params: { bookId: data.bookId }
                    }
                  });
                } catch (navError) {
                  console.error('Navigation error:', navError);
                }
              }
            }, 500);
          } else {
            // For other notification types (orders, etc.)
            // Parse notification for NotificationDetails screen
            const notificationData = {
              id: data.notificationId,
              title: response.notification.request.content.title,
              body: response.notification.request.content.body,
              data: data,
              createdAt: new Date().toISOString(),
              isRead: false
            };
            
            setTimeout(() => {
              // Use a direct navigation path to ensure navigation works properly
              if (navigationRef.current) {
                try {
                  console.log('Attempting navigation to NotificationDetails with navigationRef');
                  
                  // First navigate to the Notifications tab
                  navigationRef.current.navigate('CustomerRoot', {
                    screen: 'Notifications',
                    params: {
                      screen: 'NotificationDetails',
                      params: { notification: notificationData }
                    }
                  });
                } catch (navError) {
                  console.error('Navigation error:', navError);
                }
              } else {
                console.warn('Navigation ref is not ready yet');
              }
            }, 500); // Increased delay to ensure navigation is ready
          }
        }
      });
      
      // Store reference for cleanup
      responseListener.current = subscription;
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const handleSplashComplete = () => {
    if (fontsLoaded) {
      setIsLoading(false);
    }
  };

  // Show splash screen until fonts are loaded and splash animation is complete
  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <ReduxProvider store={store}>
      <Auth>
        <SafeAreaProvider>
          <StatusBar style={isLoading ? "light" : "dark"} />
          {isLoading ? (
            <SplashScreen onComplete={handleSplashComplete} />
          ) : (
            <AppNavigator ref={navigationRef} />
          )}
          <Toast />
        </SafeAreaProvider>
      </Auth>
    </ReduxProvider>
  );
}