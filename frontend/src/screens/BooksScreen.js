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
  ScrollView,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBooks } from '../redux/actions/bookActions';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import BookCard from '../components/Book Components/BookCard';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const BooksScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { books, loading, error } = useSelector(state => state.books);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: { min: '0', max: '2000' },
    sortBy: 'newest'
  });
  const [slideAnim] = useState(new Animated.Value(screenWidth));

  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  useEffect(() => {
    applyFilters();
  }, [books, filters, searchQuery]);

  useEffect(() => {
    if (showFilterModal) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: screenWidth,
        useNativeDriver: true,
      }).start();
    }
  }, [showFilterModal]);

  const applyFilters = () => {
    let filtered = [...books];

    if (searchQuery.trim()) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(book => 
        filters.categories.some(category => 
          book.category.toLowerCase() === category.toLowerCase()
        )
      );
    }

    filtered = filtered.filter(book =>
      book.price >= Number(filters.priceRange.min) && 
      book.price <= Number(filters.priceRange.max)
    );

    switch (filters.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    setFilteredBooks(filtered);
  };

  const handlePriceChange = (type, value) => {
    if (value === '' || /^\d*$/.test(value)) {
      setFilters(prev => ({
        ...prev,
        priceRange: {
          ...prev.priceRange,
          [type]: value
        }
      }));
    }
  };

  const toggleCategory = (category) => {
    setFilters(prev => {
      const isSelected = prev.categories.includes(category);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category]
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: { min: '0', max: '2000' },
      sortBy: 'newest'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Books" 
        rightComponent={
          <TouchableOpacity onPress={() => setShowFilterModal(true)}>
            <Ionicons name="filter" size={24} color={COLORS.onBackground} />
          </TouchableOpacity>
        }
      />
      
      {/* Search Container */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books by title or author..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Active Filters */}
      {(filters.categories.length > 0 || filters.priceRange.min > '0' || filters.priceRange.max < '2000') && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.categories.map((category) => (
              <View key={category} style={styles.filterTag}>
                <Text style={styles.filterTagText}>{category}</Text>
                <TouchableOpacity onPress={() => toggleCategory(category)}>
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
            {(filters.priceRange.min > '0' || filters.priceRange.max < '2000') && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  ₱{filters.priceRange.min} - ₱{filters.priceRange.max}
                </Text>
                <TouchableOpacity 
                  onPress={() => setFilters({ 
                    ...filters, 
                    priceRange: { min: '0', max: '2000' } 
                  })}
                >
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.clearAllButton} onPress={clearFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Books List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(fetchBooks())}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No books found</Text>
            </View>
          }
        />
      )}

      {/* Filter Drawer */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.drawerContent,
              {
                transform: [{ translateX: slideAnim }]
              }
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.modalTitle}>Filter Books</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.onBackground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Categories */}
              <Text style={styles.filterSectionTitle}>Categories (Select Multiple)</Text>
              <View style={styles.categoriesContainer}>
                {['Fiction', 'Non-Fiction', 'Fantasy', 'Romance', 'Mystery', 'History', 'Horror', 'Action', 'Business'].map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      filters.categories.includes(category) && styles.selectedCategoryChip
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText,
                      filters.categories.includes(category) && styles.selectedCategoryText
                    ]}>
                      {category}
                    </Text>
                    {filters.categories.includes(category) && (
                      <Ionicons 
                        name="checkmark" 
                        size={16} 
                        color={COLORS.white} 
                        style={styles.categoryCheckmark}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Min Price:</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={filters.priceRange.min}
                    onChangeText={(value) => handlePriceChange('min', value)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={styles.priceInputContainer}>
                  <Text style={styles.priceLabel}>Max Price:</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={filters.priceRange.max}
                    onChangeText={(value) => handlePriceChange('max', value)}
                    keyboardType="numeric"
                    placeholder="2000"
                  />
                </View>
              </View>

              {/* Sort By */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              {[
                { key: 'newest', label: 'Newest First' },
                { key: 'price_low', label: 'Price: Low to High' },
                { key: 'price_high', label: 'Price: High to Low' }
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    filters.sortBy === option.key && styles.selectedSortOption
                  ]}
                  onPress={() => setFilters({ ...filters, sortBy: option.key })}
                >
                  <Text style={[
                    styles.sortOptionText,
                    filters.sortBy === option.key && styles.selectedSortOptionText
                  ]}>
                    {option.label}
                  </Text>
                  {filters.sortBy === option.key && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.clearButton]}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.applyButton]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
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
  activeFiltersContainer: {
    paddingHorizontal: SIZES.medium,
    paddingBottom: SIZES.small,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  filterTagText: {
    color: COLORS.white,
    marginRight: 8,
    ...FONTS.medium,
    fontSize: SIZES.small,
  },
  clearAllButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  clearAllText: {
    color: COLORS.primary,
    ...FONTS.medium,
    fontSize: SIZES.small,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawerContent: {
    width: screenWidth * 0.85,
    height: '100%',
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    ...FONTS.semibold,
    fontSize: SIZES.large,
  },
  modalBody: {
    padding: SIZES.medium,
  },
  filterSectionTitle: {
    ...FONTS.semibold,
    fontSize: SIZES.medium,
    marginVertical: SIZES.small,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.medium,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 4,
  },
  selectedCategoryChip: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.onBackground,
    marginRight: 4,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  categoryCheckmark: {
    marginLeft: 4,
  },
  priceRangeContainer: {
    marginBottom: SIZES.medium,
    paddingHorizontal: SIZES.small,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  priceLabel: {
    ...FONTS.regular,
    width: 80,
    color: COLORS.onBackground,
  },
  priceInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.base,
    paddingHorizontal: SIZES.small,
    ...FONTS.regular,
    backgroundColor: COLORS.white,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedSortOption: {
    backgroundColor: COLORS.lightPrimary,
  },
  sortOptionText: {
    ...FONTS.regular,
    color: COLORS.onBackground,
  },
  selectedSortOptionText: {
    ...FONTS.medium,
    color: COLORS.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SIZES.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: SIZES.base,
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 8,
    backgroundColor: COLORS.lightGray,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
  },
  clearButtonText: {
    ...FONTS.medium,
    color: COLORS.onBackground,
  },
  applyButtonText: {
    ...FONTS.medium,
    color: COLORS.white,
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
  },
  errorText: {
    ...FONTS.medium,
    color: COLORS.error,
    marginBottom: SIZES.medium,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: SIZES.base,
  },
  retryText: {
    ...FONTS.medium,
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.extra_large,
  },
  emptyText: {
    ...FONTS.medium,
    color: COLORS.gray,
  }
});

export default BooksScreen;