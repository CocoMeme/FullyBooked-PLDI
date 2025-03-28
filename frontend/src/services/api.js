import { Alert } from 'react-native';

// Base API URL - change this to your backend URL
const API_URL = 'http://localhost:5000/api';

// Request headers
const headers = {
  'Content-Type': 'application/json',
};

// Helper for handling API errors
const handleApiError = (error) => {
  console.error('API Error:', error);
  Alert.alert(
    'Error',
    error.message || 'Something went wrong. Please try again.',
    [{ text: 'OK' }]
  );
  return { error: true, message: error.message };
};

// Generic GET request
export const fetchData = async (endpoint, token = null) => {
  try {
    const requestHeaders = { ...headers };
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: requestHeaders,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch data');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Generic POST request
export const postData = async (endpoint, body, token = null) => {
  try {
    const requestHeaders = { ...headers };
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to post data');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Generic PUT request
export const updateData = async (endpoint, body, token = null) => {
  try {
    const requestHeaders = { ...headers };
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: requestHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update data');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Generic DELETE request
export const deleteData = async (endpoint, token = null) => {
  try {
    const requestHeaders = { ...headers };
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: requestHeaders,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete data');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error);
  }
};