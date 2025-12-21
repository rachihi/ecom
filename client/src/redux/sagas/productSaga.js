/* eslint-disable indent */
import {
  ADD_PRODUCT,
  EDIT_PRODUCT,
  GET_PRODUCTS,
  REMOVE_PRODUCT,
  SEARCH_PRODUCT
} from '@/constants/constants';
import { ADMIN_PRODUCTS } from '@/constants/routes';
import { displayActionMessage } from '@/helpers/utils';
import {
  all, call, put, select
} from 'redux-saga/effects';
import { setLoading, setRequestStatus } from '@/redux/actions/miscActions';
import { history } from '@/routers/AppRouter';
import { productAPI } from '@/services/api';
import {
  addProductSuccess,
  clearSearchState, editProductSuccess, getProductsSuccess,
  removeProductSuccess,
  searchProductSuccess
} from '../actions/productActions';

function* initRequest() {
  yield put(setLoading(true));
  yield put(setRequestStatus(null));
}

function* handleError(e) {
  yield put(setLoading(false));
  yield put(setRequestStatus(e?.message || 'Failed to fetch products'));
  console.log('ERROR: ', e);
}

function* handleAction(location, message, status) {
  if (location) yield call(history.push, location);
  yield call(displayActionMessage, message, status);
}

function* productSaga({ type, payload }) {
  switch (type) {
    case GET_PRODUCTS:
      try {
        yield initRequest();
        const state = yield select();
        const { filter } = state;

        // Call API instead of Firebase
        const page = payload?.page || 1;
        const limit = payload?.limit || 12;
        const response = yield call(productAPI.getProducts, {
          page,
          limit,
          category: filter.category,
          minPrice: filter.minPrice,
          maxPrice: filter.maxPrice,
          sort: filter.sortBy
        });
        const { products = [], total = 0, minPrice = 0, maxPrice = 0 } = response.data;
        const transformedProducts = products.map(product => productAPI.transformProduct(product));

        if (transformedProducts.length === 0) {
          handleError('No items found.');
        } else {
          yield put(getProductsSuccess({
            products: transformedProducts,
            lastKey: null,
            total: total,
            minPrice,
            maxPrice,
            page
          }));
          yield put(setRequestStatus(''));
        }
        yield put(setLoading(false));
      } catch (e) {
        console.log(e);
        yield handleError(e);
      }
      break;
    case SEARCH_PRODUCT: {
      try {
        yield initRequest();
        // clear search data
        yield put(clearSearchState());

        const state = yield select();

        // Call API instead of Firebase
        const response = yield call(productAPI.searchProducts, payload.searchKey);
        const { products = [] } = response.data;

        // Transform API response
        const transformedProducts = products.map(product => productAPI.transformProduct(product));

        if (transformedProducts.length === 0) {
          yield handleError({ message: 'No product found.' });
          yield put(clearSearchState());
        } else {
          yield put(searchProductSuccess({
            products: transformedProducts,
            lastKey: null,
            total: transformedProducts.length
          }));
          yield put(setRequestStatus(''));
        }
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

export default productSaga;
