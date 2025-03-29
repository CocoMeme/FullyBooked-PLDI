import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button } from 'react-native';
import axios from 'axios';
import { DataTable } from 'react-native-data-table';
import API_URL from '../services/api'; // Import your API configuration

const AdminHomeScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch books from the backend
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(API_URL.GET_ALL_BOOKS);
        setBooks(response.data.books);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching books:', error);
        Alert.alert('Error', 'Failed to fetch books');
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Admin Dashboard</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Title</DataTable.Title>
          <DataTable.Title>Category</DataTable.Title>
          <DataTable.Title numeric>Price</DataTable.Title>
          <DataTable.Title numeric>Actions</DataTable.Title>
        </DataTable.Header>

        {books.map((book) => (
          <DataTable.Row key={book._id}>
            <DataTable.Cell>{book.title}</DataTable.Cell>
            <DataTable.Cell>{book.category}</DataTable.Cell>
            <DataTable.Cell numeric>${book.price.toFixed(2)}</DataTable.Cell>
            <DataTable.Cell numeric>
              <Button
                title="Edit"
                onPress={() => navigation.navigate('EditProduct', { productId: book._id })}
              />
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
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
});

export default AdminHomeScreen;