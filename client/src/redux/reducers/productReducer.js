import {
  ADD_PRODUCT_SUCCESS,
  CLEAR_SEARCH_STATE, EDIT_PRODUCT_SUCCESS,
  GET_PRODUCTS_SUCCESS, REMOVE_PRODUCT_SUCCESS,
  SEARCH_PRODUCT_SUCCESS, CLEAR_PRODUCT_LIST
} from '@/constants/constants';

const initState = {
  lastRefKey: null,
  total: 0,
  items: [],
  page: 1
};

export default (state = {
  lastRefKey: null,
  total: 0,
  minPrice: 0,
  maxPrice: 0,
  items: [],
  page: 1,
  searchedProducts: initState
}, action) => {
  switch (action.type) {
    case CLEAR_PRODUCT_LIST:
      return {
        ...state,
        items: [],
        page: 1,
        total: 0
      };
    case GET_PRODUCTS_SUCCESS:
      return {
        ...state,
        lastRefKey: action.payload.lastKey,
        total: action.payload.total,
        minPrice: action.payload.minPrice || 0,
        maxPrice: action.payload.maxPrice || 0,
        page: action.payload.page || 1,
        items: (action.payload.page === 1)
          ? action.payload.products
          : [...state.items, ...action.payload.products]
      };
    case ADD_PRODUCT_SUCCESS:
      return {
        ...state,
        items: [...state.items, action.payload]
      };
    case SEARCH_PRODUCT_SUCCESS:
      return {
        ...state,
        searchedProducts: {
          lastRefKey: action.payload.lastKey,
          total: action.payload.total,
          items: [...state.searchedProducts.items, ...action.payload.products]
        }
      };
    case CLEAR_SEARCH_STATE:
      return {
        ...state,
        searchedProducts: initState
      };
    case REMOVE_PRODUCT_SUCCESS:
      return {
        ...state,
        items: state.items.filter((product) => product.id !== action.payload)
      };
    case EDIT_PRODUCT_SUCCESS:
      return {
        ...state,
        items: state.items.map((product) => {
          if (product.id === action.payload.id) {
            return {
              ...product,
              ...action.payload.updates
            };
          }
          return product;
        })
      };
    default:
      return state;
  }
};
