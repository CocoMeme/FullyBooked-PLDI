import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { Alert } from 'react-native';
import { auth } from './firebaseConfig';
import { api } from './api';
import { jwtDecode } from 'jwt-decode';

// Initialize WebBrowser for OAuth redirects
WebBrowser.maybeCompleteAuthSession();

// Create a custom hook for Google authentication
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '965289265275-00crng1jcruvnq9cfk51ls30qs0tt4vt.apps.googleusercontent.com',
    redirectUri: 'https://fullybookedrn.firebaseapp.com/__/auth/handler',
  });

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();
      
      if (result.type !== 'success') {
        throw new Error('Google sign-in was not successful');
      }

      const { id_token } = result.params;
      
      // Create a Google credential with the token
      const credential = GoogleAuthProvider.credential(id_token);
      
      let userCredential;
      try {
        // Try to sign in to Firebase with the credential
        userCredential = await signInWithCredential(auth, credential);
      } catch (firebaseError) {
        console.error('Firebase sign-in error:', firebaseError);
        if (firebaseError.code === 'auth/account-exists-with-different-credential') {
          Alert.alert('Error', 'An account already exists with the same email address but different sign-in credentials.');
        } else {
          Alert.alert('Error', 'Firebase authentication failed. Please try again.');
        }
        throw firebaseError;
      }
      
      // Check if user exists in our backend, if not create one
      const isNewUser = userCredential.additionalUserInfo?.isNewUser;
      
      if (isNewUser) {
        const { user } = userCredential;
        
        const userData = {
          username: user.displayName || `user_${user.uid.substring(0, 8)}`,
          email: user.email,
          password: `Firebase_${Math.random().toString(36).slice(-8)}`, // Generate a random password
          firebaseUid: user.uid
        };
        
        try {
          const response = await api.post('/users/register', userData);
          const decodedToken = response.data.token ? jwtDecode(response.data.token) : null;
          
          return { 
            user: userCredential.user, 
            token: response.data.token,
            decodedToken
          };
        } catch (error) {
          console.error('Backend registration error:', error);
          Alert.alert('Error', 'Failed to register in our system. Please try again.');
          await firebaseSignOut(auth);
          throw error;
        }
      } else {
        try {
          const { user } = userCredential;

          const response = await api.post('/users/google-auth', { 
            email: user.email, 
            firebaseUid: user.uid 
          });

          const decodedToken = response.data.token ? jwtDecode(response.data.token) : null;
          
          return { 
            user: userCredential.user,
            token: response.data.token,
            decodedToken 
          };
        } catch (error) {
          console.error('Error fetching user token:', error);
          Alert.alert('Error', 'Authentication failed. Please try again.');
          throw error;
        }
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        Alert.alert('Error', 'An account already exists with the same email address but different sign-in credentials.');
      } else {
        Alert.alert('Error', 'Google sign-in failed. Please try again.');
      }
      
      throw error;
    }
  };


  const registerWithEmailAndPassword = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      const userData = {
        username: username || `user_${user.uid.substring(0, 8)}`,
        email: user.email,
        password: password,
        firebaseUid: user.uid
      };
      
      // Call your backend API to register the user
      const response = await api.post('/users/register', userData);
      
      // For Context API integration - properly decode the token
      const decodedToken = response.data.token ? jwtDecode(response.data.token) : null;
      console.log('Decoded token after registration:', decodedToken);
      
      return { 
        user: userCredential.user, 
        token: response.data.token,
        decodedToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Clean up Firebase user if backend registration fails
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Email is already in use. Please try logging in instead.');
      } else {
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
      
      throw error;
    }
  };

  return {
    request,
    response,
    promptAsync,
    signInWithGoogle,
    registerWithEmailAndPassword
  };
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};