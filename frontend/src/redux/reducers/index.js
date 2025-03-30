import { combineReducers } from 'redux';
import bookReducer from './bookReducer';

// Combine all reducers
const rootReducer = combineReducers({
  books: bookReducer,
  // Add more reducers here as needed (orders, reviews, etc.)
});

export default rootReducer;