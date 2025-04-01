import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar
} from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/actions/cartActions';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import Header from '../../components/Header';
import PagerView from 'react-native-pager-view';

const { width: screenWidth } = Dimensions.get('window');

const BookDetails = ({ route, navigation }) => {
  const { bookId } = route.params;
  const dispatch = useDispatch();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const pagerRef = useRef(null);

  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const infoTranslateY = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const response = await axios.get(`${baseURL}books/${bookId}`);
      if (response.data.success) {
        setBook(response.data.book);
      } else {
        Alert.alert('Error', 'Failed to fetch book details');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch book details');
      console.error('Error fetching book details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart(book));
    Alert.alert('Success', `${book.title} has been added to your cart.`);
  };

  const renderPagination = () => {
    if (!book?.coverImage || book.coverImage.length <= 1) return null;
    return (
      <View style={styles.paginationContainer}>
        {book.coverImage.map((_, index) => (
          <View
            key={index}
            style={[styles.paginationDot, { backgroundColor: index === activeSlide ? COLORS.primary : '#D9D9D9' }]}
          />
        ))}
      </View>
    );
  };

  const formatPrice = (price) => {
    return typeof price === 'number' ? price.toFixed(2) : '0.00';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Book not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.background} barStyle="dark-content" />
      
      {/* Fixed header that's always visible */}
      <View style={styles.fixedHeader}>
        <Header 
          title={book?.title || 'Book Details'} 
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: 60 }} // Add padding for the fixed header
      >
        <View style={styles.carouselContainer}>
          <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={(e) => setActiveSlide(e.nativeEvent.position)}
          >
            {book.coverImage?.map((imageUri, index) => (
              <View key={index} style={styles.carouselItemContainer}>
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.carouselImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </PagerView>
          {renderPagination()}
        </View>

        <Animated.View 
          style={[
            styles.infoContainer,
            { transform: [{ translateY: infoTranslateY }] }
          ]}
        >
          <View style={styles.titleSection}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>by {book.author}</Text>
          </View>

          <View style={styles.categoryAndRating}>
            <View style={styles.categoryContainer}>
              <Text style={styles.category}>{book.category}</Text>
            </View>
            {book.tag && book.tag !== 'None' && (
              <View style={[
                styles.tag,
                book.tag === 'Sale' ? styles.saleTag : 
                book.tag === 'New' ? styles.newTag : 
                styles.hotTag
              ]}>
                <Text style={styles.tagText}>{book.tag}</Text>
              </View>
            )}
          </View>

          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              {book.tag === 'Sale' && book.discountPrice ? (
                <>
                  <Text style={styles.discountPrice}>${formatPrice(book.discountPrice)}</Text>
                  <Text style={styles.originalPrice}>${formatPrice(book.price)}</Text>
                </>
              ) : (
                <Text style={styles.price}>${formatPrice(book.price)}</Text>
              )}
            </View>
            <Text style={[
              styles.stockStatus,
              { color: book.stock > 0 ? COLORS.green : COLORS.error }
            ]}>
              {book.stock > 0 ? `${book.stock} copies available` : 'Out of stock'}
            </Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{book.description}</Text>
          </View>

          {book.stock > 0 && (
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={handleAddToCart}
            >
              <Ionicons name="cart-outline" size={24} color="#fff" />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pagerView: {
    width: screenWidth,
    height: screenWidth * 1.2,
  },
  carouselContainer: {
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  carouselItemContainer: {
    width: screenWidth,
    height: screenWidth * 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  carouselImage: {
    width: '80%',
    height: '80%',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    width: '100%',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  infoContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: SIZES.large,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  titleSection: {
    marginBottom: SIZES.medium,
  },
  title: {
    ...FONTS.bold,
    fontSize: SIZES.extraLarge,
    color: COLORS.onBackground,
    marginBottom: SIZES.base,
  },
  author: {
    ...FONTS.regular,
    fontSize: SIZES.large,
    color: COLORS.gray,
  },
  categoryAndRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  categoryContainer: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.base,
    marginRight: SIZES.small,
  },
  category: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  tag: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.base,
    borderRadius: SIZES.base,
  },
  saleTag: {
    backgroundColor: '#FF3B30',
  },
  newTag: {
    backgroundColor: '#007AFF',
  },
  hotTag: {
    backgroundColor: '#FF9500',
  },
  tagText: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: '#fff',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.large,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    ...FONTS.bold,
    fontSize: SIZES.extraLarge,
    color: COLORS.primary,
  },
  discountPrice: {
    ...FONTS.bold,
    fontSize: SIZES.extraLarge,
    color: COLORS.primary,
    marginRight: SIZES.base,
  },
  originalPrice: {
    ...FONTS.regular,
    fontSize: SIZES.large,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
  },
  stockStatus: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
  descriptionContainer: {
    marginBottom: SIZES.large,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
    marginBottom: SIZES.small,
  },
  description: {
    ...FONTS.regular,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    lineHeight: 24,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.medium,
    borderRadius: SIZES.base,
    marginTop: SIZES.medium,
  },
  addToCartText: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: '#fff',
    marginLeft: SIZES.small,
  },
});

export default BookDetails;