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