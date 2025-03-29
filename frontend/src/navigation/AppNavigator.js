import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import AdminNavigator from './AdminNavigator';
import SplashScreen from '../components/SplashScreen';
import AuthGlobal from '../context/store/AuthGlobal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const context = useContext(AuthGlobal);
  const [initializing, setInitializing] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  // Handle Firebase user state changes
  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user && initializing) setInitializing(false);
    });
    return subscriber; // Unsubscribe on unmount
  }, []);

  // Handle Context API authentication state
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (context.stateUser.isAuthenticated) {
          // User is authenticated through Context API
          setUserRole(context.stateUser.user.role || 'customer'); // Default to customer if role not specified
          if (initializing) setInitializing(false);
        } else if (firebaseUser) {
          // If Firebase is authenticated but Context is not, fetch user data
          const token = await AsyncStorage.getItem("jwt");
          if (!token) {
            // If no token but Firebase auth exists, we need to handle this edge case
            // This could happen if Firebase auth succeeds but backend token generation fails
            console.log('Firebase auth exists but no JWT token found');
          }
          
          // This will be handled by Auth.js useEffect which checks AsyncStorage for token
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