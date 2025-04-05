import AsyncStorage from '@react-native-async-storage/async-storage';

// Token storage key
export const TOKEN_KEY = 'jwt';

// Store a token - using AsyncStorage since SecureStore has issues
export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    console.log('Token stored in AsyncStorage');
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
};

// Get a token from storage
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

// Remove a token from storage
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    console.log('Token removed from storage');
    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};
