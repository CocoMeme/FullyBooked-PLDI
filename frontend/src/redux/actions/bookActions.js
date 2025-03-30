import axios from 'axios';
import * as types from './bookActionTypes';
import API_URL from '../../services/api';

// Fetch all books
export const fetchBooks = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: types.FETCH_BOOKS_REQUEST });

    // Build query params based on filters
    let queryParams = '';
    if (Object.keys(filters).length > 0) {
      queryParams = '?' + Object.keys(filters)
        .filter(key => filters[key] !== undefined && filters[key] !== '')
        .map(key => `${key}=${encodeURIComponent(filters[key])}`)
        .join('&');
    }

    const response = await axios.get(`${API_URL.GET_ALL_BOOKS}${queryParams}`);
    dispatch({
      type: types.FETCH_BOOKS_SUCCESS,
      payload: response.data.books,
    });
  } catch (error) {
    dispatch({
      type: types.FETCH_BOOKS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch books',
    });
  }
};

// Fetch book details
export const fetchBookDetails = (bookId) => async (dispatch) => {
  try {
    dispatch({ type: types.FETCH_BOOK_DETAILS_REQUEST });
    const response = await axios.get(API_URL.GET_BOOK_BY_ID(bookId));
    dispatch({
      type: types.FETCH_BOOK_DETAILS_SUCCESS,
      payload: response.data.book,
    });
  } catch (error) {
    dispatch({
      type: types.FETCH_BOOK_DETAILS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch book details',
    });
  }
};

// Create a new book (admin only)
export const createBook = (bookData, token) => async (dispatch) => {
  try {
    dispatch({ type: types.CREATE_BOOK_REQUEST });

    // Create FormData for multipart/form-data (images)
    const formData = new FormData();
    
    // Append book data
    Object.keys(bookData).forEach(key => {
      if (key === 'coverImage') {
        if (Array.isArray(bookData.coverImage) && bookData.coverImage.length > 0) {
          bookData.coverImage.forEach((uri, index) => {
            if (uri && uri.trim() !== '') {
              console.log(`Processing image ${index}:`, uri);
              
              // Get filename from URI
              let filename = uri.split('/').pop();
              if (!filename) filename = `image${index}.jpg`;
              
              // Determine MIME type
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
              
              // Create file object for FormData
              const fileObj = {
                uri: uri,
                type: type,
                name: filename
              };
              
              console.log('Appending file:', fileObj);
              formData.append('files', fileObj);
            }
          });
        } else {
          console.warn('No valid cover images provided');
        }
      } else {
        formData.append(key, bookData[key]);
      }
    });

    console.log('Sending form data for book creation');
    const response = await axios.post(API_URL.CREATE_BOOK, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    dispatch({
      type: types.CREATE_BOOK_SUCCESS,
      payload: response.data,
    });
    
    return response.data;
  } catch (error) {
    console.error('Create book error:', error);
    dispatch({
      type: types.CREATE_BOOK_FAILURE,
      payload: error.response?.data?.message || 'Failed to create book',
    });
    throw error;
  }
};

// Update an existing book (admin only)
export const updateBook = (bookId, bookData, token) => async (dispatch) => {
  try {
    dispatch({ type: types.UPDATE_BOOK_REQUEST });
    
    // Create FormData for multipart/form-data (images)
    const formData = new FormData();
    
    // Append book data
    Object.keys(bookData).forEach(key => {
      if (key === 'coverImage') {
        if (Array.isArray(bookData.coverImage) && bookData.coverImage.length > 0) {
          bookData.coverImage.forEach((uri, index) => {
            if (uri && uri.trim() !== '') {
              console.log(`Processing image ${index} for update:`, uri);
              
              // Get filename from URI
              let filename = uri.split('/').pop();
              if (!filename) filename = `image${index}.jpg`;
              
              // Determine MIME type
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
              
              // Create file object for FormData
              const fileObj = {
                uri: uri,
                type: type,
                name: filename
              };
              
              console.log('Appending file for update:', fileObj);
              formData.append('files', fileObj);
            }
          });
        } else {
          console.warn('No valid cover images provided for update');
        }
      } else {
        formData.append(key, bookData[key]);
      }
    });

    console.log('Sending form data for book update');
    const response = await axios.put(API_URL.UPDATE_BOOK(bookId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });

    dispatch({
      type: types.UPDATE_BOOK_SUCCESS,
      payload: response.data,
    });
    
    return response.data;
  } catch (error) {
    console.error('Update book error:', error);
    dispatch({
      type: types.UPDATE_BOOK_FAILURE,
      payload: error.response?.data?.message || 'Failed to update book',
    });
    throw error;
  }
};

// Delete a book (admin only)
export const deleteBook = (bookId, token) => async (dispatch) => {
  try {
    dispatch({ type: types.DELETE_BOOK_REQUEST });
    
    const response = await axios.delete(API_URL.DELETE_BOOK(bookId), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    dispatch({
      type: types.DELETE_BOOK_SUCCESS,
      payload: { bookId, message: response.data.message },
    });
    
    return response.data;
  } catch (error) {
    dispatch({
      type: types.DELETE_BOOK_FAILURE,
      payload: error.response?.data?.message || 'Failed to delete book',
    });
    throw error;
  }
};

// Clear error message
export const clearBookError = () => ({
  type: types.CLEAR_BOOK_ERROR
});

// Clear success message
export const clearBookMessage = () => ({
  type: types.CLEAR_BOOK_MESSAGE
});