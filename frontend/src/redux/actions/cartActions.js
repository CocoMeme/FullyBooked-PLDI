// Import necessary dependencies
// import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { 
  saveCartItem, 
  getCartItems, 
  deleteCartItem, 
  clearCartItems, 
  updateCartItemQuantity 
} from '../../services/database';
import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, UPDATE_QUANTITY } from '../constants/cartConstants';

// Action to add a book to the cart
export const addToCart = (item) => async (dispatch) => {
  try {
    const itemWithId = { ...item, product_id: item._id }; // 👈 add this line

    console.log('Item being added to cart:', JSON.stringify(itemWithId, null, 2));

    if (!itemWithId.product_id) {
      throw new Error('Item is missing product_id');
    }

    await saveCartItem(itemWithId, 1);
    const cartItems = await getCartItems();

    dispatch({
      type: 'SET_CART_ITEMS',
      payload: cartItems,
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

// export const addToCart = (item) => async (dispatch) => {
//   try {
//     const itemWithId = { ...item, product_id: item._id }; 
//     console.log('Item being added to cart:', JSON.stringify(item, null, 2)); // log deeply
//     if (!item.product_id) {
//       throw new Error('Item is missing product_id');
//     }
//     await saveCartItem(item, 1);
//     const cartItems = await getCartItems();
//     dispatch({
//       type: 'SET_CART_ITEMS',
//       payload: cartItems,
//     });
//   } catch (error) {
//     console.error('Error adding to cart:', error);
//   }
// };


// Action to remove a book from the cart
export const removeFromCart = (id) => async (dispatch) => {
  try {
    // Remove the item from the database
    await deleteCartItem(id);

    // Fetch updated cart items from the database
    const cartItems = await getCartItems();

    // Dispatch the updated cart to Redux
    dispatch({
      type: REMOVE_FROM_CART,
      payload: cartItems,
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
};
// Action to update the quantity of an item in the cart
export const updateCartItemQuantityAction = (id, action) => async (dispatch) => {
  try {
    console.log('Updating item with ID:', id, 'Action:', action);

    // Update the quantity in the database
    const cartItems = await getCartItems(); // Reload items from the database
    const item = cartItems.find((item) => item.product_id === id);

    if (!item) {
      console.error(`Item with product_id: ${id} not found in database`);
      throw new Error(`Item with product_id: ${id} not found in database`);
    }

    const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
    await updateCartItemQuantity(id, newQuantity);

    // Reload the cart items from the database
    const updatedCartItems = await getCartItems();
    console.log('Updated cart items:', JSON.stringify(updatedCartItems, null, 2));

    // Dispatch the updated cart to Redux
    dispatch({
      type: UPDATE_QUANTITY,
      payload: updatedCartItems,
    });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
  }
};

// Action to clear the cart
export const clearCart = () => async (dispatch) => {
  try {
    // Clear all items from the database
    await clearCartItems();

    // Dispatch the cleared cart to Redux
    dispatch({
      type: CLEAR_CART,
      payload: [],
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};