import * as types from '../constants/bookConstants';

const initialState = {
  books: [],
  currentBook: null,
  loading: false,
  error: null,
  message: null,
};

const bookReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch all books
    case types.FETCH_BOOKS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.FETCH_BOOKS_SUCCESS:
      return {
        ...state,
        books: action.payload,
        loading: false,
        error: null
      };
    case types.FETCH_BOOKS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Fetch book details
    case types.FETCH_BOOK_DETAILS_REQUEST:
      return {
        ...state,
        currentBook: null,
        loading: true,
        error: null
      };
    case types.FETCH_BOOK_DETAILS_SUCCESS:
      return {
        ...state,
        currentBook: action.payload,
        loading: false,
        error: null
      };
    case types.FETCH_BOOK_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Create book
    case types.CREATE_BOOK_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case types.CREATE_BOOK_SUCCESS:
      return {
        ...state,
        books: [...state.books, action.payload.book],
        loading: false,
        error: null,
        message: action.payload.message
      };
    case types.CREATE_BOOK_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };
      
    // Update book
    case types.UPDATE_BOOK_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case types.UPDATE_BOOK_SUCCESS:
      return {
        ...state,
        books: state.books.map(book => 
          book._id === action.payload.book._id ? action.payload.book : book
        ),
        currentBook: action.payload.book,
        loading: false,
        error: null,
        message: action.payload.message
      };
    case types.UPDATE_BOOK_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };
      
    // Delete book
    case types.DELETE_BOOK_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
        message: null
      };
    case types.DELETE_BOOK_SUCCESS:
      return {
        ...state,
        books: state.books.filter(book => book._id !== action.payload.bookId),
        loading: false,
        error: null,
        message: action.payload.message
      };
    case types.DELETE_BOOK_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        message: null
      };
      
    // Clear messages and errors
    case types.CLEAR_BOOK_ERROR:
      return {
        ...state,
        error: null
      };
    case types.CLEAR_BOOK_MESSAGE:
      return {
        ...state,
        message: null
      };
      
    default:
      return state;
  }
};

export default bookReducer;