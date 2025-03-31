import { jwtDecode } from "jwt-decode"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message"
import baseURL from "../../assets/common/baseurl"
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';

export const SET_CURRENT_USER = "SET_CURRENT_USER";

export const loginUser = (user, dispatch) => {
    console.log("Attempting login with baseURL:", baseURL);
    console.log("Login credentials:", { email: user.email });
    
    // Using more resilient fetch with timeout
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 8000)
    );
    
    // Make sure we have the correct URL format with proper slash handling
    const loginUrl = baseURL.endsWith('/') ? `${baseURL}users/login` : `${baseURL}/users/login`;
    console.log("Login URL:", loginUrl);
    
    const fetchPromise = fetch(loginUrl, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    
    Promise.race([fetchPromise, timeoutPromise])
        .then((res) => {
            console.log("Login response status:", res.status);
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(async (data) => {
            console.log("Login response data:", data);
            if (data && data.token) {
                const token = data.token;
                try {
                    // Store the token
                    await AsyncStorage.setItem("jwt", token);
                    console.log("Token stored in AsyncStorage");
                    
                    // Store user data separately
                    const userData = data.user || {
                        email: user.email,
                        username: data.username || user.email.split('@')[0]
                    };
                    
                    await AsyncStorage.setItem("userData", JSON.stringify(userData));
                    console.log("User data stored in AsyncStorage");
                    
                    // Decode token and dispatch to context
                    const decoded = jwtDecode(token);
                    dispatch(setCurrentUser(decoded, userData));
                    
                    Toast.show({
                        type: "success",
                        text1: "Login Successful",
                        text2: "Welcome back!",
                        visibilityTime: 3000,
                        topOffset: 60,
                    });
                } catch (err) {
                    console.error("Failed to store auth data:", err);
                }
            } else {
                console.error("Login failed: No token in response");
                Toast.show({
                    type: "error",
                    text1: "Login Failed",
                    text2: "Invalid credentials or server error",
                    visibilityTime: 3000,
                    topOffset: 60,
                });
                logoutUser(dispatch);
            }
        })
        .catch((err) => {
            console.error("Login error:", err);
            
            // Show specific error messages based on error type
            let errorMessage = "Please check your connection and credentials";
            
            if (err.message.includes('Network request failed')) {
                errorMessage = "Network error. Please check your connection and server status.";
            } else if (err.message.includes('timed out')) {
                errorMessage = "Server is taking too long to respond. Please try again.";
            }
            
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Login Failed",
                text2: errorMessage,
                visibilityTime: 3000,
            });
            logoutUser(dispatch);
        });
};

export const getUserProfile = (id) => {
    // Fix URL construction here too
    const userUrl = baseURL.endsWith('/') ? `${baseURL}users/${id}` : `${baseURL}/users/${id}`;
    
    return fetch(userUrl, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
    })
    .then((res) => res.json())
    .then((data) => {
        console.log("User data fetched:", data);
        return data;
    })
    .catch((err) => {
        console.error("Error fetching user profile:", err);
        return null;
    });
}

export const logoutUser = (dispatch) => {
    // Sign out from Firebase first
    try {
        firebaseSignOut(auth)
            .then(() => console.log("Firebase signout successful"))
            .catch(err => console.error("Firebase signout error:", err));
    } catch (fbErr) {
        console.error("Error during Firebase signout:", fbErr);
    }
    
    // Clear auth data from AsyncStorage
    Promise.all([
        AsyncStorage.removeItem("jwt"),
        AsyncStorage.removeItem("userData")
    ])
        .then(() => {
            console.log("Auth data removed from AsyncStorage");
            dispatch(setCurrentUser({}));
        })
        .catch(err => {
            console.error("Error removing auth data:", err);
        });
}

export const setCurrentUser = (decoded, user) => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded,
        userProfile: user
    }
}