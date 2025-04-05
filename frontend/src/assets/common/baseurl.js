import { Platform } from 'react-native';
import Constants from 'expo-constants';

let baseURL = '';

// Check if running in Expo Go
const isExpo = Constants.appOwnership === 'expo';
// Get the device type - true if running in an emulator
const isEmulator = Constants.executionEnvironment === 'storeClient';

if (Platform.OS === 'android') {
  if (isEmulator) {
    baseURL = 'http://192.168.1.66:3000/api/';
    // baseURL = 'http://10.0.2.2:3000/api/';
  } else {
    baseURL = 'http://192.168.1.66:3000/api/';

    // Joey's local IP address
    // baseURL = 'http://192.168.1.253:3000/api/'

  }
} else if (Platform.OS === 'ios') {
  if (isEmulator) {
    baseURL = 'http://localhost:3000/api/';
  } else {
    // Use local network IP for physical devices
    baseURL = 'http://192.168.1.66:3000/api/';
  }
} else {
  // Web platform
  baseURL = 'http://localhost:3000/api/';
}

console.log('API Base URL:', baseURL, {
  platform: Platform.OS,
  isExpo,
  isEmulator
});

export const testAPIConnection = async () => {
  try {
    console.log('Testing API connection to:', baseURL);
    const response = await fetch(`${baseURL}ping`, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ API connection successful');
      return true;
    } else {
      console.error(`❌ API returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

export default baseURL;