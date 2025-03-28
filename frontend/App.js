import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  const handleSplashComplete = () => {
    setIsLoading(false);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={isLoading ? "light" : "dark"} />
      {isLoading ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <AppNavigator />
      )}
    </SafeAreaProvider>
  );
}
