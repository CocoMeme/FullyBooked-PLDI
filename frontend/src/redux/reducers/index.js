import { combineReducers } from 'redux';
import { cartReducer } from './cartReducer';
import bookReducer from './bookReducer';
import reviewReducer from './reviewReducer';
import orderReducer from './orderReducer';

// Combine all reducers
const rootReducer = combineReducers({
  books: bookReducer,
  cart: cartReducer,
  review: reviewReducer,
  orders: orderReducer,
});

export default rootReducer;