import {
    GET_ORDERS_SUCCESS,
    GET_ORDER_DETAIL_SUCCESS,
    CREATE_ORDER_SUCCESS,
    UPDATE_ORDER_SUCCESS,
    CANCEL_ORDER_SUCCESS
} from '@/constants/constants';

const initState = {
    orders: [],
    order: null,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 1
    }
};

export default (state = initState, action) => {
    switch (action.type) {
        case GET_ORDERS_SUCCESS:
            return {
                ...state,
                orders: action.payload.orders || [],
                pagination: action.payload.pagination || state.pagination
            };
        case GET_ORDER_DETAIL_SUCCESS:
            return {
                ...state,
                order: action.payload
            };
        case CREATE_ORDER_SUCCESS:
            return {
                ...state,
                orders: [action.payload, ...state.orders]
            };
        case UPDATE_ORDER_SUCCESS:
        case CANCEL_ORDER_SUCCESS:
            return {
                ...state,
                orders: state.orders.map((order) =>
                    order.id === action.payload.id ? action.payload : order
                ),
                order: action.payload
            };
        default:
            return state;
    }
};
