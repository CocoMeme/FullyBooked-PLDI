import * as types from '../constants/reviewConstants';

const initialState = {
  loading: false,
  error: null,
  success: false,
};

const reviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SUBMIT_REVIEW_REQUEST:
      return { ...state, loading: true, error: null, success: false };
    case types.SUBMIT_REVIEW_SUCCESS:
      return { ...state, loading: false, success: true };
    case types.SUBMIT_REVIEW_FAILURE:
      return { ...state, loading: false, error: action.payload, success: false };
    default:
      return state;
  }
};

export default reviewReducer;