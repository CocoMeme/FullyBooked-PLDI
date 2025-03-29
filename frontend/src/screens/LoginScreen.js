import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { useGoogleAuth } from '../services/googleAuthService';
import AuthGlobal from '../context/store/AuthGlobal';
import { loginUser } from '../context/actions/auth.action';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL, { testAPIConnection } from '../assets/common/baseurl';

const LoginScreen = () => {
  const context = useContext(AuthGlobal);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const navigation = useNavigation();
  
  // Use our custom Google auth hook
  const { signInWithGoogle } = useGoogleAuth();

  // Test API connection when component mounts
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testAPIConnection();
      setConnectionStatus(isConnected);
      setConnectionTested(true);
    };
    
    checkConnection();
  }, []);

  // Check if user is already authenticated
  useEffect(() => {
    console.log("Auth state changed:", context.stateUser);
    if (context.stateUser.isAuthenticated === true) {
      console.log("User authenticated, no navigation needed here");
      // We don't need to navigate here - AppNavigator will handle switching between navigators
    }
  }, [context.stateUser.isAuthenticated]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    // Test connection again before attempting login
    setIsLoading(true);
    const isConnected = await testAPIConnection();
    
    if (!isConnected) {
      Alert.alert(
        'Connection Error',
        `Cannot connect to the server at ${baseURL}. Please check your network connection and ensure the server is running.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: () => handleLogin() 
          }
        ]
      );
      setIsLoading(false);
      return;
    }

    console.log("Login attempt with:", { email });
    
    try {
      // Using a promise wrapper around loginUser for better control
      await new Promise((resolve) => {
        loginUser({ email, password }, context.dispatch);
        // We'll resolve after a timeout to ensure we don't set isLoading false too early
        setTimeout(() => resolve(), 3000);
      });
      // No navigation needed here - AppNavigator will handle switching to the appropriate screen
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert('Error', 'Login failed. Please check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { user, token } = await signInWithGoogle();
      
      if (user && token) {
        // Store token in AsyncStorage for Context API
        await AsyncStorage.setItem("jwt", token);
        
        // No navigation needed here - the AuthContext and AppNavigator 
        // will handle the navigation automatically after token is set
        console.log("Google login successful, authentication will be handled by context");
      }
    } catch (error) {
      console.error('Google login error:', error);
      // Error already handled in signInWithGoogle function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/logo/FullyBooked-colored.png')} 
        style={styles.logo} 
        resizeMode="contain"
      />
      
      <Text style={styles.title}>Login</Text>
      
      {connectionTested && !connectionStatus && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            ⚠️ Cannot connect to server at {baseURL}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={async () => {
              const isConnected = await testAPIConnection();
              setConnectionStatus(isConnected);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.loginButton} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity 
        style={styles.googleButton}
        onPress={handleGoogleLogin}
        disabled={isLoading}
      >
        <Image 
          source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
          style={styles.googleIcon}
        />
        <Text style={styles.googleText}>Sign in with Google</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.accountText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.signupText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#B71C1C',
    flex: 1,
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: '#B71C1C',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 80,
    alignSelf: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: 10,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleText: {
    fontSize: 16,
    color: '#333',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  accountText: {
    color: '#666',
    fontSize: 14,
  },
  signupText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;