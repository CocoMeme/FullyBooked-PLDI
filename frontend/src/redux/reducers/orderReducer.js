import * as types from '../constants/orderConstants';

const initialState = {
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    // Place order
    case types.PLACE_ORDER_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.PLACE_ORDER_SUCCESS:
      return {
        ...state,
        loading: false,
        currentOrder: action.payload,
        orders: [...state.orders, action.payload],
      };
    case types.PLACE_ORDER_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Fetch orders
    case types.FETCH_ORDERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.FETCH_ORDERS_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: action.payload,
      };
    case types.FETCH_ORDERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // Update order status
    case types.UPDATE_ORDER_STATUS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case types.UPDATE_ORDER_STATUS_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: state.orders.map(order =>
          order._id === action.payload._id ? action.payload : order
        ),
      };
    case types.UPDATE_ORDER_STATUS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export default orderReducer;