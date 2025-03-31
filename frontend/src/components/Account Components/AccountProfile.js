import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  ScrollView,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import AuthGlobal from '../../context/store/AuthGlobal';
import { updateUserProfile } from '../../context/actions/auth.action';
import * as ImagePicker from 'expo-image-picker';
import Button from '../Button';
import { useNavigation } from '@react-navigation/native';

// Default avatar image
const DEFAULT_AVATAR = 'https://via.placeholder.com/150';

const AccountProfile = ({ onComplete }) => {
  const context = useContext(AuthGlobal);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // User data state
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    phone: '',
    avatar: '',
    address: {
      city: '',
      country: '',
      state: '',
      zipcode: '',
    },
  });

  useEffect(() => {
    loadUserData();
    requestMediaLibraryPermission();
  }, []);

  // Load user data from context or API
  const loadUserData = () => {
    try {
      setLoading(true);
      const user = context.stateUser.user;
      const userProfile = context.stateUser.userProfile;
      
      console.log('Loading profile data from context:', { user, userProfile });
      
      // Build user data from both context sources
      const combinedUserData = {
        id: user?.id || userProfile?.id,
        username: userProfile?.username || user?.username || '',
        email: userProfile?.email || user?.email || '',
        phone: userProfile?.phone || user?.phone || '',
        avatar: userProfile?.avatar || user?.avatar || DEFAULT_AVATAR,
        address: {
          city: userProfile?.address?.city || user?.address?.city || '',
          country: userProfile?.address?.country || user?.address?.country || '',
          state: userProfile?.address?.state || user?.address?.state || '',
          zipcode: userProfile?.address?.zipcode || user?.address?.zipcode || '',
        }
      };
      
      console.log('Combined user data:', combinedUserData);
      setUserData(combinedUserData);
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Request media library permissions for image picking
  const requestMediaLibraryPermission = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images!');
      }
    }
  };

  // Image picker function
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.cancelled && result.assets && result.assets.length > 0) {
        // In a production app, you would upload this image to your server
        // and get a URL back to store in the userData state
        setUserData({
          ...userData,
          avatar: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image. Please try again.');
    }
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    if (field.includes('.')) {
      // Handle nested fields (address)
      const [parent, child] = field.split('.');
      setUserData({
        ...userData,
        [parent]: {
          ...userData[parent],
          [child]: value,
        },
      });
    } else {
      // Handle top-level fields
      setUserData({
        ...userData,
        [field]: value,
      });
    }
  };

  // Submit form data
  const handleSubmit = async () => {
    // Validation
    if (!userData.username.trim() || !userData.email.trim()) {
      return Alert.alert('Error', 'Username and email are required.');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return Alert.alert('Error', 'Please enter a valid email address.');
    }

    setUpdateLoading(true);

    try {
      // Use our new updateUserProfile action to update the user profile
      // Include user ID from context if available
      const updatedUserData = {
        ...userData,
        id: context.stateUser.user.id, // Pass the user ID if needed for API call
      };
      
      const result = await updateUserProfile(updatedUserData, context.dispatch);
      
      if (result.success) {
        // Call onComplete if provided (for modal)
        if (onComplete) {
          onComplete();
        } else {
          // Legacy support for when used in a separate screen
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.avatarSection}>
        <Image
          source={{ uri: userData.avatar || DEFAULT_AVATAR }}
          style={styles.avatar}
        />
        <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formSectionTitle}>Account Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={userData.username}
            onChangeText={(text) => handleChange('username', text)}
            placeholder="Enter your username"
            placeholderTextColor={COLORS.onBackground + '80'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={userData.email}
            onChangeText={(text) => handleChange('email', text)}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.onBackground + '80'}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={userData.phone}
            onChangeText={(text) => handleChange('phone', text)}
            placeholder="Enter your phone number"
            placeholderTextColor={COLORS.onBackground + '80'}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={[styles.formSectionTitle, { marginTop: SIZES.large }]}>Address Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Country</Text>
          <TextInput
            style={styles.input}
            value={userData.address.country}
            onChangeText={(text) => handleChange('address.country', text)}
            placeholder="Enter your country"
            placeholderTextColor={COLORS.onBackground + '80'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>State/Province</Text>
          <TextInput
            style={styles.input}
            value={userData.address.state}
            onChangeText={(text) => handleChange('address.state', text)}
            placeholder="Enter your state/province"
            placeholderTextColor={COLORS.onBackground + '80'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={userData.address.city}
            onChangeText={(text) => handleChange('address.city', text)}
            placeholder="Enter your city"
            placeholderTextColor={COLORS.onBackground + '80'}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Zip Code</Text>
          <TextInput
            style={styles.input}
            value={userData.address.zipcode}
            onChangeText={(text) => handleChange('address.zipcode', text)}
            placeholder="Enter your zip code"
            placeholderTextColor={COLORS.onBackground + '80'}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <Button
          title="Cancel"
          onPress={() => onComplete ? onComplete() : navigation.goBack()}
          style={styles.cancelButton}
          variant="outline"
        />
        <Button
          title={updateLoading ? "Updating..." : "Save Changes"}
          onPress={handleSubmit}
          style={styles.saveButton}
          disabled={updateLoading}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.medium,
    paddingBottom: SIZES.extra_large * 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SIZES.small,
  },
  changePhotoButton: {
    padding: SIZES.small,
  },
  changePhotoText: {
    ...FONTS.medium,
    color: COLORS.primary,
    fontSize: SIZES.medium,
  },
  formSection: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
  },
  formSectionTitle: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    marginBottom: SIZES.medium,
  },
  formGroup: {
    marginBottom: SIZES.medium,
  },
  label: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    marginBottom: SIZES.small / 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: SIZES.small / 2,
    padding: SIZES.small,
    ...FONTS.regular,
    fontSize: SIZES.medium,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: SIZES.small / 2,
  },
  saveButton: {
    flex: 1,
    marginLeft: SIZES.small / 2,
  },
});

export default AccountProfile;