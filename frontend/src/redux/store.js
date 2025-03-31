import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk'; // Updated import syntax for Redux Thunk v3.x
import rootReducer from './reducers';

// Create Redux store with thunk middleware
const middleware = [thunk];

const store = createStore(
  rootReducer,
  applyMiddleware(...middleware)
);

export default store;