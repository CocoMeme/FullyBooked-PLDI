import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import API_URL from '../../services/api';
import Header from '../../components/Header';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

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
        <Header title="Edit Product" showBackButton={true} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text>Loading product details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Edit Product" showBackButton={true} />
      
      <View style={styles.formContainer}>
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
          multiline={true}
          numberOfLines={4}
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

        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>Update Product</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  label: {
    ...FONTS.medium,
    fontSize: SIZES.medium,
    marginBottom: 8,
    color: COLORS.onBackground,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    ...FONTS.regular,
    fontSize: SIZES.medium,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  updateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  updateButtonText: {
    ...FONTS.bold,
    color: '#fff',
    fontSize: SIZES.medium,
  },
});

export default EditProductScreen;