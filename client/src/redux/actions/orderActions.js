import {
    GET_ORDERS,
    GET_ORDERS_SUCCESS,
    GET_ORDER_DETAIL,
    GET_ORDER_DETAIL_SUCCESS,
    CREATE_ORDER,
    CREATE_ORDER_SUCCESS,
    UPDATE_ORDER,
    UPDATE_ORDER_SUCCESS,
    CANCEL_ORDER,
    CANCEL_ORDER_SUCCESS
} from '@/constants/constants';

// Get user orders
export const getOrders = (userId) => ({
    type: GET_ORDERS,
    payload: { userId }
});

export const getOrdersSuccess = (orders) => ({
    type: GET_ORDERS_SUCCESS,
    payload: orders
});

// Get single order detail
export const getOrderDetail = (orderId) => ({
    type: GET_ORDER_DETAIL,
    payload: { orderId }
});

export const getOrderDetailSuccess = (order) => ({
    type: GET_ORDER_DETAIL_SUCCESS,
    payload: order
});

// Create order
export const createOrder = (orderData) => ({
    type: CREATE_ORDER,
    payload: orderData
});

export const createOrderSuccess = (order) => ({
    type: CREATE_ORDER_SUCCESS,
    payload: order
});

// Update order
export const updateOrder = (orderId, status, note) => ({
    type: UPDATE_ORDER,
    payload: { orderId, status, note }
});

export const updateOrderSuccess = (order) => ({
    type: UPDATE_ORDER_SUCCESS,
    payload: order
});

// Cancel order
export const cancelOrder = (orderId) => ({
    type: CANCEL_ORDER,
    payload: { orderId }
});

export const cancelOrderSuccess = (order) => ({
    type: CANCEL_ORDER_SUCCESS,
    payload: order
});
