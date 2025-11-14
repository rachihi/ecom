# ❌ Client Product Pages - Issues Found

## 🚨 Các vấn đề chính:

### 1. **API Endpoints Không Match** ❌

**Backend hỗ trợ:**

```
GET /api/product/featured  ✅
GET /api/product/new-products  ✅
GET /api/product/bestsellers  ✅
GET /api/product/top-rated  ✅
GET /api/product/all-product?search=...&category=...&status=...&sort=...  ✅
```

**Client đang gọi:**

```
GET /product/all-product?isFeatured=true  ❌ (backend không hỗ trợ query param này)
GET /product/all-product?isRecommended=true  ❌ (backend không hỗ trợ)
GET /product/new-products  ✅ ĐÚNG
GET /product/bestsellers  ✅ ĐÚNG
GET /product/top-rated  ✅ ĐÚNG
```

### 2. **Transform Product Data - Fields Mismatch** ❌

**ProductAPI.transformProduct() sai:**

```javascript
// ❌ SAI - Trường "isNew" không tồn tại, đã được đổi thành "isNewProduct"
isNew: apiProduct.isNew,

// ❌ SAI - Model không có "pSold" field
sold: apiProduct.pSold,

// ❌ SAI - Path lỗi cho materials
materials: {
  primary: apiProduct.furniture?.material?.primary,  // ← "material" sai, phải "materials"
  secondary: apiProduct.furniture?.material?.secondary,
  filling: apiProduct.furniture?.material?.filling,
},

// ❌ SAI - Path lỏng lẻo cho care
care: apiProduct.furniture?.care,  // ← phải "careInstructions"

// ✅ ĐÚNG
styles: apiProduct.furniture?.style,
features: apiProduct.furniture?.features,
warranty: apiProduct.furniture?.warranty,
dimensions: apiProduct.furniture?.dimensions,
colors: apiProduct.furniture?.colors,
```

### 3. **Missing Fields - Không lấy đủ dữ liệu** ❌

Client transformProduct không lấy:

- ❌ `pShortDescription` (đã có nhưng sai vị trí logic)
- ❌ `pComparePrice` → `comparePrice`
- ❌ `pCost` → không có transform
- ❌ `pOffer` → `offer`
- ❌ `offerExpiry` → `offerExpiry`
- ❌ `view_count` → `views`
- ❌ `wishlist_count` → `wishlistCount`
- ❌ `isNewProduct` (renamed from isNew)
- ❌ `isBestseller` → không có transform

### 4. **Hooks Không Phù Hợp Backend** ❌

**useFeaturedProducts.js:**

```javascript
// Sai: Backend không trả "Products", mà trả "products"
const { Products = [] } = response.data; // ❌ SAI

// Phải là:
const { products = [] } = response.data; // ✅ ĐÚNG

// Thêm: Backend không trả về isFeatured, isRecommended, availableColors...
// Phải parse từ furniture data
```

### 5. **Redux Store Không Update** ❌

Shop view đang dùng Redux:

```jsx
const store = useSelector(
  (state) => ({
    filteredProducts: selectFilter(state.products.items, state.filter),
    products: state.products,
    requestStatus: state.app.requestStatus,
    isLoading: state.app.loading,
  }),
  shallowEqual
);
```

**Vấn đề:** Redux store chưa integrate với API mới:

- Không fetch từ `/api/product/all-product` endpoint mới
- Không include furniture fields
- Không include các fields mới (pShortDescription, pComparePrice, pCost, etc.)

---

## 📋 Danh sách lỗi chi tiết

| #   | Loại      | File                      | Vấn đề                                                                       | Mức độ       |
| --- | --------- | ------------------------- | ---------------------------------------------------------------------------- | ------------ |
| 1   | API       | productAPI.js             | `isFeatured=true` query param không tồn tại                                  | 🔴 Critical  |
| 2   | API       | productAPI.js             | `isRecommended=true` query param không tồn tại                               | 🔴 Critical  |
| 3   | Transform | productAPI.js             | `furniture?.material` sai, phải `furniture?.materials`                       | 🔴 Critical  |
| 4   | Transform | productAPI.js             | `care` sai, phải `careInstructions`                                          | 🔴 Critical  |
| 5   | Transform | productAPI.js             | `isNew` sai, phải `isNewProduct`                                             | 🔴 Critical  |
| 6   | Transform | productAPI.js             | Thiếu `pShortDescription`, `pComparePrice`, `pCost`, `pOffer`, `offerExpiry` | 🔴 Critical  |
| 7   | Hook      | useFeaturedProducts.js    | `Products` sai, phải `products`                                              | 🔴 Critical  |
| 8   | Hook      | useFeaturedProducts.js    | Không parse `isFeatured` từ response                                         | 🟡 Important |
| 9   | Hook      | useRecommendedProducts.js | Cùng vấn đề như useFeaturedProducts                                          | 🔴 Critical  |
| 10  | Redux     | Shop view                 | Redux store chưa integrate API mới                                           | 🔴 Critical  |

---

## 🔧 Cần sửa:

### Priority 1 - Critical (Phải sửa trước):

1. ✅ Sửa productAPI.js transformProduct():

   - Fix `furniture?.material` → `furniture?.materials`
   - Fix `care` → `careInstructions`
   - Fix `isNew` → `isNewProduct`
   - Thêm missing fields: shortDescription, comparePrice, cost, offer, offerExpiry

2. ✅ Sửa productAPI.js API calls:

   - `getFeaturedProducts`: Gọi `/product/featured` thay vì query param
   - `getRecommendedProducts`: Gọi endpoint riêng hoặc dùng getAllProduct + filter

3. ✅ Sửa hooks:
   - useFeaturedProducts: Parse `products` không phải `Products`
   - useRecommendedProducts: Cùng

### Priority 2 - High (Nên sửa):

4. ✅ Update Redux store để fetch từ API mới
5. ✅ Thêm furniture fields vào product component
6. ✅ Thêm fields hiển thị: comparePrice, shortDescription, offer

### Priority 3 - Medium (Có thể sửa sau):

7. ✅ Optimize component rendering với furniture data
8. ✅ Thêm filter UI cho furniture fields (materials, styles, colors)
9. ✅ Thêm image gallery support cho các image types khác nhau

---

## 📊 Status Summary

| Component                 | Status     | Issue Count            |
| ------------------------- | ---------- | ---------------------- |
| productAPI.js             | ❌ Broken  | 6 issues               |
| useFeaturedProducts.js    | ❌ Broken  | 2 issues               |
| useRecommendedProducts.js | ❌ Broken  | 2 issues               |
| Shop view (Redux)         | ⚠️ Partial | 1 issue                |
| ProductGrid component     | ⚠️ Partial | Needs furniture fields |
| View Product page         | ⚠️ Unknown | Need to check          |

---

## 🎯 Impact

**Hiện tại client KHÔNG THỂ:**

- ❌ Hiển thị featured products (sai endpoint)
- ❌ Hiển thị recommended products (sai endpoint)
- ❌ Hiển thị furniture details (transform sai)
- ❌ Hiển thị price comparison (field thiếu)
- ❌ Hiển thị short description (field thiếu)
- ❌ Hiển thị promotional info (offer/expiry thiếu)

**Client CÓ THỂ:**

- ✅ Hiển thị new products
- ✅ Hiển thị bestsellers
- ✅ Hiển thị top rated
- ✅ Search products (cơ bản)

---

## 🔑 Key Takeaways

1. **API Service cũ không tương thích với backend mới**
2. **Transform logic sai path names** (material vs materials, care vs careInstructions)
3. **Hooks không parse response đúng** (Products vs products)
4. **Nhiều fields mới không được transform** (comparePrice, cost, offer, etc.)
5. **Redux store chưa update** để fetch API mới

**Cần cập nhật trước khi client có thể hoạt động!**
