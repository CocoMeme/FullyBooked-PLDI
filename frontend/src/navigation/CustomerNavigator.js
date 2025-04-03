import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import BooksScreen from '../screens/BooksScreen';
import CartScreen from '../screens/CartScreen';
import NotificationScreen from '../screens/NotificationScreen';
import AccountScreen from '../screens/AccountScreen';
import BookDetails from '../components/Book Components/BookDetails';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create individual stack navigators for each tab to enable nested navigation
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeScreen" component={HomeScreen} />
    <Stack.Screen name="BookDetails" component={BookDetails} />
  </Stack.Navigator>
);

const BooksStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BooksScreen" component={BooksScreen} />
    <Stack.Screen name="BookDetails" component={BookDetails} />
  </Stack.Navigator>
);

const CartStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CartScreen" component={CartScreen} />
    {/* Add checkout screen here later */}
  </Stack.Navigator>
);

const NotificationStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
  </Stack.Navigator>
);

const AccountStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AccountScreen" component={AccountScreen} />
    <Stack.Screen name="MyOrders" component={require('../screens/Account Menu Screens/MyOrdersScreen').default} />
    <Stack.Screen name="OrderDetails" component={require('../components/Account Components/OrderDetails').default} />
    <Stack.Screen name="WriteReview" component={require('../components/Account Components/WriteReview').default} />
    {/* <Stack.Screen name="EditProfile" component={EditProfileScreen} /> */}
    {/* Add more profile-related screens here later */}
  </Stack.Navigator>
);

const CustomerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Books') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Books" component={BooksStack} />
      <Tab.Screen name="Cart" component={CartStack}
        options={{
          tabBarBadge: null, // This will be dynamically updated with cart count
        }}
      />
      <Tab.Screen name="Notifications" component={NotificationStack}
        options={({ navigation }) => ({

          tabBarBadge: 2, // Static badge for demonstration, make it dynamic in real app
        })}
      />
      <Tab.Screen name="Account" component={AccountStack} />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;