import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import BookCard from '../Book Components/BookCard';
import { API_URL, api } from '../../services/api';

const PopularBooks = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHotBooks();
  }, []);

  const fetchHotBooks = async () => {
    try {
      setLoading(true);
      const response = await api.get(`${API_URL.GET_ALL_BOOKS}?tag=Hot`);
      if (response.data.success) {
        setBooks(response.data.books);
      }
    } catch (error) {
      console.error('Error fetching hot books:', error);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

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
        renderItem={({ item }) => (
          <View style={styles.bookItemContainer}>
            <BookCard 
              book={item} 
              navigation={navigation}
              showAddToCart={false}
            />
          </View>
        )}
        keyExtractor={item => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hot books available</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.medium,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
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
  bookItemContainer: {
    width: 160,
    marginRight: SIZES.medium,
  },
  errorText: {
    ...FONTS.regular,
    color: COLORS.error,
    fontSize: SIZES.medium,
  },
  emptyContainer: {
    width: '100%',
    paddingHorizontal: SIZES.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...FONTS.regular,
    color: COLORS.gray,
    fontSize: SIZES.medium,
  }
});

export default PopularBooks;