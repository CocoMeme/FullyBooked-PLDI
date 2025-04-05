import axios from 'axios';
import baseURL from '../assets/common/baseurl';

// Test function to verify API connectivity
export const testFirebaseTokenEndpoint = async () => {
  try {
    console.log('Testing Firebase token endpoint at:', baseURL + 'users/firebase-token-check');
    
    const response = await axios.get(baseURL + 'users/firebase-token-check');
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('API Test Error:', error.message);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    });
    
    return {
      success: false,
      error: error.message,
      details: error.response?.data
    };
  }
};

// Call the test function
testFirebaseTokenEndpoint()
  .then(result => console.log('Test result:', result))
  .catch(err => console.error('Test failed:', err));
