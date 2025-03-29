import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Set the appropriate base URL depending on the platform and environment
let BASE_URL = '';

// Check if we're running in Expo Go with a tunnel
const isExpoTunnel = Constants.manifest && Constants.manifest.debuggerHost && Constants.manifest.debuggerHost.includes('tunnel');

if (isExpoTunnel) {
  // When using Expo tunnel, we don't need to use specific IP addresses
  // The API requests will be proxied through the tunnel
  BASE_URL = 'https://your-backend-url.com/api'; // Replace with your deployed backend URL if available
  
  // For development with tunnel, we still need to target localhost/backend server
  // The tunnel will handle the routing
  BASE_URL = 'http://localhost:3000/api'; // This will work through the tunnel
} else if (Platform.OS === 'android') {
  // For Android emulator, 10.0.2.2 points to host machine's localhost
  BASE_URL = 'http://10.0.2.2:3000/api';
  
  // For physical Android devices, use your computer's LAN IP address
  BASE_URL = 'http://192.168.1.66:3000/api'; // Using the IP address from your logs
} else {
  // For iOS simulator
  BASE_URL = 'http://localhost:3000/api';
}

console.log('API Base URL:', BASE_URL);

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  async (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    
    const token = await AsyncStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Including authentication token');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common responses
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status);
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response was received
      console.error('Network error - no response:', error.request);
      console.error('Target URL was:', error.config?.url);
      console.error('Network error details:', error.message);
    } else {
      // Something happened in setting up the request that triggered an error
      console.error('Request setup error:', error.message);
    }
    
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear stored credentials
      AsyncStorage.removeItem('jwt');
      // You might want to add navigation to login screen here
    }
    return Promise.reject(error);
  }
);

// Authentication related API calls
export const authAPI = {
  // Fixed path construction for URLs
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (userData) => api.post('/users/register', userData),
  googleAuth: (token) => api.post('/users/google-auth', { token }),
};

// Helper function to check connectivity
export const checkConnection = async () => {
  try {
    const response = await api.get('/ping', { timeout: 5000 }); // shorter timeout for ping
    return response.status === 200;
  } catch (error) {
    console.error('Connection check failed:', error.message);
    return false;
  }
};

export default api;