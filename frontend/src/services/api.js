import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../assets/common/baseurl';

// Use the baseURL directly from the imported file
console.log('API Base URL (from api.js):', baseURL);

// Create an Axios instance with a base URL
const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout
});

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`[API] ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
      
      const token = await AsyncStorage.getItem('jwt');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add timestamp to prevent caching
      config.params = {
        ...config.params,
        _t: Date.now()
      };

      return config;
    } catch (error) {
      console.error('[API] Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      console.error('[API] Response error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        await AsyncStorage.removeItem('jwt');
        // The navigation to login screen will be handled by the auth context
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('[API] Network error:', {
        message: error.message,
        url: error.config?.url,
        code: error.code
      });

      // Add more descriptive error message for network issues
      error.message = 'Unable to connect to the server. Please check your internet connection and try again.';
    } else {
      // Error in request setup
      console.error('[API] Setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Book API endpoints
const API_URL = {
  // Book endpoints
  GET_ALL_BOOKS: '/books',
  GET_BOOK_BY_ID: (id) => `/books/${id}`,
  CREATE_BOOK: '/books/create-book',
  UPDATE_BOOK: (id) => `/books/edit/${id}`,
  DELETE_BOOK: (id) => `/books/${id}`,
  UPLOAD_COVER: '/books/upload-cover',
  
  // Order endpoints
  GET_ALL_ORDERS: '/orders/all',
  GET_MY_ORDERS: '/orders/my-orders',
  PLACE_ORDER: '/orders/place',
  UPDATE_ORDER_STATUS: (id) => `/orders/update-status/${id}`,
  GET_ORDER_DETAILS: (id) => `/orders/${id}`,
};

// Authentication related API calls
export const authAPI = {
  login: (email, password) => api.post('/users/login', { email, password }),
  register: (userData) => api.post('/users/register', userData),
  googleAuth: (token) => api.post('/users/google-auth', { token }),
};

// Helper function to check connectivity with retries
export const checkConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[API] Connection check attempt ${i + 1} of ${retries}`);
      const response = await api.get('/ping', { 
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error(`[API] Connection check attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) return false;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  return false;
};

export { API_URL, api };
export default baseURL;