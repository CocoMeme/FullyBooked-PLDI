import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import Header from '../Header';

const WriteReview = ({ route, navigation }) => {
  const { product, orderId, orderNumber } = route.params;
  
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      return Alert.alert('Error', 'Please select a rating before submitting.');
    }

    if (reviewText.trim().length < 5) {
      return Alert.alert('Error', 'Please write a more detailed review.');
    }
    
    try {
      setLoading(true);
      
      // In a real app, this would be an API call to save the review
      // For demo purposes, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success alert
      Alert.alert(
        'Review Submitted',
        'Thank you for your feedback!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Write a Review" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.productInfo}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImageText}>{product?.title.charAt(0)}</Text>
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productTitle}>{product?.title}</Text>
            <Text style={styles.orderInfo}>Order #{orderNumber}</Text>
          </View>
        </View>
        
        <View style={styles.ratingContainer}>
          <Text style={styles.sectionTitle}>Rate this product</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity 
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Text style={[
                  styles.starIcon, 
                  star <= rating ? styles.starFilled : styles.starEmpty
                ]}>
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 ? 'Tap to rate' : 
              rating === 1 ? 'Poor' :
              rating === 2 ? 'Fair' :
              rating === 3 ? 'Good' :
              rating === 4 ? 'Very Good' : 'Excellent'}
          </Text>
        </View>
        
        <View style={styles.reviewContainer}>
          <Text style={styles.sectionTitle}>Write your review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your thoughts about this product..."
            placeholderTextColor={COLORS.onBackground + '80'}
            multiline={true}
            numberOfLines={6}
            value={reviewText}
            onChangeText={setReviewText}
          />
          <Text style={styles.charCount}>
            {reviewText.length} / 500 characters
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.submitButton,
            loading && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitReview}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
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
    padding: SIZES.medium,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
  },
  productImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: COLORS.lightGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  productImageText: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
    marginBottom: 4,
  },
  orderInfo: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground + '80',
  },
  ratingContainer: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
    alignItems: 'center',
  },
  sectionTitle: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
    marginBottom: SIZES.medium,
    alignSelf: 'flex-start',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SIZES.small,
  },
  starButton: {
    padding: SIZES.small,
  },
  starIcon: {
    fontSize: 36,
  },
  starEmpty: {
    color: COLORS.lightGrey,
  },
  starFilled: {
    color: COLORS.warning,
  },
  ratingText: {
    ...FONTS.medium,
    color: COLORS.onBackground,
    marginTop: SIZES.small,
  },
  reviewContainer: {
    backgroundColor: '#fff',
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    marginBottom: SIZES.medium,
  },
  reviewInput: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: SIZES.small / 2,
    padding: SIZES.small,
    height: 150,
    textAlignVertical: 'top',
  },
  charCount: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground + '80',
    marginTop: SIZES.small / 2,
    textAlign: 'right',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.small,
    padding: SIZES.medium,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.primary + '80',
  },
  submitButtonText: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: '#fff',
  },
});

export default WriteReview;