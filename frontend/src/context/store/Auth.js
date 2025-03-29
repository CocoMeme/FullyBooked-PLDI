import React, { useEffect, useReducer, useState } from "react";
import { jwtDecode } from "jwt-decode"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth } from '../../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../../services/api';

import authReducer from "../reducers/auth.reducer";
import { setCurrentUser } from "../actions/auth.action";
import AuthGlobal from './AuthGlobal'

const Auth = props => {
    const [stateUser, dispatch] = useReducer(authReducer, {
        isAuthenticated: null,
        user: {}
    });
    const [showChild, setShowChild] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadToken = async () => {
            try {
                const token = await AsyncStorage.getItem("jwt");
                if (token) {
                    const decoded = jwtDecode(token);
                    dispatch(setCurrentUser(decoded));
                    setShowChild(true);
                    setIsLoading(false);
                    return true;
                }
                return false;
            } catch (error) {
                console.error("Error loading authentication token:", error);
                return false;
            }
        };
        
        // Handle Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Firebase user is signed in:", user.email);
                // Check if we have a JWT token already
                const hasToken = await loadToken();
                
                // If no token but Firebase user exists, try to get a token from backend
                if (!hasToken) {
                    console.log("Firebase auth exists but no JWT token found");
                    try {
                        // Request a new token from your backend using Firebase UID
                        const response = await api.post('/users/firebase-token', { 
                            email: user.email, 
                            firebaseUid: user.uid 
                        });
                        
                        if (response.data && response.data.token) {
                            // Store the token
                            await AsyncStorage.setItem("jwt", response.data.token);
                            const decoded = jwtDecode(response.data.token);
                            dispatch(setCurrentUser(decoded));
                            console.log("Successfully retrieved and stored JWT token");
                        }
                    } catch (error) {
                        console.error("Error fetching token from backend:", error);
                    }
                }
            } else {
                console.log("No Firebase user");
            }
            
            // Always show the child components, even if auth failed
            setShowChild(true);
            setIsLoading(false);
        });
        
        // Cleanup subscription
        return () => {
            unsubscribe();
            setShowChild(false);
        };
    }, []);

    if (isLoading) {
        // You could return a loading indicator here if needed
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
        )
    }
};

export default Auth