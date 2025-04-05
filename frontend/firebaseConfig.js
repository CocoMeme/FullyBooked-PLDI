import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjyV7bjj4LXwcdWO93U5ez4JWjK9nclEk",
  authDomain: "fullybookedrn.firebaseapp.com",
  projectId: "fullybookedrn",
  storageBucket: "fullybookedrn.appspot.com",
  messagingSenderId: "965289265275",
  appId: "1:965289265275:web:9d5d346f0e3549ae2a3ade",
  measurementId: "G-04NM94MBPL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);