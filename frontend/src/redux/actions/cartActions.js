// Import necessary dependencies
import AsyncStorage from '@react-native-async-storage/async-storage'; // For persistent storage (React Native)
import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART } from '../../constants/cartConstants'; // Action types

// Action to add a book to the cart
export const addToCart = (book) => async (dispatch, getState) => {
  dispatch({
    type: ADD_TO_CART,
    payload: {
      id: book._id, // Unique identifier for the book
      title: book.title,
      price: book.price,
      coverImage: book.coverImage?.[0] || 'https://via.placeholder.com/150', // Default image if none exists
      quantity: 1, // Default quantity is 1
    },
  });

  // Save the updated cart to AsyncStorage for persistence
  const { cart } = getState();
  await AsyncStorage.setItem('cart', JSON.stringify(cart.cartItems));
};

// Action to remove a book from the cart
export const removeFromCart = (id) => async (dispatch, getState) => {
  dispatch({
    type: REMOVE_FROM_CART,
    payload: id,
  });

  // Save the updated cart to AsyncStorage
  const { cart } = getState();
  await AsyncStorage.setItem('cart', JSON.stringify(cart.cartItems));
};

// Action to clear the cart
export const clearCart = () => async (dispatch) => {
  dispatch({
    type: CLEAR_CART,
  });

  // Remove the cart from AsyncStorage
  await AsyncStorage.removeItem('cart');
};