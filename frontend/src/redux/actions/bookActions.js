import * as types from './bookActionTypes';
import { API_URL, api } from '../../services/api';
import { Platform } from 'react-native';
import axios from 'axios';

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

    const response = await api.get(`${API_URL.GET_ALL_BOOKS}${queryParams}`);
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
    const response = await api.get(API_URL.GET_BOOK_BY_ID(bookId));
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

    // Step 1: Handle image uploads first
    let uploadedImageUrls = [];
    
    if (Array.isArray(bookData.coverImage) && bookData.coverImage.length > 0) {
      const imagesToUpload = bookData.coverImage.filter(uri => uri && !uri.startsWith('http'));
      
      if (imagesToUpload.length > 0) {
        console.log(`Processing ${imagesToUpload.length} images for upload`);
        
        // Create FormData for image uploads
        const imageFormData = new FormData();
        
        // Add each image to the FormData with simplified approach
        imagesToUpload.forEach((uri, index) => {
          console.log(`Adding image ${index} to form data: ${uri}`);
          
          // Get just the filename
          const fileName = uri.split('/').pop();
          
          // Simplified file object
          imageFormData.append('files', {
            name: fileName,
            type: 'image/jpeg',
            uri: uri
          });
        });
        
        // Log what we're sending
        console.log(`Uploading ${imagesToUpload.length} images to ${api.defaults.baseURL}${API_URL.UPLOAD_COVER}`);
        
        // Send the request using our configured API instance
        try {
          const uploadResponse = await api.post(
            API_URL.UPLOAD_COVER,
            imageFormData,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          console.log('Upload response:', uploadResponse.data);
          
          if (uploadResponse.data && uploadResponse.data.coverImages) {
            uploadedImageUrls = uploadResponse.data.coverImages;
            console.log('Images uploaded successfully:', uploadedImageUrls);
          }
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          
          // If response has error details, log them
          if (uploadError.response) {
            console.error('Upload error details:', uploadError.response.data);
          }
          
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
      }
    }
    
    // Step 2: Create book with image URLs
    // Combine any existing URLs with newly uploaded ones
    const allImageUrls = [
      ...(bookData.coverImage || []).filter(uri => uri && uri.startsWith('http')),
      ...uploadedImageUrls
    ];
    
    if (allImageUrls.length === 0) {
      throw new Error('No valid image URLs available');
    }
    
    // Prepare final book data with images
    const finalBookData = {
      ...bookData,
      coverImage: allImageUrls,
      stock: bookData.stock !== undefined ? parseInt(bookData.stock, 10) : 0 // Explicitly handle stock
    };
    
    console.log('Creating book with data:', finalBookData);
    
    // Create the book
    const response = await api.post(API_URL.CREATE_BOOK, finalBookData);
    
    console.log('Book creation successful:', response.data);
    
    dispatch({
      type: types.CREATE_BOOK_SUCCESS,
      payload: response.data,
    });
    
    return response.data;
  } catch (error) {
    console.error('Create book error:', error.message);
    dispatch({
      type: types.CREATE_BOOK_FAILURE,
      payload: error.message || 'Failed to create book',
    });
    throw error;
  }
};

// Update an existing book (admin only)
export const updateBook = (bookId, bookData, token) => async (dispatch) => {
  try {
    dispatch({ type: types.UPDATE_BOOK_REQUEST });
    
    // Step 1: Upload any new images first if they exist
    const imagesToUpload = [];
    if (Array.isArray(bookData.coverImage) && bookData.coverImage.length > 0) {
      // Filter out images that aren't URLs already (need to be uploaded)
      for (const uri of bookData.coverImage) {
        if (uri && !uri.startsWith('http')) {
          imagesToUpload.push(uri);
        }
      }
    }

    let uploadedImageUrls = [];
    
    // If we have images to upload
    if (imagesToUpload.length > 0) {
      // Create FormData specifically for image uploads
      const imageFormData = new FormData();
      
      // Add each image to the FormData - use same method as createBook
      imagesToUpload.forEach((uri, index) => {
        console.log(`Processing update image ${index}: ${uri}`);
        
        const fileName = uri.split('/').pop();
        
        // Append each file individually with 'files' as the field name (to match backend)
        imageFormData.append('files', {
          name: fileName,
          type: 'image/jpeg',
          uri: uri
        });
      });
      
      console.log('Uploading images for update...');
      
      try {
        // Use the same API instance approach as createBook
        const uploadResponse = await api.post(
          API_URL.UPLOAD_COVER,
          imageFormData,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (uploadResponse.data && uploadResponse.data.coverImages) {
          uploadedImageUrls = uploadResponse.data.coverImages;
          console.log('Images uploaded successfully:', uploadedImageUrls);
        }
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        console.error('Error details:', uploadError.message);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }
    
    // Step 2: Now update the book with the image URLs
    // Combine any already-URL images with newly uploaded ones
    const allImageUrls = [
      ...(bookData.coverImage || []).filter(uri => uri && uri.startsWith('http')),
      ...uploadedImageUrls
    ];
    
    // Prepare the final book data
    const finalBookData = {
      ...bookData,
      coverImage: allImageUrls,
      stock: bookData.stock !== undefined ? parseInt(bookData.stock, 10) : 0 // Explicitly handle stock
    };
    
    console.log('Updating book with data:', finalBookData);
    
    // Update the book - use the api instance with Authorization header already set
    const response = await api.put(
      API_URL.UPDATE_BOOK(bookId),
      finalBookData
    );

    console.log('Book update response:', response.data);
    
    dispatch({
      type: types.UPDATE_BOOK_SUCCESS,
      payload: response.data,
    });
    
    return response.data;
  } catch (error) {
    console.error('Update book error:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Server responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    }
    
    dispatch({
      type: types.UPDATE_BOOK_FAILURE,
      payload: error.message || 'Failed to update book',
    });
    throw error;
  }
};

// Delete a book (admin only)
export const deleteBook = (bookId, token) => async (dispatch) => {
  try {
    dispatch({ type: types.DELETE_BOOK_REQUEST });
    
    const response = await api.delete(API_URL.DELETE_BOOK(bookId));

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