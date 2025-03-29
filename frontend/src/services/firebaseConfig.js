// Import Firebase JS SDK instead of React Native Firebase
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration with your provided details
const firebaseConfig = {
  apiKey: "AIzaSyBZMhZGNXAbYBU6lOZt6I-AiRcLNVbQqss",
  authDomain: "fullybookedrn.firebaseapp.com",
  projectId: "fullybookedrn",
  storageBucket: "fullybookedrn.appspot.com",
  messagingSenderId: "965289265275",
  appId: "1:965289265275:android:5286c4fee3ff0c932a3ade",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { app, auth };