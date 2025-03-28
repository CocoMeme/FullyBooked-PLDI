import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../constants/theme';

// Import screens
import HomeScreen from '../screens/HomeScreen';

// Create stack navigator
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: 'FullyBooked',
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.onPrimary,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        {/* Add more screens here as you develop your app */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;