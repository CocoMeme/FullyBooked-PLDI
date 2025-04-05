import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';
import baseURL from '../assets/common/baseurl';
import { storeToken } from '../utils/secureStorage';

// Remove all direct references to SecureStore
// Use AsyncStorage only to avoid the native module error

// Ensure GoogleSignin is configured
GoogleSignin.configure({
  webClientId: '965289265275-00crng1jcruvnq9cfk51ls30qs0tt4vt.apps.googleusercontent.com',
  offlineAccess: true,
  scopes: ['profile', 'email'],
});

/**
 * Sign in with Google and handle Firebase and backend authentication.
 * @returns {Promise<Object>} User data or error
 */
export const signInWithGoogle = async () => {
  try {
    // Ensure Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign out to force account selection
    await GoogleSignin.signOut();

    // Start Google Sign-In process
    const googleUser = await GoogleSignin.signIn();
    console.log('Google Sign-In Response:', googleUser);

    // Access idToken correctly - it's nested inside data object
    const idToken = googleUser.idToken || googleUser.data?.idToken;
    console.log('ID Token:', idToken);
    if (!idToken) {
      throw new Error('No ID token found in Google Sign-In response');
    }

    // Create Firebase credential with the Google ID token
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase with the credential
    const firebaseUser = await signInWithCredential(auth, credential);
    console.log('Firebase Authentication Successful:', firebaseUser.user);

    // Get Firebase ID token for backend authentication
    const firebaseIdToken = await firebaseUser.user.getIdToken(true); // Force refresh
    if (!firebaseIdToken) {
      console.error('Firebase auth exists but no JWT token found - should request new token');
      throw new Error('Failed to retrieve Firebase ID token');
    }

    // Sync with backend
    let backendResponse;
    try {
      // Use baseURL directly instead of API_URL
      console.log('Attempting to connect to:', baseURL + 'users/firebase-token');
      
      backendResponse = await axios.post(
        baseURL + 'users/firebase-token',
        {
          email: firebaseUser.user.email,
          firebaseUid: firebaseUser.user.uid,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Add debug logging to see the full response
      console.log('Backend response:', backendResponse.data);

      // Check if the response contains a token before storing
      if (backendResponse.data && backendResponse.data.token) {
        // Store user data and token securely
        const userData = {
          ...backendResponse.data.user,
          token: backendResponse.data.token,
        };

        // Store non-sensitive user data in AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify({
          ...backendResponse.data.user,
        }));
        
        // Store token using utility function
        await storeToken(backendResponse.data.token);

        console.log('Google Sign-In and backend sync successful:', userData);
        return userData;
      } else {
        console.error('No token found in response:', backendResponse.data);
        // Return empty object instead of throwing error
        return { success: false, error: 'No authentication token returned from the server' };
      }
    } catch (error) {
      console.error('Backend sync error:', error.message || 'Unknown error');
      console.error('Backend sync error details:', {
        url: baseURL + 'users/firebase-token',
        status: error.response?.status,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        return { userNotFound: true };
      }
      
      // Return error object instead of throwing
      return { success: false, error: error.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};