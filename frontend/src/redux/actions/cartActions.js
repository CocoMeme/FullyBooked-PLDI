// Import necessary dependencies
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, UPDATE_QUANTITY } from '../constants/cartConstants';

// Action to add a book to the cart
export const addToCart = (book) => async (dispatch, getState) => {
  dispatch({
    type: ADD_TO_CART,
    payload: {
      id: book._id, // Unique identifier for the book
      title: book.title,
      price: book.price,
      discountPrice: book.discountPrice,
      description: book.description,
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

// Action to update the quantity of an item in the cart
export const updateCartItemQuantity = (id, action) => async (dispatch, getState) => {
  dispatch({
    type: UPDATE_QUANTITY,
    payload: {
      id,
      action, // 'increase' or 'decrease'
    },
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