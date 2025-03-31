import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Determine the appropriate base URL based on the environment
let BASE_URL = '';

// Get the device type - true if running in an emulator
const isEmulator = Constants.appOwnership === 'expo' && Constants.executionEnvironment === 'standalone';

if (Platform.OS === 'android') {
  // For Android emulator, use 10.0.2.2
  if (isEmulator) {
    BASE_URL = 'http://10.0.2.2:3000/api';
  } else {
    // For physical Android devices using Expo Go, we need your development machine's IP
    // This should be your computer's IP address on your local network
    BASE_URL = 'http://192.168.112.70:3000/api'; // Replace with your actual IP
  }
} else if (Platform.OS === 'ios') {
  // For iOS simulator, use localhost
  if (isEmulator) {
    BASE_URL = 'http://localhost:3000/api';
  } else {
    // For physical iOS devices using Expo Go
    BASE_URL = 'http://192.168.1.66:3000/api'; // Replace with your actual IP
  }
} else {
  // Web or other platforms
  BASE_URL = 'http://localhost:3000/api';
}

console.log('API Base URL (from api.js):', BASE_URL);

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
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

// Book API endpoints - make sure these match your backend routes exactly
const API_URL = {
  // Book endpoints
  GET_ALL_BOOKS: '/books',
  GET_BOOK_BY_ID: (id) => `/books/${id}`,
  CREATE_BOOK: '/books/create-book',
  UPDATE_BOOK: (id) => `/books/edit/${id}`,
  DELETE_BOOK: (id) => `/books/${id}`,
  UPLOAD_COVER: '/books/upload-cover',
  
  // Search endpoints
  SEARCH_BOOKS: (query) => `/books/search?${query}`,
};

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

// Data fetching helper function for use with search functionality
export const fetchData = async (url, options = {}) => {
  try {
    const response = await api.get(url, options);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
    throw error;
  }
};

export default BASE_URL;
export { API_URL, api };