import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { fetchData } from '../services/api'; // Ensure this is correctly implemented in your services/api.js

const ProductsPage = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch all books initially
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await fetchData('/books/all'); // Replace with your backend URL
        console.log('Books fetched:', response.books);
        setBooks(response.books);
      } catch (error) {
        console.error('Error fetching books:', error);
        Alert.alert('Error', 'Failed to fetch books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Handle search with a single search bar
  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetchData(`/books/search?search=${search}`);
      setBooks(response.books);
    } catch (error) {
      console.error('Error searching books:', error);
      Alert.alert('Error', 'Failed to search books');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Search Books</Text>

      {/* Single Search Bar */}
      <TextInput
        style={styles.input}
        placeholder="Search by title or category"
        value={search}
        onChangeText={setSearch}
      />
      <Button title="Search" onPress={handleSearch} />

      {/* Display Results */}
      {books.length === 0 ? (
        <Text style={styles.noBooks}>No books available.</Text>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.bookItem}>
              {/* Display the book image */}
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.bookImage} />
              )}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.details}>Category: {item.category}</Text>
              <Text style={styles.details}>Description: {item.description}</Text>
              <Text style={styles.details}>Price: ${item.price.toFixed(2)}</Text>
              {item.discountPrice && (
                <Text style={styles.discountPrice}>
                  Discount Price: ${item.discountPrice.toFixed(2)}
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  noBooks: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  bookItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    marginTop: 4,
  },
  discountPrice: {
    fontSize: 14,
    marginTop: 4,
    color: 'green',
    fontWeight: 'bold',
  },
});

export default ProductsPage;