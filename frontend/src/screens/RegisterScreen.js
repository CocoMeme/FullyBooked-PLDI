import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoogleAuth } from '../services/googleAuthService';
import AuthGlobal from '../context/store/AuthGlobal';
import { loginUser, setCurrentUser } from '../context/actions/auth.action';
import { api, authAPI } from '../services/api'; // Fixed import to use named export
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL, { testAPIConnection } from '../assets/common/baseurl';
import { jwtDecode } from 'jwt-decode';

const RegisterScreen = () => {
  const context = useContext(AuthGlobal);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(null);
  const [hidePassword, setHidePassword] = useState(true);
  const [hideConfirmPassword, setHideConfirmPassword] = useState(true);
  const navigation = useNavigation();
  
  // Use our custom Google auth hook - now with registerWithEmailAndPassword
  const { signInWithGoogle, registerWithEmailAndPassword } = useGoogleAuth();

  // Test server connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        setNetworkStatus('checking');
        
        // Use the testAPIConnection function from baseurl.js instead of direct axios call
        const isConnected = await testAPIConnection();
        
        if (isConnected) {
          setNetworkStatus('connected');
          console.log('✅ Server connection successful');
        } else {
          setNetworkStatus('failed');
          console.error('❌ Server connection failed');
        }
      } catch (error) {
        setNetworkStatus('failed');
        console.error('❌ Server connection failed:', error);
        
        // Show connection error to user
        Alert.alert(
          'Connection Error',
          `Cannot connect to server at ${baseURL}. Please check your network and server.`,
          [
            { text: 'Retry', onPress: testConnection },
            { text: 'OK' }
          ]
        );
      }
    };
    
    testConnection();
  }, []);

  // Check if user is already authenticated
  useEffect(() => {
    if (context.stateUser.isAuthenticated === true) {
      // No need to navigate manually - AppNavigator will handle automatically
      console.log("User authenticated in RegisterScreen, no direct navigation needed");
    }
  }, [context.stateUser.isAuthenticated]);

  const handleRegister = async () => {
    // Validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the new Firebase registration function instead of direct API call
      const { user, token, decodedToken } = await registerWithEmailAndPassword(email, password, username);
      
      console.log('Registration successful!');
      
      // After successful registration, update context with token
      if (token) {
        await AsyncStorage.setItem("jwt", token);
        
        // IMPORTANT: Update the auth context with the decoded token
        if (decodedToken) {
          context.dispatch(setCurrentUser(decodedToken, {
            email: email,
            username: username
          }));
        }
        
        Alert.alert('Success', 'Registration successful!');
      } else {
        Alert.alert('Success', 'Registration successful! Please login.');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Error handling is already done in registerWithEmailAndPassword function
      // Any additional error handling can be added here if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      const { user, token, decodedToken } = await signInWithGoogle();
      
      if (user && token) {
        // Store token in AsyncStorage for Context API
        await AsyncStorage.setItem("jwt", token);
        
        // IMPORTANT: Update the auth context with the decoded token
        if (decodedToken) {
          context.dispatch(setCurrentUser(decodedToken, {
            email: user.email,
            username: user.displayName || `user_${user.uid.substring(0, 8)}`
          }));
        }
        
        // The signInWithGoogle function already handles registration if user is new
        Alert.alert('Success', 'Registration successful!');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      // Error already handled in signInWithGoogle function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Image 
          source={require('../../assets/logo/FullyBooked-colored.png')} 
          style={styles.logo} 
          resizeMode="contain"
        />
        
        <Text style={styles.title}>Create Account</Text>
        
        {networkStatus === 'failed' && (
          <View style={styles.networkError}>
            <Text style={styles.networkErrorText}>
              ⚠️ Cannot connect to server. Please check your connection.
            </Text>
          </View>
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={hidePassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setHidePassword(!hidePassword)}
          >
            <Ionicons 
              name={hidePassword ? 'eye-off-outline' : 'eye-outline'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={hideConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setHideConfirmPassword(!hideConfirmPassword)}
          >
            <Ionicons 
              name={hideConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={isLoading || networkStatus === 'failed'}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.registerText}>Create Account</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity 
          style={styles.googleButton}
          onPress={handleGoogleSignUp}
          disabled={isLoading}
        >
          <Image 
            source={{ uri: 'https://img.icons8.com/color/48/000000/google-logo.png' }}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Sign up with Google</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.accountText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  networkError: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  networkErrorText: {
    color: '#B71C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
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
    marginTop: 40,
    marginBottom: 20,
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
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  registerText: {
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  accountText: {
    color: '#666',
    fontSize: 14,
  },
  loginText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  passwordContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
});

export default RegisterScreen;