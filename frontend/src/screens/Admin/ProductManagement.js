import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBooks, createBook, updateBook, deleteBook } from '../../redux/actions/bookActions';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { COLORS, FONTS, SIZES } from '../../constants/theme';
import AuthGlobal from '../../context/store/AuthGlobal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const ProductManagement = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const context = useContext(AuthGlobal);
  const { books, loading, error, message } = useSelector(state => state.books);
  const [token, setToken] = useState('');
  
  // Local state
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Get book ID from navigation params if editing a specific book
  const productId = route.params?.productId;

  // New book form state
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    tag: 'Regular',
    discountPrice: '',
    coverImage: []
  });

  useEffect(() => {
    const getToken = async () => {
      const jwt = await AsyncStorage.getItem('jwt');
      setToken(jwt);
    };
    getToken();
  }, []);

  useEffect(() => {
    dispatch(fetchBooks());
  }, [dispatch]);

  useEffect(() => {
    // If productId is provided and books are loaded, find the selected book
    if (productId && books.length > 0) {
      const book = books.find(b => b._id === productId);
      if (book) {
        setSelectedBook(book);
        setEditModalVisible(true);
      } else {
        Alert.alert('Error', 'Book not found');
        navigation.goBack();
      }
    }
  }, [productId, books]);

  // Image picker function
  const pickImage = async () => {
    try {
      console.log('Image picker button pressed');
      
      // Check for permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      // Launch image library with more flexible options
      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Keep editing enabled but without a fixed aspect ratio
        aspect: undefined, // Remove the fixed aspect ratio constraint
        quality: 0.8,
        allowsMultipleSelection: false, // Only one image at a time for better control
      });
      
      console.log('Image picker result:', JSON.stringify(result));

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        console.log('Selected image URI:', imageUri);
        
        if (editModalVisible && selectedBook) {
          setSelectedBook({
            ...selectedBook,
            coverImage: [...(selectedBook.coverImage || []), imageUri]
          });
        } else {
          setNewBook({
            ...newBook,
            coverImage: [...newBook.coverImage, imageUri]
          });
        }
        console.log('Image added successfully');
      } else {
        console.log('Image selection canceled by user');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image: ' + error.message);
    }
  };

  // Create new book
  const handleCreateBook = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'You must be logged in to create a book');
      return;
    }

    // Basic validation
    if (!newBook.title || !newBook.author || !newBook.category || !newBook.price) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (newBook.coverImage.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one image');
      return;
    }

    try {
      // Prepare data with correct numeric types
      const bookDataToSend = {
        ...newBook,
        price: parseFloat(newBook.price),
        stock: parseInt(newBook.stock, 10),
        discountPrice: newBook.discountPrice ? parseFloat(newBook.discountPrice) : undefined
      };
      
      await dispatch(createBook(bookDataToSend, token));
      setModalVisible(false);
      setNewBook({
        title: '',
        author: '',
        description: '',
        category: '',
        price: '',
        stock: '',
        tag: 'New',
        discountPrice: '',
        coverImage: []
      });
      Alert.alert('Success', 'Book created successfully');
    } catch (error) {
      console.error('Create book error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create book');
    }
  };

  // Update book
  const handleUpdateBook = async () => {
    if (!token) {
      Alert.alert('Authentication Error', 'You must be logged in to update a book');
      return;
    }

    // Basic validation
    if (!selectedBook.title || !selectedBook.author || !selectedBook.category || !selectedBook.price) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (selectedBook.coverImage.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one image');
      return;
    }

    try {
      // Prepare data with correct numeric types
      const bookDataToSend = {
        ...selectedBook,
        price: parseFloat(selectedBook.price),
        stock: parseInt(selectedBook.stock, 10),
        discountPrice: selectedBook.discountPrice ? parseFloat(selectedBook.discountPrice) : undefined
      };
      
      await dispatch(updateBook(selectedBook._id, bookDataToSend, token));
      setEditModalVisible(false);
      setSelectedBook(null);
      Alert.alert('Success', 'Book updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update book');
    }
  };

  // Delete book
  const handleDeleteBook = async (bookId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteBook(bookId, token));
              Alert.alert('Success', 'Book deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete book');
            }
          },
        },
      ]
    );
  };

  // Filter books based on search query
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBookForm = (book, setBook, submitHandler, isEdit = false) => (
    <ScrollView style={styles.formContainer}>
      <Text style={styles.label}>Title *</Text>
      <TextInput
        style={styles.input}
        value={book.title}
        onChangeText={(text) => setBook({ ...book, title: text })}
        placeholder="Enter book title"
      />

      <Text style={styles.label}>Author *</Text>
      <TextInput
        style={styles.input}
        value={book.author}
        onChangeText={(text) => setBook({ ...book, author: text })}
        placeholder="Enter author name"
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={book.description}
        onChangeText={(text) => setBook({ ...book, description: text })}
        placeholder="Enter book description"
        multiline
        numberOfLines={4}
      />

      {/* Category and Tag side by side */}
      <View style={styles.rowContainer}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.input}>
            <Picker
              selectedValue={book.category}
              onValueChange={(itemValue) => setBook({ ...book, category: itemValue })}
              style={{ height: 50, margin: -15 }}
            >
              <Picker.Item label="Select Category" value="" />
              <Picker.Item label="Sci-Fi" value="Sci-Fi" />
              <Picker.Item label="Adventure" value="Adventure" />
              <Picker.Item label="Fiction" value="Fiction" />
              <Picker.Item label="Business" value="Business" />
              <Picker.Item label="Action" value="Action" />
              <Picker.Item label="Comedy" value="Comedy" />
              <Picker.Item label="Drama" value="Drama" />
              <Picker.Item label="Romance" value="Romance" />
              <Picker.Item label="Horror" value="Horror" />
              <Picker.Item label="Thriller" value="Thriller" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.rowItem}>
          <Text style={styles.label}>Tag</Text>
          <View style={styles.input}>
            <Picker
              selectedValue={book.tag}
              onValueChange={(itemValue) => setBook({ ...book, tag: itemValue })}
              style={{ height: 50, margin: -15 }}
            >
              <Picker.Item label="None" value="None" />
              <Picker.Item label="New" value="New" />
              <Picker.Item label="Sale" value="Sale" />
              <Picker.Item label="Hot" value="Hot" />
            </Picker>
          </View>
        </View>
      </View>

      {/* Price and Stock side by side */}
      <View style={styles.rowContainer}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Price *</Text>
          <TextInput
            style={styles.input}
            value={typeof book.price === 'number' ? String(book.price) : book.price}
            onChangeText={(text) => setBook({ ...book, price: text })}
            placeholder="Enter price"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.rowItem}>
          <Text style={styles.label}>Stock *</Text>
          <TextInput
            style={styles.input}
            value={typeof book.stock === 'number' ? String(book.stock) : book.stock}
            onChangeText={(text) => setBook({ ...book, stock: text })}
            placeholder="Enter stock quantity"
            keyboardType="numeric"
          />
        </View>
      </View>

      {book.tag === 'Sale' && (
        <>
          <Text style={styles.label}>Discount Price</Text>
          <TextInput
            style={styles.input}
            value={typeof book.discountPrice === 'number' ? String(book.discountPrice) : (book.discountPrice || '')}
            onChangeText={(text) => setBook({ ...book, discountPrice: text })}
            placeholder="Enter discount price"
            keyboardType="numeric"
          />
        </>
      )}

      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        <MaterialIcons name="add-photo-alternate" size={24} color={COLORS.primary} />
        <Text style={styles.imageButtonText}>Add Image</Text>
      </TouchableOpacity>

      {book.coverImage && book.coverImage.length > 0 && (
        <ScrollView horizontal style={styles.imagePreviewContainer}>
          {book.coverImage.map((uri, index) => (
            <View key={index} style={styles.imagePreview}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  const newImages = [...book.coverImage];
                  newImages.splice(index, 1);
                  setBook({ ...book, coverImage: newImages });
                }}
              >
                <MaterialIcons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.submitButton} onPress={submitHandler}>
        <Text style={styles.submitButtonText}>
          {isEdit ? 'Update Book' : 'Create Book'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  if (loading && books.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Product Management" />
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Book</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.tableContainer}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Image</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Title</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Author</Text>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Price</Text>
            <Text style={[styles.headerCell, { flex: 0.8 }]}>Stock</Text>
            <Text style={[styles.headerCell, { flex: 1 }]}>Actions</Text>
          </View>

          {filteredBooks.map((book) => (
            <View key={book._id} style={styles.tableRow}>
              <View style={[styles.cell, { flex: 0.8 }]}>
                <Image
                  source={{ uri: book.coverImage[0] }}
                  style={styles.thumbnail}
                />
              </View>
              <Text style={[styles.cell, { flex: 1.5 }]}>{book.title}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{book.author}</Text>
              <Text style={[styles.cell, { flex: 0.8 }]}>${book.price}</Text>
              <Text style={[styles.cell, { flex: 0.8 }]}>{book.stock}</Text>
              <View style={[styles.cell, { flex: 1, flexDirection: 'row' }]}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedBook(book);
                    setEditModalVisible(true);
                  }}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="edit" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteBook(book._id)}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="delete" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Create Book Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Book</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {renderBookForm(newBook, setNewBook, handleCreateBook)}
          </View>
        </View>
      </Modal>

      {/* Edit Book Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Book</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            {selectedBook && renderBookForm(selectedBook, setSelectedBook, handleUpdateBook, true)}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    ...FONTS.regular,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    marginLeft: 4,
    ...FONTS.medium,
  },
  tableContainer: {
    flex: 1,
    padding: 16,
  },
  table: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 12,
  },
  headerCell: {
    color: 'white',
    ...FONTS.medium,
    fontSize: SIZES.small,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 12,
    alignItems: 'center',
  },
  cell: {
    ...FONTS.regular,
    fontSize: SIZES.small,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...FONTS.medium,
    fontSize: SIZES.large,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  label: {
    ...FONTS.medium,
    marginBottom: 8,
    color: COLORS.text,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: COLORS.surface,
    ...FONTS.regular,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    marginBottom: 16,
  },
  imageButtonText: {
    ...FONTS.medium,
    color: COLORS.primary,
    marginLeft: 8,
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imagePreview: {
    marginRight: 8,
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 4,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    ...FONTS.medium,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowItem: {
    flex: 1,
    marginRight: 8,
  },
});

export default ProductManagement;