import { Platform } from 'react-native';
import Constants from 'expo-constants';

let baseURL = '';

// Get the device type - true if running in an emulator
const isEmulator = Constants.appOwnership === 'expo' && Constants.executionEnvironment === 'standalone';

if (Platform.OS === 'android') {
  if (isEmulator) {
    baseURL = 'http://10.0.2.2:3000/api/';
  } else {
    // Andrei's local IP address
    baseURL = 'http://192.168.1.66:3000/api/'; 

    // Joey's local IP address
    baseURL = 'http://192.168.1.253:3000/api/'
  }
} else if (Platform.OS === 'ios') {
  if (isEmulator) {
    baseURL = 'http://localhost:3000/api/';
  } else {
    baseURL = 'http://192.168.1.66:3000/api/'; 
  }
} else {
  // Web or other platforms
  baseURL = 'http://localhost:3000/api/'; 
}

console.log("Using API base URL (from baseurl.js):", baseURL);

export const testAPIConnection = async () => {
  try {
    const response = await fetch(`${baseURL}ping`, { 
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 3000
    });
    
    if (response.ok) {
      console.log('✅ API connection successful!');
      return true;
    } else {
      console.error(`❌ API returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    return false;
  }
};

export default baseURL;