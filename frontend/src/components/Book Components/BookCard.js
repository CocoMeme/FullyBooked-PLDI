import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/actions/cartActions';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const BookCard = ({ book, navigation, showAddToCart = true }) => {
  const dispatch = useDispatch();

  // Handle Add to Cart
  const handleAddToCart = () => {
    dispatch(addToCart(book));
    Alert.alert('Success', `${book.title} has been added to your cart.`);
  };

  // Render rating stars
  const renderRatingStars = (rating) => {
    const stars = [];
    const displayRating = rating || 0;
    const fullStars = Math.floor(displayRating);
    const halfStar = displayRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    
    // Add half star if needed
    if (halfStar) {
      stars.push('☆');
    }

    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push('·');
    }

    return (
      <Text style={styles.ratingText}>
        {stars.join('')} ({displayRating.toFixed(1)})
      </Text>
    );
  };

  return (
    <View style={styles.bookItem}>
      <TouchableOpacity 
        style={styles.bookCard}
        onPress={() => navigation.navigate('BookDetails', { bookId: book._id || book.id })}
      >
        <Image 
          source={book.coverImage?.[0] ? { uri: book.coverImage[0] } : (book.coverImage || require('../../../assets/splash-icon.png'))} 
          style={styles.bookCover} 
          resizeMode="contain"
        />
        {book.tag && book.tag !== 'None' && (
          <View style={[styles.tagContainer, 
            book.tag === 'Sale' ? styles.saleTag : 
            book.tag === 'New' ? styles.newTag : 
            styles.hotTag
          ]}>
            <Text style={styles.tagText}>{book.tag}</Text>
          </View>
        )}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{book.category}</Text>
        </View>
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
          <View style={styles.bookBottomRow}>
            {book.tag === 'Sale' && book.discountPrice ? (
              <View style={styles.priceContainer}>
                <Text style={styles.discountPrice}>${book.discountPrice.toFixed(2)}</Text>
                <Text style={styles.originalPrice}>${book.price.toFixed(2)}</Text>
              </View>
            ) : (
              <Text style={styles.bookPrice}>${book.price?.toFixed(2) || book.price}</Text>
            )}
            <View style={styles.ratingContainer}>
              {renderRatingStars(book.averageRating)}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {showAddToCart && (
        <TouchableOpacity 
          style={styles.addToCartButton} 
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bookItem: {
    flex: 1,
    padding: SIZES.small / 2,
    marginBottom: SIZES.small,
  },
  bookCard: {
    backgroundColor: '#fff',
    borderRadius: SIZES.medium,
  },
  bookCover: {
    width: '100%',
    height: 275,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: SIZES.medium,
    borderTopRightRadius: SIZES.medium,
    resizeMode: 'contain', // Change from default 'cover' to 'contain' to show the full image
  },
  bookInfo: {
    padding: SIZES.small,
  },
  bookTitle: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
  },
  bookAuthor: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: SIZES.base,
  },
  bookBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SIZES.base,
  },
  bookPrice: {
    ...FONTS.semiBold,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: '#FFD700',
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
  categoryTag: {
    position: 'absolute',
    top: 10,
    left: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base / 2,
    paddingHorizontal: SIZES.base,
    borderTopRightRadius: SIZES.small,
    borderBottomRightRadius: SIZES.small,
  },
  categoryText: {
    ...FONTS.regular,
    fontSize: SIZES.small - 2,
    color: COLORS.white,
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

export default BookCard;