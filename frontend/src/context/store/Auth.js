import React, { useEffect, useReducer, useState } from "react";
import { jwtDecode } from "jwt-decode"
import AsyncStorage from '@react-native-async-storage/async-storage'

import authReducer from "../reducers/auth.reducer";
import { setCurrentUser } from "../actions/auth.action";
import AuthGlobal from './AuthGlobal'

const Auth = props => {
    const [stateUser, dispatch] = useReducer(authReducer, {
        isAuthenticated: null,
        user: {}
    });
    const [showChild, setShowChild] = useState(false);

    useEffect(() => {
        const loadToken = async () => {
            try {
                setShowChild(true);
                const token = await AsyncStorage.getItem("jwt");
                if (token) {
                    const decoded = jwtDecode(token);
                    dispatch(setCurrentUser(decoded));
                }
            } catch (error) {
                console.error("Error loading authentication token:", error);
            }
        };
        
        loadToken();
        return () => setShowChild(false);
    }, []);

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