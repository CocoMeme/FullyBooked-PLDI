import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import * as Font from 'expo-font';
import store from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';
import Auth from './src/context/store/Auth';
import Toast from 'react-native-toast-message';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Load custom fonts
  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Poppins-Light': require('./assets/fonts/Poppins-Light.ttf'),
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Fallback to system fonts if loading fails
        setFontsLoaded(true);
      }
    }
    
    loadFonts();
  }, []);
  
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
            <AppNavigator />
          )}
          <Toast />
        </SafeAreaProvider>
      </Auth>
    </ReduxProvider>
  );
}
