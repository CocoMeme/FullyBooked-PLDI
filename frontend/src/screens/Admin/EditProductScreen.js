import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import API_URL from '../services/api'; // Import your API_URL configuration

const EditProductScreen = ({ route, navigation }) => {
  const { productId } = route.params; // Get the product ID from navigation params
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(API_URL.GET_BOOK_BY_ID(productId));
        setProduct(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        Alert.alert('Error', 'Failed to fetch product details');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Handle form submission
  const handleUpdate = async () => {
    try {
      const response = await axios.put(API_URL.UPDATE_BOOK(productId), product);
      Alert.alert('Success', 'Product updated successfully');
      navigation.goBack(); // Navigate back to the previous screen
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading product details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={product.title}
        onChangeText={(text) => setProduct({ ...product, title: text })}
      />

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        value={product.category}
        onChangeText={(text) => setProduct({ ...product, category: text })}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        value={product.description}
        onChangeText={(text) => setProduct({ ...product, description: text })}
      />

      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        value={product.price.toString()}
        keyboardType="numeric"
        onChangeText={(text) => setProduct({ ...product, price: parseFloat(text) })}
      />

      <Text style={styles.label}>Discount Price</Text>
      <TextInput
        style={styles.input}
        value={product.discountPrice ? product.discountPrice.toString() : ''}
        keyboardType="numeric"
        onChangeText={(text) =>
          setProduct({ ...product, discountPrice: text ? parseFloat(text) : null })
        }
      />

      <Text style={styles.label}>Image URL</Text>
      <TextInput
        style={styles.input}
        value={product.image}
        onChangeText={(text) => setProduct({ ...product, image: text })}
      />

      <Button title="Update Product" onPress={handleUpdate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EditProductScreen;