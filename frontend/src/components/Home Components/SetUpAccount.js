import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const SetUpAccount = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Your Account Setup</Text>
        <Text style={styles.description}>
          Personalize your experience to get tailored book recommendations 
          and exclusive offers.
        </Text>
        
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.benefitText}>Personalized recommendations</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.benefitText}>Special member discounts</Text>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={styles.benefitIcon}>
              <Text style={styles.iconText}>✓</Text>
            </View>
            <Text style={styles.benefitText}>Save your reading preferences</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Account')}
        >
          <Text style={styles.buttonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>
      
      <Image 
        source={require('../../../assets/logo/FullyBooked-colored.png')} 
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightBackground || '#f8f9fa',
    borderRadius: SIZES.medium,
    padding: SIZES.large,
    marginVertical: SIZES.medium,
    overflow: 'hidden',
  },
  content: {
    flex: 3,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
    marginBottom: SIZES.small,
  },
  description: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    marginBottom: SIZES.medium,
  },
  benefitsContainer: {
    marginBottom: SIZES.medium,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small / 2,
  },
  benefitIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.small,
  },
  iconText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  benefitText: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base,
    paddingHorizontal: SIZES.medium,
    borderRadius: SIZES.base,
    alignSelf: 'flex-start',
  },
  buttonText: {
    ...FONTS.semiBold,
    fontSize: SIZES.small,
    color: COLORS.white,
  },
  image: {
    flex: 1,
    height: '100%',
  },
});

export default SetUpAccount;