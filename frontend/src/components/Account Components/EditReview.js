import React, { useState, useEffect } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { updateReview } from '../../redux/actions/reviewActions';
import axios from 'axios';
import { api } from '../../services/api';

const EditReview = ({ route, navigation }) => {
  const { product, orderId } = route.params;

  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(null);
  const [reviewId, setReviewId] = useState(null);

  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  // Fetch the existing review when component mounts
  useEffect(() => {
    const fetchExistingReview = async () => {
      try {
        setLoading(true);
        // Fetch the user's review for this product
        const response = await api.get(`/reviews/user/${user._id}/book/${product._id}`);
        
        if (response.data && response.data.review) {
          const reviewData = response.data.review;
          setReview(reviewData);
          setReviewId(reviewData._id);
          setRating(reviewData.rating);
          setReviewText(reviewData.comment);
          console.log('Existing review found:', reviewData);
        } else {
          // If no review is found, show an error
          console.log('No existing review found');
          Alert.alert('Error', 'Could not find your review for this product.');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error fetching review:', error);
        Alert.alert('Error', 'Failed to load your review. Please try again.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchExistingReview();
  }, [product._id, user._id]);

  const handleUpdateReview = async () => {
    if (rating === 0) {
      return Alert.alert('Error', 'Please select a rating.');
    }

    if (reviewText.trim().length < 5) {
      return Alert.alert('Error', 'Please write a more detailed review.');
    }

    try {
      setSubmitting(true);

      // Dispatch action to update the review
      await dispatch(updateReview({
        reviewId,
        rating,
        comment: reviewText,
      }));

      // Update the order item to mark it as reviewed
      await api.patch(`/orders/${orderId}/item/${product._id}/reviewed`, {
        isReviewed: true
      });

      Alert.alert(
        'Review Updated',
        'Your review has been updated successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating review:', error);
      Alert.alert('Error', 'Failed to update review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Edit Review" 
          showBackButton={true} 
          onBackPress={() => navigation.goBack()} 
        />
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your review...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Edit Review" 
        showBackButton={true} 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.productInfo}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImageText}>{product?.title?.charAt(0)}</Text>
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productTitle}>{product?.title}</Text>
            <Text style={styles.orderInfo}>Order #{orderId}</Text>
          </View>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.sectionTitle}>Update your rating</Text>
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
          <Text style={styles.sectionTitle}>Update your review</Text>
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
            submitting && styles.submitButtonDisabled
          ]}
          onPress={handleUpdateReview}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Review</Text>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginTop: SIZES.small,
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
    fontSize: SIZES.medium,
    marginTop: SIZES.small / 2,
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

export default EditReview;