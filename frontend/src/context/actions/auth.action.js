import { jwtDecode } from "jwt-decode"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Toast from "react-native-toast-message"
import baseURL from "../../assets/common/baseurl"

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
        .then((data) => {
            console.log("Login response data:", data);
            if (data && data.token) {
                const token = data.token;
                AsyncStorage.setItem("jwt", token)
                    .then(() => {
                        console.log("Token stored in AsyncStorage");
                        const decoded = jwtDecode(token);
                        console.log("Decoded token:", decoded);
                        dispatch(setCurrentUser(decoded, user));
                        
                        Toast.show({
                            type: "success",
                            text1: "Login Successful",
                            text2: "Welcome back!",
                            visibilityTime: 3000,
                            topOffset: 60,
                        });
                    })
                    .catch(err => {
                        console.error("Failed to store token:", err);
                    });
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
    
    fetch(userUrl, {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
        },
    })
    .then((res) => res.json())
    .then((data) => console.log(data))
    .catch((err) => console.error("Error fetching user profile:", err));
}

export const logoutUser = (dispatch) => {
    AsyncStorage.removeItem("jwt")
        .then(() => {
            console.log("Token removed from AsyncStorage");
            dispatch(setCurrentUser({}));
        })
        .catch(err => {
            console.error("Error removing token:", err);
        });
}

export const setCurrentUser = (decoded, user) => {
    return {
        type: SET_CURRENT_USER,
        payload: decoded,
        userProfile: user
    }
}