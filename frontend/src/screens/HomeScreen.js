import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import HeroBanner from '../components/Home Components/HeroBanner';
import SetUpAccount from '../components/Home Components/SetUpAccount';
import PopularBooks from '../components/Home Components/PopularBooks';

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Header showLogo={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HeroBanner navigation={navigation} />
        <SetUpAccount navigation={navigation} />
        <PopularBooks navigation={navigation} />
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
    padding: SIZES.large,
  },
});

export default HomeScreen;