import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import AdminNavigator from './AdminNavigator';
import SplashScreen from '../components/SplashScreen';
import AuthGlobal from '../context/store/AuthGlobal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { setCurrentUser } from '../context/actions/auth.action';
import { COLORS } from '../constants/theme';
import { getToken, removeToken } from '../utils/secureStorage';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const context = useContext(AuthGlobal);
  const [initializing, setInitializing] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // First priority: Check SecureStore for saved token and user data
  useEffect(() => {
    const restoreUserSession = async () => {
      try {
        // Get token using utility function
        const token = await getToken();
        const userDataString = await AsyncStorage.getItem("userData");
        
        if (token) {
          try {
            // Decode and verify token
            const decoded = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            
            // Check if token is still valid (not expired)
            if (decoded.exp && decoded.exp > currentTime) {
              // If we have user data stored, use it
              const userData = userDataString ? JSON.parse(userDataString) : null;
              console.log("Restored session from SecureStore");
              
              // Dispatch to context
              context.dispatch(setCurrentUser(decoded, userData));
              setUserRole(decoded.role || 'customer');
            } else if (decoded.exp && decoded.exp < currentTime) {
              console.log("Stored token is expired");
              // Clean up expired token
              await removeToken();
            }
          } catch (decodeError) {
            console.error("Error decoding token:", decodeError);
          }
        }
      } catch (error) {
        console.error("Error restoring user session:", error);
      } finally {
        // Firebase will handle further initialization if needed
      }
    };
    
    restoreUserSession();
  }, []);

  // Second priority: Handle Firebase user state changes
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      
      // Only set initializing to false if we know the Firebase state
      // and we're still in initializing state
      if (initializing) {
        // Small delay to ensure Auth context has time to process
        // the SecureStore restoration first
        setTimeout(() => setInitializing(false), 300);
      }
    });
    return subscriber; // Unsubscribe on unmount
  }, []);

  // Third priority: Handle Context API authentication state changes
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (context.stateUser.isAuthenticated) {
          // User is authenticated through Context API
          setUserRole(context.stateUser.user.role || 'customer'); // Default to customer if role not specified
          if (initializing) setInitializing(false);
        } else if (firebaseUser) {
          // If Firebase is authenticated but Context is not, fetch user data
          const token = await getToken();
          if (!token) {
            // If no token but Firebase auth exists, try to get a token from backend
            console.log('Firebase auth exists but no JWT token found - should request new token');
            // This will be handled by Auth.js
          }
        }
      } catch (error) {
        console.error('Error verifying authentication:', error);
        if (initializing) setInitializing(false);
      }
    };

    verifyAuth();
  }, [context.stateUser.isAuthenticated, firebaseUser]);

  // Show loading indicator while initializing
  if (initializing) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {context.stateUser.isAuthenticated ? (
          // User is signed in
          context.stateUser.user.role === 'admin' ? (
            // Admin navigator
            <Stack.Screen name="AdminRoot" component={AdminNavigator} />
          ) : (
            // Customer navigator
            <Stack.Screen name="CustomerRoot" component={CustomerNavigator} />
          )
        ) : (
          // No user is signed in, show auth screen
          <Stack.Screen name="AuthRoot" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;