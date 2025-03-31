import { combineReducers } from 'redux';
import { cartReducer } from './cartReducer';
import bookReducer from './bookReducer';

// Combine all reducers
const rootReducer = combineReducers({
  books: bookReducer,
  cart: cartReducer,
  // Add more reducers here as needed (orders, reviews, etc.)
});

export default rootReducer;