import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBooks, searchBooks } from '../redux/actions/bookActions';
import { COLORS, FONTS, SIZES } from '../constants/theme';
import Header from '../components/Header';
import BookCard from '../components/Book Components/BookCard';
import { Ionicons } from '@expo/vector-icons';

const CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 
  'Mystery', 'Romance', 'Biography', 'History', 'Self-Help'
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' }
];

const ProductsPage = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { books, loading, error } = useSelector(state => state.books);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    author: '',
    sort: 'relevance'
  });

  // Handle params from BooksScreen
  useEffect(() => {
    if (route.params) {
      // Handle initial query if provided
      if (route.params.initialQuery) {
        setSearchQuery(route.params.initialQuery);
        
        // Auto-search with the provided query
        dispatch(searchBooks(route.params.initialQuery, filters));
      }
      
      // Handle initial filters if provided
      if (route.params.initialFilters) {
        const newFilters = { ...filters, ...route.params.initialFilters };
        setFilters(newFilters);
        
        // Auto-search with the provided filters
        dispatch(searchBooks(searchQuery, newFilters));
      }
    } else {
      // Default behavior - load all books
      dispatch(fetchBooks());
    }
  }, [dispatch, route.params]);


  // Back button for header
  const BackButton = () => (
    <TouchableOpacity onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={24} color={COLORS.onBackground} />
    </TouchableOpacity>
  );

  // Filter button for header
  const FilterButton = () => (
    <TouchableOpacity onPress={() => setShowFilters(true)}>
      <Ionicons name="filter" size={24} color={COLORS.onBackground} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Search Books" 
        leftComponent={<BackButton />} 
        rightComponent={<FilterButton />}
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color={COLORS.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search by title, author, category..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Active filters display */}
      {(filters.category || filters.author) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
          <View style={styles.filtersRow}>
            {filters.category && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>{filters.category}</Text>
                <TouchableOpacity onPress={() => {
                  setFilters({...filters, category: ''});
                  if (searchQuery || filters.author) handleSearch();
                }}>
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
            {filters.author && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>By: {filters.author}</Text>
                <TouchableOpacity onPress={() => {
                  setFilters({...filters, author: ''});
                  if (searchQuery || filters.category) handleSearch();
                }}>
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
      
      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Books</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={COLORS.onBackground} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Categories */}
              <Text style={styles.filterSectionTitle}>Categories</Text>
              <View style={styles.categoriesContainer}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      filters.category === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setFilters({
                      ...filters,
                      category: filters.category === category ? '' : category
                    })}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      filters.category === category && styles.categoryButtonTextActive
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Author */}
              <Text style={styles.filterSectionTitle}>Author</Text>
              <TextInput
                style={styles.authorInput}
                placeholder="Enter author name"
                value={filters.author}
                onChangeText={(text) => setFilters({...filters, author: text})}
              />
              
              {/* Sort By */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    filters.sort === option.value && styles.sortOptionActive
                  ]}
                  onPress={() => setFilters({...filters, sort: option.value})}
                >
                  <Text style={[
                    styles.sortOptionText,
                    filters.sort === option.value && styles.sortOptionTextActive
                  ]}>
                    {option.label}
                  </Text>
                  {filters.sort === option.value && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setFilters({
                    category: '',
                    author: '',
                    sort: 'relevance'
                  });
                }}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleSearch}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          data={books}
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
              <Text style={styles.emptyText}>
                {searchQuery || filters.category || filters.author ? 
                  `No books found matching your search` : 
                  "No books available"}
              </Text>
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
  searchContainer: {
    flexDirection: 'row',
    padding: SIZES.small,
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.base,
    marginRight: SIZES.base,
  },
  searchIcon: {
    marginRight: SIZES.base,
  },
  input: {
    flex: 1,
    height: 40,
    ...FONTS.regular,
    color: COLORS.onBackground,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: SIZES.radius,
  },
  searchButtonText: {
    ...FONTS.medium,
    color: COLORS.white,
    fontSize: SIZES.medium,
  },
  activeFiltersContainer: {
    paddingHorizontal: SIZES.small,
    paddingBottom: SIZES.small,
  },
  activeFiltersTitle: {
    ...FONTS.medium,
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: SIZES.radius,
    marginRight: 8,
    marginBottom: 8,
  },
  filterTagText: {
    ...FONTS.medium,
    color: COLORS.white,
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
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
    color: COLORS.onBackground,
  },
  modalBody: {
    padding: SIZES.medium,
  },
  filterSectionTitle: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    color: COLORS.onBackground,
    marginTop: 10,
    marginBottom: 10,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.base,
    padding: 8,
    margin: 4,
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    ...FONTS.regular,
    color: COLORS.primary,
  },
  categoryButtonTextActive: {
    color: COLORS.white,
  },
  authorInput: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.base,
    padding: 10,
    marginBottom: 15,
    ...FONTS.regular,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sortOptionActive: {
    backgroundColor: COLORS.lightGray + '30',
  },
  sortOptionText: {
    ...FONTS.regular,
    color: COLORS.onBackground,
  },
  sortOptionTextActive: {
    ...FONTS.medium,
    color: COLORS.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SIZES.medium,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  clearButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: SIZES.radius,
  },
  clearButtonText: {
    ...FONTS.medium,
    color: COLORS.onBackground,
  },
  applyButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  applyButtonText: {
    ...FONTS.medium,
    color: COLORS.white,
  },
  // Existing styles
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
    color: COLORS.white,
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
    textAlign: 'center',
  },
});

export default ProductsPage;