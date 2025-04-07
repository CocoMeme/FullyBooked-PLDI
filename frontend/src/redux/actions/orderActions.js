import * as types from '../constants/orderConstants';
import { API_URL, api } from '../../services/api';
import { clearCart } from './cartActions';

export const placeOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: types.PLACE_ORDER_REQUEST });

    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const response = await api.post(API_URL.PLACE_ORDER, orderData, config);

    dispatch({
      type: types.PLACE_ORDER_SUCCESS,
      payload: response.data.order
    });

    // Clear the cart after successful order
    dispatch(clearCart());

    // Return the response data that includes the order information
    return response.data;
  } catch (error) {
    dispatch({
      type: types.PLACE_ORDER_FAILURE,
      payload: error.response?.data?.message || 'Failed to place order'
    });
    throw error;
  }
};

// Fetch all orders (admin)
export const fetchAllOrders = () => async (dispatch) => {
  try {
    dispatch({ type: types.FETCH_ORDERS_REQUEST });

    const response = await api.get(API_URL.GET_ALL_ORDERS);

    dispatch({
      type: types.FETCH_ORDERS_SUCCESS,
      payload: response.data.orders
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: types.FETCH_ORDERS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch orders'
    });
    throw error;
  }
};

// Fetch user's orders
export const fetchMyOrders = () => async (dispatch) => {
  try {
    dispatch({ type: types.FETCH_ORDERS_REQUEST });

    const response = await api.get(API_URL.GET_MY_ORDERS);

    dispatch({
      type: types.FETCH_ORDERS_SUCCESS,
      payload: response.data.orders
    });

    return response.data;
  } catch (error) {
    dispatch({
      type: types.FETCH_ORDERS_FAILURE,
      payload: error.response?.data?.message || 'Failed to fetch orders'
    });
    throw error;
  }
};

// Update order status (admin)
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: types.UPDATE_ORDER_STATUS_REQUEST });

    const response = await api.put(
      API_URL.UPDATE_ORDER_STATUS(orderId),
      { status }
    );

    // After updating the status, fetch the complete order with population
    // This ensures we have all the data needed for sending notifications
    const orderDetailsResponse = await api.get(`/orders/${orderId}`);
    const completeOrder = orderDetailsResponse.data;

    dispatch({
      type: types.UPDATE_ORDER_STATUS_SUCCESS,
      payload: completeOrder
    });

    return {
      message: response.data.message,
      order: completeOrder
    };
  } catch (error) {
    dispatch({
      type: types.UPDATE_ORDER_STATUS_FAILURE,
      payload: error.response?.data?.message || 'Failed to update order status'
    });
    throw error;
  }
};