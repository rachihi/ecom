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
(error) => {
  if (error.response?.status === 401) {
    // Ignore 401 from signin request to allow showing error message
    if (error.config.url.includes('signin')) {
      return Promise.reject(error);
    }

    // Token expired or invalid
    localStorage.removeItem('serviceToken');
    window.location.href = '/signin';
  }
  return Promise.reject(error);
}

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
    const { page = 1, limit = 12, q = '', category = '', minPrice = 0, maxPrice = 0, sort = '' } = params;
    let url = `/product/all-product?page=${page}&limit=${limit}&status=Active`;
    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (category) url += `&category=${category}`;
    if (minPrice > 0) url += `&minPrice=${minPrice}`;
    if (maxPrice > 0) url += `&maxPrice=${maxPrice}`;
    if (sort) url += `&sort=${sort}`;
    return api.get(url);
  },

  // Get single product by ID
  getProductById: (id) => api.post('/product/single-product', { pId: id }),

  // Search products
  searchProducts: (searchKey) => api.get(`/product/all-product?q=${encodeURIComponent(searchKey)}&limit=100&status=Active`),

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
    return api.get(`/product/all-product?limit=${limit}&isFeatured=true&status=Active`);
  },

  // Get recommended products
  getRecommendedProducts: (limit = 6) => {
    return api.get(`/product/all-product?limit=${limit}&isRecommended=true&status=Active`);
  },

  transformProduct: (product) => {
    console.log(product);

    return {
      id: product._id,
      name: product.pName,
      description: product.pDescription,
      price: product.pPrice,
      quantity: product.pQuantity,
      discount: product.pDiscount || 0,
      shortDescription: product.pShortDescription || '',
      rating: product.pRatings ? product.pRatings : 0,
      image: (product.images && product.images.length > 0) ? product.images[0] : (product.images && product.images.length > 0 ? product.images[0] : (product.thumbnailImage || '')),
      images: (product.images && product.images.length > 0) ? product.images.map((img, index) => ({ id: index, url: img })) : (product.images ? product.images.map((img, index) => ({ id: index, url: img })) : []),
      sizes: product.pSizes || [],
      availableColors: product.pAvailableColors || [],
      category: product.pCategory || '',
      brand: product.pBrand || '',
      isFeatured: product.pStatus === 'Featured',
      isRecommended: product.pStatus === 'Recommended',
      dateAdded: product.createdAt
    };
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
  cancelOrder: (orderId) => api.put(`/order/cancel-order`, { oId: orderId }),
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

  // Upload avatar
  uploadAvatar: (formData) => {
    return apiFormData.post('/uploads/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' } // Optional, axios sets it usually
    });
  },

  // Update profile
  updateProfile: (data) => api.put('/customer/profile', data),

  // Change password
  changePassword: (currentPassword, newPassword) =>
    api.post('/customer/change-password', { currentPassword, newPassword }),

  // Get customer orders
  getOrders: (params = {}) => {
    const { page = 1, limit = 10 } = params;
    return api.get(`/order/me?page=${page}&limit=${limit}`);
  },
};

export default api;

