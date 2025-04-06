import { api } from '../../services/api';
import * as types from '../constants/reviewConstants';

// Submit a review
export const submitReview = (reviewData) => async (dispatch) => {
  try {
    dispatch({ type: types.SUBMIT_REVIEW_REQUEST });

    const response = await api.post(`/reviews/${reviewData.bookId}`, {
      rating: reviewData.rating,
      comment: reviewData.comment,
    });

    dispatch({
      type: types.SUBMIT_REVIEW_SUCCESS,
      payload: response.data.review,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: types.SUBMIT_REVIEW_FAILURE,
      payload: error.response?.data?.message || 'Failed to submit review',
    });
    throw error;
  }
};

// Fetch reviews for a book
export const fetchReviews = (bookId) => async (dispatch) => {
  try {
    dispatch({ type: types.FETCH_REVIEWS_REQUEST });

    const response = await api.get(`/reviews/${bookId}`);
    
    dispatch({
      type: types.FETCH_REVIEWS_SUCCESS,
      payload: response.data.reviews || [], // Ensure we always have an array
    });

    return response.data.reviews || [];
  } catch (error) {
    // If it's a 404, we'll treat it as empty reviews
    if (error.response?.status === 404) {
      dispatch({
        type: types.FETCH_REVIEWS_SUCCESS,
        payload: [],
      });
      return [];
    }
    
    dispatch({
      type: types.FETCH_REVIEWS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch reviews',
    });
    throw error;
  }
};

// Update an existing review
export const updateReview = (reviewData) => async (dispatch) => {
  try {
    dispatch({ type: types.UPDATE_REVIEW_REQUEST });

    const response = await api.put(`/reviews/${reviewData.reviewId}`, {
      rating: reviewData.rating,
      comment: reviewData.comment,
    });

    dispatch({
      type: types.UPDATE_REVIEW_SUCCESS,
      payload: response.data.review,
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: types.UPDATE_REVIEW_FAILURE,
      payload: error.response?.data?.message || 'Failed to update review',
    });
    throw error;
  }
};