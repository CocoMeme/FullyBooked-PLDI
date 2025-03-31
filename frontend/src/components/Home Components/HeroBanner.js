import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const HeroBanner = ({ navigation }) => {
  return (
    <ImageBackground 
      source={require('../../../assets/splash-icon.png')} 
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>Discover Your Next Favorite Book</Text>
        <Text style={styles.subtitle}>Explore our vast collection of books for every reader</Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Books')}
        >
          <Text style={styles.buttonText}>Browse Now</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 280,
    width: '100%',
    marginVertical: SIZES.medium,
    borderRadius: SIZES.medium,
    overflow: 'hidden',
  },
  backgroundImage: {
    opacity: 0.7,
    backgroundColor: COLORS.secondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.extraLarge,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.extraLarge,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SIZES.extraLarge,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.extraLarge,
    borderRadius: SIZES.base,
  },
  buttonText: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
    color: COLORS.white,
  }
});

export default HeroBanner;