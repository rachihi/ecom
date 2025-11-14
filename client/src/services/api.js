import axios from 'axios';

// Base URL của server Node.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('serviceToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('serviceToken');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Create multipart form-data instance for file uploads
const apiFormData = axios.create({
  baseURL: API_BASE_URL,
});

apiFormData.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('serviceToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiFormData.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('serviceToken');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// ============================================
// PRODUCT APIs
// ============================================

export const productAPI = {
  // Get all products with pagination
  getProducts: (params = {}) => {
    const { page = 1, limit = 12, q = '', category = '' } = params;
    let url = `/product/all-product?page=${page}&limit=${limit}`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (category) url += `&category=${category}`;
    return api.get(url);
  },

  // Get single product by ID
  getProductById: (id) => api.post('/product/single-product', { pId: id }),

  // Search products
  searchProducts: (searchKey) => api.get(`/product/all-product?q=${encodeURIComponent(searchKey)}&limit=100`),

  // Add product with file upload
  addProduct: (formData) => {
    return apiFormData.post('/product/add-product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Edit product with file upload
  editProduct: (productId, formData) => {
    return apiFormData.put(`/product/edit-product/${productId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete product
  deleteProduct: (productId) => api.delete(`/product/delete-product/${productId}`),

  // Get featured products
  getFeaturedProducts: (limit = 6) => {
    return api.get(`/product/all-product?limit=${limit}&isFeatured=true`);
  },

  // Get recommended products
  getRecommendedProducts: (limit = 6) => {
    return api.get(`/product/all-product?limit=${limit}&isRecommended=true`);
  },
};

// ============================================
// ORDER APIs
// ============================================

export const orderAPI = {
  // Create order (checkout)
  // orderData: { items: [{productId, quantity, price}], totalAmount, shippingAddress, customerId }
  createOrder: (orderData) => api.post('/order/create-order', orderData),

  // Get orders by user
  getOrdersByUser: (userId) => api.post('/order/order-by-user', { uId: userId }),

  // Get order detail
  getOrderDetail: (orderId) => api.get(`/order/${orderId}`),

  // Update order (status, note)
  updateOrder: (orderId, data) => api.put(`/order/${orderId}`, data),

  // Cancel order
  cancelOrder: (orderId) => api.put(`/order/${orderId}/cancel`, {}),
};

// ============================================
// CATEGORY APIs
// ============================================

export const categoryAPI = {
  // Get all categories
  getCategories: () => api.get('/category/all-category?limit=1000'),
};

// ============================================
// CUSTOMER AUTH APIs (for client app)
// ============================================

export const authAPI = {
  // Customer sign in
  signin: (email, password) => api.post('/customer/signin', { email, password }),

  // Customer sign up
  signup: (fullName, email, password, phoneNumber, address) =>
    api.post('/customer/signup', { fullName, email, password, phoneNumber, address }),

  // Sign out (just remove token)
  signout: () => {
    localStorage.removeItem('serviceToken');
    return Promise.resolve({ success: true });
  },

  // Get customer profile
  getProfile: () => api.get('/customer/profile'),
};

export default api;

