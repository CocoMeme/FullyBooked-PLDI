import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Text,
  TextInput,
  ScrollView
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBooks } from '../redux/actions/bookActions'; // Removed searchBooks import
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import BookCard from '../components/Book Components/BookCard';
import { Ionicons } from '@expo/vector-icons';

const BooksScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { books, loading, error } = useSelector(state => state.books);
  const [quickSearch, setQuickSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState(''); // State for the new search query
  const [filteredBooks, setFilteredBooks] = useState([]); // State for filtered books
  const [selectedCategory, setSelectedCategory] = useState(''); // State for selected category
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity }); // State for price range

  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  useEffect(() => {
    // Filter books based on the selected category, search query, and price range
    let filtered = books;

    if (selectedCategory) {
      filtered = filtered.filter(book => 
        book.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (priceRange.min !== 0 || priceRange.max !== Infinity) {
      filtered = filtered.filter(book =>
        book.price >= priceRange.min && book.price <= priceRange.max
      );
    }

    setFilteredBooks(filtered);
  }, [selectedCategory, searchQuery, priceRange, books]);

  // Search button with quick search functionality
  const navigateToSearch = (initialQuery = '') => {
    navigation.navigate('ProductsPage', { initialQuery });
  };

  // Search button for the header
  const SearchButton = () => (
    <TouchableOpacity onPress={() => navigateToSearch(quickSearch)}>
      <Ionicons name="search" size={24} color={COLORS.onBackground} />
    </TouchableOpacity>
  );

  // Button to handle category navigation
  const handleCategorySearch = (category) => {
    setSelectedCategory(category); // Set the selected category
  };

  const handlePriceFilter = (min, max) => {
    setPriceRange({ min, max }); // Set the price range
  };

  const handleMinIncrement = () => {
    setPriceRange(prev => ({
      min: prev.min + 100,
      max: Math.max(prev.min + 100, prev.max) // Ensure max is always greater than or equal to min
    }));
  };

  const handleMinDecrement = () => {
    setPriceRange(prev => ({
      min: Math.max(0, prev.min - 100), // Ensure min doesn't go below 0
      max: prev.max
    }));
  };

  const handleMaxIncrement = () => {
    setPriceRange(prev => ({
      min: prev.min,
      max: prev.max + 100
    }));
  };

  const handleMaxDecrement = () => {
    setPriceRange(prev => ({
      min: prev.min,
      max: Math.max(prev.min + 100, prev.max - 100) // Ensure max is always greater than or equal to min
    }));
  };

  const handleRetry = () => {
    dispatch(fetchBooks());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Books" 
        rightComponent={<SearchButton />} 
      />
      
      {/* Quick search bar */}
      <View style={styles.quickSearchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Quick search for books..."
            value={quickSearch}
            onChangeText={setQuickSearch}
            returnKeyType="search"
            onSubmitEditing={() => navigateToSearch(quickSearch)}
          />
          {quickSearch ? (
            <TouchableOpacity onPress={() => setQuickSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* New search bar */}
      <View style={styles.newSearchContainer}>
        <TextInput
          style={styles.newSearchInput}
          placeholder="Search books..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.newSearchButton} onPress={() => {}}>
          <Text style={styles.newSearchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {/* Category chips for quick filtering */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Fiction', 'Non-Fiction', 'Fantasy', 'Romance', 'Mystery', 'History', 'Horror', 'Action', 'Business'].map(category => (
            <TouchableOpacity 
              key={category} 
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip // Highlight selected category
              ]}
              onPress={() => handleCategorySearch(category)}
            >
              <Text 
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.selectedCategoryText // Highlight selected category text
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            style={[styles.categoryChip, styles.viewAllChip]}
            onPress={() => setSelectedCategory('')} // Clear category filter
          >
            <Text style={[styles.categoryText, styles.viewAllText]}>View All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Price filter buttons and range display */}
      <View style={styles.priceFilterContainer}>
        <View style={styles.priceAdjustGroup}>
          <Text style={styles.priceLabel}>Min Price:</Text>
          <TouchableOpacity
            style={styles.priceAdjustButton}
            onPress={handleMinDecrement}
          >
            <Text style={styles.priceAdjustText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.priceRangeText}>₱{priceRange.min}</Text>
          <TouchableOpacity
            style={styles.priceAdjustButton}
            onPress={handleMinIncrement}
          >
            <Text style={styles.priceAdjustText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.priceAdjustGroup}>
          <Text style={styles.priceLabel}>Max Price:</Text>
          <TouchableOpacity
            style={styles.priceAdjustButton}
            onPress={handleMaxDecrement}
          >
            <Text style={styles.priceAdjustText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.priceRangeText}>
            ₱{priceRange.max === Infinity ? 'Above' : priceRange.max}
          </Text>
          <TouchableOpacity
            style={styles.priceAdjustButton}
            onPress={handleMaxIncrement}
          >
            <Text style={styles.priceAdjustText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

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
          data={filteredBooks} // Use filteredBooks instead of books
          renderItem={({ item }) => (
            <BookCard 
              book={item} 
              navigation={navigation} 
              showAddToCart={true} 
            />
          )}
          keyExtractor={(item) => item._id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.sectionTitle}>Popular Books</Text>
            </View>
          }
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
  quickSearchContainer: {
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
  },
  searchIcon: {
    marginRight: SIZES.base,
  },
  searchInput: {
    flex: 1,
    height: 40,
    ...FONTS.regular,
    color: COLORS.onBackground,
  },
  newSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.medium,
    marginBottom: SIZES.small,
  },
  newSearchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    marginRight: SIZES.base,
    ...FONTS.regular,
    color: COLORS.onBackground,
  },
  newSearchButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: SIZES.base,
  },
  newSearchButtonText: {
    ...FONTS.medium,
    color: COLORS.white,
    fontSize: SIZES.medium,
  },
  categoryContainer: {
    paddingHorizontal: SIZES.small,
    marginBottom: SIZES.small,
  },
  categoryChip: {
    backgroundColor: COLORS.primary + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.primary,
  },
  viewAllChip: {
    backgroundColor: COLORS.primary,
  },
  viewAllText: {
    color: COLORS.white,
  },
  selectedCategoryChip: {
    backgroundColor: COLORS.primary,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  priceFilterContainer: {
    marginHorizontal: SIZES.medium,
    marginBottom: SIZES.small,
  },
  priceAdjustGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.small,
  },
  priceLabel: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    flex: 1,
  },
  priceAdjustButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.base,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: SIZES.base,
  },
  priceAdjustText: {
    ...FONTS.medium,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
  },
  priceRangeText: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    marginHorizontal: SIZES.base,
  },
  headerContainer: {
    paddingHorizontal: SIZES.small,
    paddingBottom: SIZES.small,
  },
  sectionTitle: {
    ...FONTS.semibold,
    fontSize: SIZES.large,
    color: COLORS.onBackground,
  },
  listContainer: {
    padding: SIZES.small,
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
});

export default BooksScreen;