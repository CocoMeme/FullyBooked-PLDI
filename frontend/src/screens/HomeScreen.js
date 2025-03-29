import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Button from '../components/Button';
import Header from '../components/Header';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Header showLogo={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to FullyBooked</Text>
          <Text style={styles.subtitle}>Your one-stop booking solution</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.description}>
            Explore our services and make bookings with ease. We provide a seamless
            experience for all your booking needs.
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button 
              title="Get Started" 
              onPress={() => navigation.navigate('Books')} 
              style={styles.button}
            />
            <Button 
              title="Learn More" 
              variant="outline" 
              onPress={() => console.log('Learn More pressed')} 
              style={styles.button}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SIZES.extraLarge,
  },
  header: {
    marginBottom: SIZES.extraLarge * 2,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.extraLarge * 1.5,
    color: COLORS.primary,
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.medium,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
  },
  content: {
    flex: 1,
  },
  description: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    marginBottom: SIZES.extraLarge * 2,
    lineHeight: SIZES.large * 1.5,
  },
  buttonContainer: {
    marginTop: SIZES.large,
  },
  button: {
    marginBottom: SIZES.medium,
  },
});

export default HomeScreen;