import * as types from '../constants/reviewConstants';

const initialState = {
  reviews: [],
  loading: false,
  error: null,
  success: false,
};

const reviewReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SUBMIT_REVIEW_REQUEST:
      return { ...state, loading: true, error: null, success: false };
    case types.SUBMIT_REVIEW_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        success: true,
        reviews: [...state.reviews, action.payload]
      };
    case types.SUBMIT_REVIEW_FAILURE:
      return { ...state, loading: false, error: action.payload, success: false };

    case types.FETCH_REVIEWS_REQUEST:
      return { ...state, loading: true, error: null };
    case types.FETCH_REVIEWS_SUCCESS:
      return { ...state, loading: false, reviews: action.payload };
    case types.FETCH_REVIEWS_FAILURE:
      return { ...state, loading: false, error: action.payload };
      
    case types.UPDATE_REVIEW_REQUEST:
      return { ...state, loading: true, error: null, success: false };
    case types.UPDATE_REVIEW_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        success: true,
        reviews: state.reviews.map(review => 
          review._id === action.payload._id ? action.payload : review
        )
      };
    case types.UPDATE_REVIEW_FAILURE:
      return { ...state, loading: false, error: action.payload, success: false };
      
    default:
      return state;
  }
};

export default reviewReducer;