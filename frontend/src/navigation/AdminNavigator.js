import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminHomeScreen from '../screens/Admin/AdminHomeScreen';
import ProductManagement from '../screens/Admin/ProductManagement';
import UserManagement from '../screens/Admin/UserManagement';
import OrderManagement from '../screens/Admin/OrderManagement';

const Stack = createStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="ProductManagement" component={ProductManagement} />
      <Stack.Screen name="UserManagement" component={UserManagement} />
      <Stack.Screen name="OrderManagement" component={OrderManagement} />
      <Stack.Screen name="AdminBooks" component={ProductManagement} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;