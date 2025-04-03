import { combineReducers } from 'redux';
import { cartReducer } from './cartReducer';
import bookReducer from './bookReducer';
import reviewReducer from './reviewReducer'; 

// Combine all reducers
const rootReducer = combineReducers({
  books: bookReducer,
  cart: cartReducer,
  review: reviewReducer,
  // Add more reducers here as needed (orders, reviews, etc.)
});

export default rootReducer;