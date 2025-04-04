import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, UPDATE_QUANTITY } from '../constants/cartConstants';

const initialState = {
  cartItems: [],
};

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART:
    case REMOVE_FROM_CART:
    case UPDATE_QUANTITY:
      return {
        ...state,
        cartItems: action.payload, // Replace the cart items with the updated array
      };

    case CLEAR_CART:
      return {
        ...state,
        cartItems: [], // Clear the cart
      };

    default:
      return state;
  }
};