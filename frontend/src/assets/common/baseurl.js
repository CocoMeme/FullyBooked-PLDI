import { Platform } from 'react-native';

let baseURL = '';

// For local development
if (Platform.OS === 'android') {
    baseURL = 'http://192.168.1.66:3000/api/';
  } else {
    baseURL = 'http://localhost:3000/api/'; 
  }

console.log("Using API base URL:", baseURL);


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