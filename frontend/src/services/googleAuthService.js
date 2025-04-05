import React, { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { WEB_CLIENT_ID } from '../../google-auth-config';
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
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setCurrentUser, googleLoginUser } from '../context/actions/auth.action';

// Initialize WebBrowser for OAuth redirects
WebBrowser.maybeCompleteAuthSession();

// Create a custom hook for Google authentication
export const useGoogleAuth = () => {
  const dispatch = useDispatch();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    redirectUri: 'https://fullybookedrn.firebaseapp.com/__/auth/handler',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      handleGoogleSignIn(id_token, dispatch);
    } else if (response?.type === 'error') {
      console.error('Google Sign-In Error:', response.error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync();

      if (result.type !== 'success') {
        console.error('Google sign-in was not successful:', result);
        throw new Error('Google sign-in was not successful');
      }

      const { id_token } = result.params;
      await handleGoogleSignIn(id_token, dispatch);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Error', 'Google sign-in failed. Please try again.');
      throw error;
    }
  };

  return {
    request,
    response,
    promptAsync,
    signInWithGoogle,
  };
};

// Handle Google Sign-In process
const handleGoogleSignIn = async (idToken, dispatch) => {
  try {
    // Create Firebase credential
    const credential = GoogleAuthProvider.credential(idToken);

    // Sign in to Firebase
    const userCredential = await signInWithCredential(auth, credential);
    console.log('Firebase Authentication Successful:', userCredential.user);

    // Get Firebase ID token
    const firebaseIdToken = await userCredential.user.getIdToken();

    // Sync with backend
    const backendResponse = await axios.post(
      `${api.baseURL}/auth/login`,
      {
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      },
      {
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!backendResponse.data.success) {
      throw new Error(backendResponse.data.message || 'Backend sync failed');
    }

    // Store user data and token
    const userData = {
      ...backendResponse.data.user,
      token: firebaseIdToken,
    };

    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    await AsyncStorage.setItem('jwt', firebaseIdToken);

    // Dispatch Redux actions
    dispatch(setCurrentUser(userData, backendResponse.data.user));
    await dispatch(
      googleLoginUser({
        user: userCredential.user,
        backendUser: backendResponse.data.user,
      })
    );

    console.log('Google Sign-In and backend sync successful.');
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    Alert.alert('Error', 'Google sign-in failed. Please try again.');
    throw error;
  }
};

export const registerWithEmailAndPassword = async (email, password, username) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    const userData = {
      username: username || `user_${user.uid.substring(0, 8)}`,
      email: user.email,
      password: password,
      firebaseUid: user.uid,
    };

    // Call your backend API to register the user
    const response = await api.post('/users/register', userData);

    // Decode the token for further use
    const decodedToken = response.data.token ? jwtDecode(response.data.token) : null;
    console.log('Decoded token after registration:', decodedToken);

    return {
      user: userCredential.user,
      token: response.data.token,
      decodedToken,
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

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    console.log('User signed out successfully.');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};