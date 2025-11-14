/**
 * PRODUCT API SERVICE - CLIENT
 * Các hàm API liên quan đến sản phẩm cho client app
 * 
 * Endpoints Base: /api/product
 * Image Base: /uploads/products
 */

export const productAPI = {
  // ===========================
  // GET PRODUCTS - PUBLIC
  // ===========================

  /**
   * Lấy tất cả sản phẩm với pagination & filters
   * GET /api/product/all-product
   */
  getProducts: (params = {}) => {
    const {
      page = 1,
      limit = 12,
      q = "",
      category = "",
      minPrice = "",
      maxPrice = "",
      materials = "",
      colors = "",
      styles = "",
      isFeatured = "",
      isRecommended = "",
      isNew = "",
      sort = "newest",
    } = params;

    let url = `/product/all-product?page=${page}&limit=${limit}&sort=${sort}`;

    if (q) url += `&q=${encodeURIComponent(q)}`;
    if (category) url += `&category=${category}`;
    if (minPrice) url += `&minPrice=${minPrice}`;
    if (maxPrice) url += `&maxPrice=${maxPrice}`;
    if (materials) url += `&materials=${materials}`;
    if (colors) url += `&colors=${colors}`;
    if (styles) url += `&styles=${styles}`;
    if (isFeatured === "true") url += `&isFeatured=true`;
    if (isRecommended === "true") url += `&isRecommended=true`;
    if (isNew === "true") url += `&isNew=true`;

    return api.get(url);
  },

  /**
   * Tìm kiếm sản phẩm
   * GET /api/product/all-product?q=...
   */
  searchProducts: (searchKey, limit = 100) =>
    api.get(
      `/product/all-product?q=${encodeURIComponent(searchKey)}&limit=${limit}&sort=popular`
    ),

  /**
   * Lấy chi tiết 1 sản phẩm
   * POST /api/product/single-product { pId }
   */
  getProductById: (id) => api.post("/product/single-product", { pId: id }),

  /**
   * Lấy sản phẩm theo danh mục
   * POST /api/product/product-by-category
   */
  getProductByCategory: (categoryId, limit = 12, page = 1) =>
    api.post("/product/product-by-category", {
      categoryId,
      limit,
      page,
    }),

  /**
   * Lọc sản phẩm theo khoảng giá
   * POST /api/product/product-by-price
   */
  getProductByPrice: (minPrice, maxPrice, limit = 12, page = 1) =>
    api.post("/product/product-by-price", {
      minPrice,
      maxPrice,
      limit,
      page,
    }),

  /**
   * Lấy sản phẩm nổi bật (featured)
   * GET /api/product/featured
   */
  getFeaturedProducts: (limit = 6) =>
    api.get(`/product/all-product?limit=${limit}&isFeatured=true&sort=popular`),

  /**
   * Lấy sản phẩm được đề xuất (recommended)
   * GET /api/product/all-product?isRecommended=true
   */
  getRecommendedProducts: (limit = 6) =>
    api.get(
      `/product/all-product?limit=${limit}&isRecommended=true&sort=popular`
    ),

  /**
   * Lấy sản phẩm mới
   * GET /api/product/new-products
   */
  getNewProducts: (limit = 12, days = 30) =>
    api.get(`/product/new-products?limit=${limit}&days=${days}`),

  /**
   * Lấy sản phẩm bán chạy
   * GET /api/product/bestsellers
   */
  getBestsellers: (limit = 12) => api.get(`/product/bestsellers?limit=${limit}`),

  /**
   * Lấy sản phẩm được đánh giá cao
   * GET /api/product/top-rated
   */
  getTopRated: (limit = 12) => api.get(`/product/top-rated?limit=${limit}`),

  /**
   * Lấy wishlist products
   * POST /api/product/wish-product
   */
  getWishlistProducts: () => api.post("/product/wish-product"),

  /**
   * Lấy cart products
   * POST /api/product/cart-product
   */
  getCartProducts: () => api.post("/product/cart-product"),

  // ===========================
  // REVIEWS & RATINGS
  // ===========================

  /**
   * Thêm đánh giá sản phẩm
   * POST /api/product/add-review
   */
  addReview: (productId, { rating, title, review }) =>
    api.post("/product/add-review", {
      pId: productId,
      rating,
      title,
      review,
    }),

  /**
   * Xóa đánh giá
   * POST /api/product/delete-review
   */
  deleteReview: (productId, reviewId) =>
    api.post("/product/delete-review", {
      pId: productId,
      reviewId,
    }),

  // ===========================
  // IMAGE HELPERS
  // ===========================

  /**
   * Lấy URL đầy đủ cho hình ảnh
   */
  getImageUrl: (filename) => {
    if (!filename) return "/placeholder-image.png";
    return `${API_BASE_URL}${filename.startsWith("/") ? "" : "/"}${filename}`;
  },

  /**
   * Lấy main image từ product
   */
  getMainImage: (product) => {
    if (!product || !product.images) return null;
    const mainImage = product.images.find((img) => img.type === "main");
    return mainImage || product.images[0] || null;
  },

  /**
   * Lấy tất cả ảnh của một loại
   */
  getImagesByType: (product, type = "detail") => {
    if (!product || !product.images) return [];
    return product.images.filter((img) => img.type === type);
  },

  /**
   * Tính giá sau giảm
   */
  getPriceAfterDiscount: (price, discount) => {
    if (!discount) return price;
    return price - price * (discount / 100);
  },

  /**
   * Format giá VND
   */
  formatPrice: (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  },

  /**
   * Transform product data từ API response
   */
  transformProduct: (apiProduct) => {
    if (!apiProduct) return null;

    const mainImage = apiProduct.images?.find((img) => img.type === "main") ||
      apiProduct.images?.[0] || { filename: "" };

    return {
      // Thông tin cơ bản
      id: apiProduct._id,
      sku: apiProduct.pSKU,
      name: apiProduct.pName,
      description: apiProduct.pDescription,
      shortDescription: apiProduct.pShortDescription,

      // Giá
      price: apiProduct.pPrice,
      comparePrice: apiProduct.pComparePrice,
      discount: apiProduct.discount,
      discountedPrice: this.getPriceAfterDiscount(
        apiProduct.pPrice,
        apiProduct.discount
      ),

      // Hình ảnh
      images: apiProduct.images || [],
      mainImage: mainImage.filename,
      thumbnail: apiProduct.thumbnailImage,

      // Thông tin nội thất
      furniture: apiProduct.furniture || {},
      dimensions: apiProduct.furniture?.dimensions || {},
      materials: {
        primary: apiProduct.furniture?.material?.primary,
        secondary: apiProduct.furniture?.material?.secondary || [],
        filling: apiProduct.furniture?.material?.filling,
      },
      colors: apiProduct.furniture?.colors || [],
      styles: apiProduct.furniture?.style || [],
      features: apiProduct.furniture?.features || [],

      // Tình trạng
      quantity: apiProduct.pQuantity,
      sold: apiProduct.pSold,
      status: apiProduct.pStatus,
      inStock: apiProduct.pQuantity > 0,

      // Tags
      isFeatured: apiProduct.isFeatured,
      isRecommended: apiProduct.isRecommended,
      isNew: apiProduct.isNew,
      isOnSale: apiProduct.isOnSale,

      // Đánh giá
      reviews: apiProduct.pRatingsReviews || [],
      rating: this.calculateAverageRating(apiProduct.pRatingsReviews),
      reviewCount: apiProduct.pRatingsReviews?.length || 0,

      // Bảo hành & Chăm sóc
      warranty: apiProduct.furniture?.warranty || {},
      care: apiProduct.furniture?.care || [],
      assembly: apiProduct.furniture?.assembly || {},
    };
  },

  /**
   * Tính rating trung bình
   */
  calculateAverageRating: (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + parseInt(review.rating), 0);
    return (sum / reviews.length).toFixed(1);
  },
};
