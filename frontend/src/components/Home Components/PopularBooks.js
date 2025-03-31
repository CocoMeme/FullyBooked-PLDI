import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const PopularBooks = ({ navigation }) => {
  const [books, setBooks] = useState([
    {
      id: '1',
      title: 'The Great Adventure',
      author: 'John Smith',
      coverImage: require('../../../assets/splash-icon.png'),
      category: 'Adventure',
      price: 24.99,
      averageRating: 4.5,
    },
    {
      id: '2',
      title: 'Mystery of the Lost City',
      author: 'Emily Johnson',
      coverImage: require('../../../assets/splash-icon.png'),
      category: 'Mystery',
      price: 19.99,
      averageRating: 4.2,
    },
    {
      id: '3',
      title: 'Business Strategies',
      author: 'Robert Williams',
      coverImage: require('../../../assets/splash-icon.png'),
      category: 'Business',
      price: 29.99,
      averageRating: 4.7,
    },
    {
      id: '4',
      title: 'Sci-Fi Chronicles',
      author: 'Sarah Davis',
      coverImage: require('../../../assets/splash-icon.png'),
      category: 'Sci-Fi',
      price: 22.99,
      averageRating: 4.3,
    },
  ]);

  // In a real app, you would fetch books from your API
  // useEffect(() => {
  //   // Fetch books from API
  //   // setBooks(data);
  // }, []);

  const renderRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    
    if (halfStar) {
      stars.push('☆');
    }

    return (
      <Text style={styles.ratingText}>
        {stars.join('')} ({rating})
      </Text>
    );
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookItem}
      onPress={() => navigation.navigate('ProductsPage', { productId: item.id })}
    >
      <Image 
        source={item.coverImage} 
        style={styles.coverImage} 
        resizeMode="cover"
      />
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        <View style={styles.bookBottomRow}>
          <Text style={styles.bookPrice}>${item.price}</Text>
          <View style={styles.ratingContainer}>
            {renderRatingStars(item.averageRating)}
          </View>
        </View>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Popular Books</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Books')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.medium,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  sectionTitle: {
    ...FONTS.bold,
    fontSize: SIZES.large,
    color: COLORS.primary,
  },
  seeAllText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.primary,
  },
  listContainer: {
    paddingRight: SIZES.medium,
  },
  bookItem: {
    width: 160,
    marginRight: SIZES.medium,
    borderRadius: SIZES.medium,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  coverImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: SIZES.medium,
    borderTopRightRadius: SIZES.medium,
  },
  bookDetails: {
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...FONTS.regular,
    fontSize: SIZES.small,
    color: '#FFD700',
  },
  categoryTag: {
    position: 'absolute',
    top: -180,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.base / 2,
    paddingHorizontal: SIZES.base,
    borderTopRightRadius: SIZES.medium,
    borderBottomLeftRadius: SIZES.small,
  },
  categoryText: {
    ...FONTS.regular,
    fontSize: SIZES.small - 2,
    color: COLORS.white,
  },
});

export default PopularBooks;