import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  SafeAreaView,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

/**
 * Reusable header component for the app
 * @param {Object} props - Component props
 * @param {string} props.title - Header title text
 * @param {boolean} props.showBackButton - Whether to show back button
 * @param {boolean} props.showLogo - Whether to show app logo
 * @param {Function} props.onBackPress - Custom back button handler
 * @param {Object} props.rightComponent - Component to show on the right side
 * @param {Object} props.style - Additional style for the header container
 */
const Header = ({
  title,
  showBackButton = false,
  showLogo = false,
  onBackPress,
  rightComponent,
  style
}) => {
  const navigation = useNavigation();
  
  // Handle back button press
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // Get status bar height for different devices
  const STATUSBAR_HEIGHT = Platform.OS === 'ios' 
    ? Constants.statusBarHeight 
    : StatusBar.currentHeight || 0;

  return (
    <View style={styles.headerWrapper}>
      <StatusBar 
        backgroundColor={COLORS.primary} 
        barStyle="dark-content" 
        translucent={true} 
      />
      
      {/* This is the actual status bar space */}
      <View style={[styles.statusBar, { height: STATUSBAR_HEIGHT }]} />
      
      {/* This is the actual header content */}
      <View style={[styles.container, style]}>
        {/* Left side - Back button or empty space */}
        <View style={styles.leftContainer}>
          {showBackButton && (
            <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={COLORS.onBackground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Middle - Title or Logo */}
        <View style={styles.middleContainer}>
          {showLogo ? (
            <Image 
              source={require('../../assets/logo/FullyBooked-colored.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          )}
        </View>

        {/* Right side - Optional component */}
        <View style={styles.rightContainer}>
          {rightComponent && rightComponent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: COLORS.background,
    width: '100%',
  },
  statusBar: {
    backgroundColor: COLORS.background,
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: SIZES.medium,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  middleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
  },
  backButton: {
    padding: 6,
  },
  logo: {
    height: 30,
    width: 120,
  },
});

export default Header;