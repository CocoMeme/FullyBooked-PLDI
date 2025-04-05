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

// Test function to check API connectivity
export const testProfileUpdate = async () => {
    try {
        console.log('Testing profile update API connectivity...');
        
        // Get the JWT token from AsyncStorage
        const token = await AsyncStorage.getItem("jwt");
        
        // Build test URL using the same baseURL
        const testUrl = baseURL.endsWith('/') 
            ? `${baseURL}users/profile-test` 
            : `${baseURL}/users/profile-test`;
        
        console.log('Making test API call to:', testUrl);
        
        const response = await fetch(testUrl, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '' // Include auth token if available
            }
        });
        
        console.log('Test response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Test error response:', errorText);
            // We'll continue even if test fails, since this is just a diagnostic step
            return { success: false, error: 'API test failed' };
        }
        
        const data = await response.json();
        console.log('Test API response:', data);
        
        return { success: true, data };
    } catch (error) {
        console.error("Test API error:", error);
        // We'll continue even if test fails, since this is just a diagnostic step
        return { success: false, error };
    }
};

export const updateUserProfile = async (userData, dispatch) => {
    try {
        // Get the JWT token from AsyncStorage
        const token = await AsyncStorage.getItem("jwt");
        if (!token) {
            throw new Error("Authentication token not found");
        }
        
        console.log('JWT token found:', token.substring(0, 10) + '...');
        
        // Prepare FormData for multipart/form-data submission
        const formData = new FormData();
        
        // Add basic profile fields
        formData.append('username', userData.username);
        formData.append('email', userData.email);
        formData.append('phone', userData.phone || '');
        
        // Add address fields as JSON
        const addressData = {
            city: userData.address?.city || '',
            country: userData.address?.country || '',
            state: userData.address?.state || '',
            zipcode: userData.address?.zipcode || ''
        };
        formData.append('address', JSON.stringify(addressData));
        
        // Handle avatar upload
        if (userData.avatar) {
            if (typeof userData.avatar === 'object' && userData.avatar.uri) {
                // If we have a local image with URI, append it to FormData
                console.log('Adding avatar image to FormData:', userData.avatar.uri);
                
                // Create an object with the expected multer properties
                formData.append('avatar', {
                    uri: userData.avatar.uri,
                    name: userData.avatar.name || 'avatar.jpg',
                    type: userData.avatar.type || 'image/jpeg'
                });
            } else if (typeof userData.avatar === 'string') {
                // If avatar is just a string URL, pass it along as-is
                if (userData.avatar.startsWith('http')) {
                    console.log('Using existing avatar URL:', userData.avatar.substring(0, 30) + '...');
                    formData.append('avatarUrl', userData.avatar);
                } else {
                    console.log('Avatar is a string but not a URL, skipping');
                }
            }
        }
        
        // Use the profile update endpoint
        const updateUrl = baseURL.endsWith('/') 
            ? `${baseURL}users/profile/update` 
            : `${baseURL}/users/profile/update`;
        
        console.log('Making API call to:', updateUrl);
        console.log('Using FormData for profile update with avatar');
        
        const response = await fetch(updateUrl, {
            method: "PUT",
            body: formData,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
                // Don't set Content-Type header - fetch will set it with correct boundary for FormData
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            
            try {
                const errorData = JSON.parse(errorText);
                console.error('API error response:', errorData);
                throw new Error(errorData.message || 'Failed to update profile');
            } catch (parseError) {
                console.error('Error parsing error response:', parseError);
                throw new Error(`Server error: ${response.status} ${errorText}`);
            }
        }
        
        const data = await response.json();
        console.log('Profile update API response:', data);
        
        // Create updated user data using the response from the server
        const updatedUserData = {
            ...userData,
            avatar: data.user.avatar || userData.avatar, // Use the Cloudinary URL from response
        };
        
        console.log('Merged user data after update:', updatedUserData);
        
        // Update the userData in AsyncStorage with the server response data
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
        
        // Get the current decoded token
        const currentToken = jwtDecode(token);
        
        // Update the context with the new user data
        dispatch(setCurrentUser(currentToken, updatedUserData));
        
        Toast.show({
            type: "success",
            text1: "Profile Updated",
            text2: "Your profile has been updated successfully!",
            visibilityTime: 3000,
            topOffset: 60,
        });
        
        return { success: true, userData: updatedUserData };
    } catch (error) {
        console.error("Error updating user profile:", error);
        
        Toast.show({
            type: "error",
            text1: "Update Failed",
            text2: error.message || "Failed to update profile. Please try again.",
            visibilityTime: 3000,
            topOffset: 60,
        });
        
        return { success: false, error };
    }
};