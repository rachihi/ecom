/* eslint-disable indent */
import {
  GET_ORDERS,
  CREATE_ORDER,
  UPDATE_ORDER,
  CANCEL_ORDER,
  GET_ORDER_DETAIL
} from '@/constants/constants';
import { displayActionMessage } from '@/helpers/utils';
import {
  call, put
} from 'redux-saga/effects';
import { setLoading, setRequestStatus } from '@/redux/actions/miscActions';
import { orderAPI } from '@/services/api';
import {
  getOrdersSuccess,
  createOrderSuccess,
  updateOrderSuccess,
  cancelOrderSuccess,
  getOrderDetailSuccess
} from '../actions/orderActions';

function* initRequest() {
  yield put(setLoading(true));
  yield put(setRequestStatus(null));
}

function* handleError(e) {
  yield put(setLoading(false));
  yield put(setRequestStatus(e?.message || 'Failed to process order'));
  console.log('ERROR: ', e);
}

function* handleAction(message, status) {
  yield call(displayActionMessage, message, status);
}

function* orderSaga({ type, payload }) {
  switch (type) {
    case GET_ORDERS:
      try {
        yield initRequest();

        // Call API to get user's orders
        const response = yield call(orderAPI.getOrdersByUser, payload?.userId);
        const orders = response.data.orders || [];

        // Transform API response
        const transformedOrders = orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items || [],
          shippingAddress: order.shippingAddress,
          note: order.note,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        }));

        yield put(getOrdersSuccess(transformedOrders));
        yield put(setRequestStatus(''));
        yield put(setLoading(false));
      } catch (e) {
        console.log(e);
        yield handleError(e);
      }
      break;

    case CREATE_ORDER: {
      try {
        yield initRequest();

        // Transform payload for API
        const orderData = {
          items: payload.items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: payload.totalAmount,
          shippingAddress: payload.shippingAddress,
          note: payload.note || '',
          customerId: payload.customerId
        };

        // Call API to create order
        const response = yield call(orderAPI.createOrder, orderData);
        const newOrder = response.data;

        // Transform response
        const transformedOrder = {
          id: newOrder._id,
          orderNumber: newOrder.orderNumber,
          totalAmount: newOrder.totalAmount,
          status: newOrder.status || 'pending',
          paymentStatus: newOrder.paymentStatus || 'unpaid',
          items: newOrder.items || [],
          shippingAddress: newOrder.shippingAddress,
          note: newOrder.note,
          createdAt: newOrder.createdAt,
          updatedAt: newOrder.updatedAt,
        };

        yield put(createOrderSuccess(transformedOrder));
        yield handleAction('Order created successfully', 'success');
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
        yield handleAction(`Order creation failed: ${e?.message}`, 'error');
      }
      break;
    }

    case UPDATE_ORDER: {
      try {
        yield initRequest();

        // Call API to update order (mainly status)
        const response = yield call(orderAPI.updateOrder, payload.orderId, {
          status: payload.status,
          note: payload.note
        });
        const updatedOrder = response.data;

        // Transform response
        const transformedOrder = {
          id: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          totalAmount: updatedOrder.totalAmount,
          status: updatedOrder.status,
          paymentStatus: updatedOrder.paymentStatus,
          items: updatedOrder.items || [],
          shippingAddress: updatedOrder.shippingAddress,
          note: updatedOrder.note,
          createdAt: updatedOrder.createdAt,
          updatedAt: updatedOrder.updatedAt,
        };

        yield put(updateOrderSuccess(transformedOrder));
        yield handleAction('Order updated successfully', 'success');
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
        yield handleAction(`Order update failed: ${e?.message}`, 'error');
      }
      break;
    }

    case CANCEL_ORDER: {
      try {
        yield initRequest();

        // Call API to cancel order
        const response = yield call(orderAPI.cancelOrder, payload.orderId);
        const cancelledOrder = response.data;

        // Transform response
        const transformedOrder = {
          id: cancelledOrder._id,
          orderNumber: cancelledOrder.orderNumber,
          totalAmount: cancelledOrder.totalAmount,
          status: cancelledOrder.status,
          paymentStatus: cancelledOrder.paymentStatus,
          items: cancelledOrder.items || [],
          shippingAddress: cancelledOrder.shippingAddress,
          note: cancelledOrder.note,
          createdAt: cancelledOrder.createdAt,
          updatedAt: cancelledOrder.updatedAt,
        };

        yield put(cancelOrderSuccess(transformedOrder));
        yield handleAction('Order cancelled successfully', 'success');
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
        yield handleAction(`Order cancellation failed: ${e?.message}`, 'error');
      }
      break;
    }

    case GET_ORDER_DETAIL: {
      try {
        yield initRequest();

        // Call API to get order detail
        const response = yield call(orderAPI.getOrderDetail, payload.orderId);
        const order = response.data;

        // Transform response
        const transformedOrder = {
          id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items || [],
          shippingAddress: order.shippingAddress,
          note: order.note,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        };

        yield put(getOrderDetailSuccess(transformedOrder));
        yield put(setRequestStatus(''));
        yield put(setLoading(false));
      } catch (e) {
        yield handleError(e);
      }
      break;
    }

    default: {
      throw new Error(`Unexpected action type ${type}`);
    }
  }
}

export default orderSaga;
