import React, { useEffect, useReducer, useState } from "react";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../services/api';
import { initialState } from "../reducers/auth.reducer";
import authReducer from "../reducers/auth.reducer";
import { setCurrentUser } from "../actions/auth.action";
import AuthGlobal from './AuthGlobal';
import { Alert } from 'react-native';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import { getToken, storeToken, removeToken } from '../../utils/secureStorage';

const Auth = props => {
    const [stateUser, dispatch] = useReducer(authReducer, initialState);
    const [showChild, setShowChild] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isTokenExpired = (decodedToken) => {
        if (!decodedToken.exp) return true;
        const currentTime = Date.now() / 1000;
        return decodedToken.exp < currentTime;
    };

    useEffect(() => {
        const loadToken = async () => {
            try {
                const token = await getToken();
                
                if (token) {
                    const decoded = jwtDecode(token);

                    if (isTokenExpired(decoded)) {
                        console.log("Token expired, removing...");
                        await removeToken();
                        return false;
                    }

                    console.log("Valid token found, restoring session");
                    dispatch(setCurrentUser(decoded));
                    return true;
                }
                return false;
            } catch (error) {
                console.error("Error loading authentication token:", error);
                return false;
            }
        };

        const initializeAuth = async () => {
            const hasToken = await loadToken();
            if (!hasToken) {
                console.log("No valid JWT token in AsyncStorage");
            }
        };

        initializeAuth();

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Firebase user is signed in:", user.email, user.uid);

                try {
                    const idToken = await user.getIdToken(true);
                    console.log("Firebase ID token retrieved successfully");

                    console.log("Requesting backend token for:", user.email);
                    console.log("Using baseURL:", baseURL);

                    const response = await axios.post(baseURL + 'users/firebase-token', {
                        email: user.email,
                        firebaseUid: user.uid
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });

                    console.log("Backend response:", response.status, response.statusText);

                    if (response.data && response.data.token) {
                        await storeToken(response.data.token);
                        
                        const decoded = jwtDecode(response.data.token);
                        dispatch(setCurrentUser(decoded));
                        console.log("Successfully retrieved and stored JWT token");
                    } else {
                        console.error("No token returned from backend");
                    }
                } catch (error) {
                    console.error("Error in firebase token request:", error.response?.data || error.message);
                    console.error("Error details:", {
                        status: error.response?.status,
                        statusText: error.response?.statusText,
                        data: error.response?.data,
                        url: error.config?.url
                    });

                    if (error.response?.status === 404) {
                        Alert.alert(
                            "User Not Found",
                            "It seems you haven't registered yet. Please register to continue.",
                            [
                                { text: "OK" }
                            ]
                        );
                    }
                }
            } else {
                console.log("No Firebase user");
            }

            setShowChild(true);
            setIsLoading(false);
        });

        return () => {
            unsubscribe();
            setShowChild(false);
        };
    }, []);

    if (isLoading) {
        return null;
    }

    if (!showChild) {
        return null;
    } else {
        return (
            <AuthGlobal.Provider
                value={{
                    stateUser,
                    dispatch
                }}
            >
                {props.children}
            </AuthGlobal.Provider>
        );
    }
};

export default Auth;