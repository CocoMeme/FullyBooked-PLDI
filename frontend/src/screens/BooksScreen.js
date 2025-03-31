import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBooks } from '../redux/actions/bookActions';
import { addToCart } from '../redux/actions/cartActions'; // Import the addToCart action
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import { Ionicons } from '@expo/vector-icons';

const BooksScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { books, loading, error } = useSelector(state => state.books);
  
  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  // Search button for the header
  const SearchButton = () => (
    <TouchableOpacity onPress={() => navigation.navigate('ProductsPage')}>
      <Ionicons name="search" size={24} color={COLORS.onBackground} />
    </TouchableOpacity>
  );

  // Handle Add to Cart
  const handleAddToCart = (book) => {
    dispatch(addToCart(book)); // Dispatch the addToCart action
    Alert.alert('Success', `${book.title} has been added to your cart.`);
  };

  const renderBookItem = ({ item }) => (
    <View style={styles.bookItem}>
      <TouchableOpacity 
        style={styles.bookCard}
        onPress={() => navigation.navigate('BookDetails', { bookId: item._id })}
      >
        <Image 
          source={{ uri: item.coverImage?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.bookCover}
          resizeMode="cover"
        />
        {item.tag !== 'None' && (
          <View style={[styles.tagContainer, 
            item.tag === 'Sale' ? styles.saleTag : 
            item.tag === 'New' ? styles.newTag : 
            styles.hotTag
          ]}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        )}
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.bookCategory}>{item.category}</Text>
          <View style={styles.priceContainer}>
            {item.tag === 'Sale' && item.discountPrice ? (
              <>
                <Text style={styles.discountPrice}>${item.discountPrice.toFixed(2)}</Text>
                <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      {/* Add to Cart Button */}
      <TouchableOpacity 
        style={styles.addToCartButton} 
        onPress={() => handleAddToCart(item)}
      >
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  const handleRetry = () => {
    dispatch(fetchBooks());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Books" 
        rightComponent={<SearchButton />} 
      />
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
  data={books}
  renderItem={renderBookItem}
  keyExtractor={(item) => item._id.toString()} // Ensure each item has a unique key
  numColumns={2}
  contentContainerStyle={styles.listContainer}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No books found</Text>
    </View>
  }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    padding: SIZES.small,
  },
  bookItem: {
    flex: 1,
    padding: SIZES.small / 2,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: SIZES.base,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCover: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  bookInfo: {
    padding: SIZES.small,
  },
  bookTitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    marginBottom: 4,
  },
  bookCategory: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  discountPrice: {
    ...FONTS.bold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginRight: 6,
  },
  originalPrice: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    textDecorationLine: 'line-through',
  },
  tagContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    color: '#fff',
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  loaderContainer: {
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
  errorText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.medium,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: SIZES.base,
  },
  retryText: {
    ...FONTS.medium,
    color: '#fff',
    fontSize: SIZES.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  addToCartButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: SIZES.base,
    marginTop: 8,
  },
  addToCartText: {
    color: '#fff',
    ...FONTS.medium,
    fontSize: SIZES.medium,
  },
});

export default BooksScreen;