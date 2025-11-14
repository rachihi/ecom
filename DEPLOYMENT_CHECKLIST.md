# ✅ CHECKLIST - Triển Khai Hệ Thống Sản Phẩm Nội Thất

## 📋 Phase 1: Integration (1 ngày)

### Backend Setup

- [ ] **Tạo route trong app.js**

  ```javascript
  const productRoutes = require("./routes/products_new");
  app.use("/api/product", productRoutes);
  ```

  - File: `server/app.js`
  - Chi phí: 2 dòng code
  - Thời gian: 5 phút

- [ ] **Kiểm tra thư mục uploads**

  ```bash
  mkdir -p public/uploads/products
  ```

  - Folder: `server/public/uploads/products/`
  - Status: Multer sẽ auto-create nếu chưa có
  - Thời gian: 1 phút

- [ ] **Test GET endpoint**

  ```bash
  curl http://localhost:8000/api/product/all-product?limit=12
  ```

  - Expected: 200 OK, empty products array
  - Thời gian: 5 phút

- [ ] **Test POST endpoint (protected)**
  ```bash
  # Cần admin token
  curl -X POST http://localhost:8000/api/product/single-product \
    -H "Authorization: Bearer {token}" \
    -d '{"pId":"507f1f77bcf86cd799439011"}'
  ```
  - Expected: 200 OK hoặc 404 nếu không có product
  - Thời gian: 5 phút

### Frontend Setup

- [ ] **Update client .env**

  ```env
  VITE_API_BASE_URL=http://localhost:8000/api
  ```

  - File: `client/.env`
  - Thời gian: 2 phút

- [ ] **Update admin .env**

  ```env
  REACT_APP_API_BASE_URL=http://localhost:8000/api
  ```

  - File: `admin-client/.env`
  - Thời gian: 2 phút

- [ ] **Verify productAPI import**
  ```javascript
  import { productAPI } from "@/services/productAPI";
  ```
  - Files: Các component dùng productAPI
  - Thời gian: 5 phút

### Documentation Review

- [ ] **Đọc QUICK_REFERENCE.md**

  - Mục: "API Endpoints Nhanh", "Code Examples"
  - Thời gian: 15 phút

- [ ] **Đọc IMPLEMENTATION_GUIDE.md**
  - Mục: "Các Bước Triển Khai"
  - Thời gian: 20 phút

---

## 📋 Phase 2: Backend Testing (1 ngày)

### Upload Image Tests

- [ ] **Test single image upload**

  ```bash
  curl -X POST http://localhost:8000/api/product/upload-images \
    -H "Authorization: Bearer {token}" \
    -F "images=@/path/to/image.jpg" \
    -F "imageTypes=main"
  ```

  - Expected: 200 OK, file saved
  - Folder: `public/uploads/products/`
  - Thời gian: 10 phút

- [ ] **Test multiple images upload**

  ```bash
  curl -X POST http://localhost:8000/api/product/upload-images \
    -H "Authorization: Bearer {token}" \
    -F "images=@image1.jpg" \
    -F "images=@image2.jpg" \
    -F "images=@image3.jpg" \
    -F "imageTypes=main" \
    -F "imageTypes=detail" \
    -F "imageTypes=color"
  ```

  - Expected: 200 OK, 3 files saved
  - Thời gian: 10 phút

- [ ] **Test file type validation**

  ```bash
  # Should fail - wrong format
  curl -X POST ... -F "images=@file.pdf"
  ```

  - Expected: 400 error "Invalid file type"
  - Thời gian: 5 phút

- [ ] **Test file size limit**
  ```bash
  # Create 10MB+ file and try upload
  # Should fail with "File size is too large"
  ```
  - Expected: 400 error
  - Thời gian: 5 phút

### Product CRUD Tests

- [ ] **Create product**

  ```bash
  curl -X POST http://localhost:8000/api/product/add-product \
    -H "Authorization: Bearer {token}" \
    -F "pName=Sofa" \
    -F "pDescription=..." \
    -F "pPrice=5000000" \
    -F "pQuantity=10" \
    -F "pCategory=..." \
    -F "pStatus=active" \
    -F "images=@sofa.jpg"
  ```

  - Expected: 200 OK, product created
  - Check DB: Verify in MongoDB
  - Thời gian: 10 phút

- [ ] **Read product**

  ```bash
  GET /api/product/all-product?limit=12
  POST /api/product/single-product { pId: "..." }
  ```

  - Expected: 200 OK, product data returned
  - Thời gian: 5 phút

- [ ] **Update product**

  ```bash
  curl -X POST http://localhost:8000/api/product/edit-product \
    -H "Authorization: Bearer {token}" \
    -F "pId=..." \
    -F "pName=Sofa Mới" \
    -F "..." (other fields)
  ```

  - Expected: 200 OK, product updated
  - Thời gian: 10 phút

- [ ] **Delete product**
  ```bash
  DELETE /api/product/delete-product/{id}
  ```
  - Expected: 200 OK, product deleted
  - Verify: ảnh cũng bị xóa
  - Thời gian: 5 phút

### Filter & Search Tests

- [ ] **Test search**

  ```bash
  GET /api/product/all-product?q=sofa
  ```

  - Expected: 200 OK, filtered results
  - Thời gian: 5 phút

- [ ] **Test price filter**

  ```bash
  GET /api/product/all-product?minPrice=1000000&maxPrice=5000000
  ```

  - Expected: Products in price range
  - Thời gian: 5 phút

- [ ] **Test category filter**

  ```bash
  GET /api/product/all-product?category=cat_001
  ```

  - Expected: Products in category
  - Thời gian: 5 phút

- [ ] **Test combined filters**

  ```bash
  GET /api/product/all-product?q=sofa&minPrice=1000000&category=cat_001
  ```

  - Expected: All filters applied
  - Thời gian: 5 phút

- [ ] **Test sorting**
  ```bash
  GET /api/product/all-product?sort=price-asc
  GET /api/product/all-product?sort=newest
  GET /api/product/all-product?sort=popular
  ```
  - Expected: Correct sort order
  - Thời gian: 10 phút

### Special Endpoints Tests

- [ ] **Test featured products**

  ```bash
  GET /api/product/featured
  ```

  - Expected: Featured products (isFeatured=true)
  - Thời gian: 5 phút

- [ ] **Test recommended products**

  ```bash
  GET /api/product/all-product?isRecommended=true
  ```

  - Expected: Recommended products
  - Thời gian: 5 phút

- [ ] **Test new products**

  ```bash
  GET /api/product/new-products
  ```

  - Expected: New products (isNew=true)
  - Thời gian: 5 phút

- [ ] **Test bestsellers**
  ```bash
  GET /api/product/bestsellers
  ```
  - Expected: Top selling products
  - Thời gian: 5 phút

### Review Management Tests

- [ ] **Add review**

  ```bash
  POST /api/product/add-review
  ```

  - Expected: Review added to product
  - Thời gian: 5 phút

- [ ] **Delete review**
  ```bash
  POST /api/product/delete-review
  ```
  - Expected: Review removed
  - Thời gian: 5 phút

---

## 📋 Phase 3: Frontend Components (3-4 ngày)

### Client Components

- [ ] **ProductFilter Component**

  - [ ] Price range slider
  - [ ] Category dropdown
  - [ ] Material multi-select
  - [ ] Color picker
  - [ ] Style checkboxes
  - [ ] Size tabs
  - [ ] Rating filter
  - File: `client/src/components/ProductFilter.jsx`
  - Thời gian: 8 giờ

- [ ] **ProductCard Component**

  - [ ] Display product image
  - [ ] Show price + discount
  - [ ] Rating display
  - [ ] Add to cart button
  - [ ] Wishlist button
  - File: `client/src/components/product/ProductCard.jsx`
  - Thời gian: 4 giờ

- [ ] **ProductDetail Component**

  - [ ] Gallery of images
  - [ ] All product info
  - [ ] Specifications (dimensions, materials, etc)
  - [ ] Reviews section
  - [ ] Add to cart
  - File: `client/src/views/view_product/ProductDetail.jsx`
  - Thời gian: 6 giờ

- [ ] **Shop Page Update**

  - [ ] Integrate filters
  - [ ] Integrate product grid
  - [ ] Pagination
  - [ ] Search bar
  - File: `client/src/views/shop/Shop.jsx`
  - Thời gian: 4 giờ

- [ ] **Featured/Recommended Pages**
  - [ ] Load featured products
  - [ ] Load recommended products
  - [ ] Display with filters
  - Files: `client/src/views/featured/`, `client/src/views/recommended/`
  - Thời gian: 4 giờ

### Admin Components

- [ ] **ProductImageUpload Component**

  - [ ] Drag-drop upload
  - [ ] File validation
  - [ ] Progress indicator
  - [ ] Preview images
  - [ ] Select image types
  - File: `admin-client/src/components/ProductImageUpload.tsx`
  - Thời gian: 4 giờ

- [ ] **FurnitureInfoForm Component**

  - [ ] Dimensions input
  - [ ] Material select
  - [ ] Color picker (multiple)
  - [ ] Style checkboxes
  - [ ] Features checkboxes
  - [ ] Warranty info
  - [ ] Care instructions
  - File: `admin-client/src/components/FurnitureInfoForm.tsx`
  - Thời gian: 6 giờ

- [ ] **ProductFilter Component (Admin)**
  - [ ] Category select
  - [ ] Status filter
  - [ ] Price range
  - [ ] Search
  - File: `admin-client/src/components/ProductFilter.tsx`
  - Thời gian: 3 giờ

### Admin Pages

- [ ] **ProductList Page**

  - [ ] Table view products
  - [ ] Filters & search
  - [ ] Pagination
  - [ ] Actions: edit, delete
  - [ ] Bulk operations
  - File: `admin-client/src/pages/admin/products/ProductList.tsx`
  - Thời gian: 8 giờ

- [ ] **ProductCreate Page**

  - [ ] Form for new product
  - [ ] Image upload
  - [ ] Furniture info form
  - [ ] Save product
  - File: `admin-client/src/pages/admin/products/ProductCreate.tsx`
  - Thời gian: 6 giờ

- [ ] **ProductEdit Page**
  - [ ] Load existing product
  - [ ] Edit all fields
  - [ ] Upload new images
  - [ ] Update product
  - File: `admin-client/src/pages/admin/products/ProductEdit.tsx`
  - Thời gian: 6 giờ

---

## 📋 Phase 4: Data Migration (1 ngày)

- [ ] **Backup old data**

  ```bash
  mongoexport --db ecom --collection products --out products_backup.json
  ```

  - Thời gian: 5 phút

- [ ] **Run migration script**

  ```bash
  node server/scripts/migrateProducts.js
  ```

  - File: Script trong FURNITURE_PRODUCT_REDESIGN.md
  - Verify: Check MongoDB documents
  - Thời gian: 20 phút

- [ ] **Verify migrated data**

  - [ ] Check all products have pSKU
  - [ ] Check images array structure
  - [ ] Check furniture object
  - Thời gian: 15 phút

- [ ] **Test with migrated data**
  - [ ] Load products in UI
  - [ ] Test filters
  - [ ] View details
  - Thời gian: 30 phút

---

## 📋 Phase 5: Image Optimization (2 ngày)

- [ ] **Setup thumbnail generation**

  - [ ] Small (200px)
  - [ ] Medium (500px)
  - [ ] Large (1000px)
  - Library: Sharp hoặc ImageMagick
  - Thời gian: 8 giờ

- [ ] **Setup caching strategy**

  - [ ] Browser cache headers
  - [ ] CDN cache headers
  - [ ] Compression (gzip, brotli)
  - Thời gian: 4 giờ

- [ ] **Setup image optimization**
  - [ ] Convert to WebP
  - [ ] Lazy loading
  - [ ] Responsive images
  - Thời gian: 4 giờ

---

## 📋 Phase 6: Testing & QA (2-3 ngày)

### Functionality Tests

- [ ] **Product Management**

  - [ ] Create product ✅
  - [ ] Edit product ✅
  - [ ] Delete product ✅
  - [ ] Upload images ✅
  - [ ] Image display ✅

- [ ] **Product View**

  - [ ] List page loads ✅
  - [ ] Detail page loads ✅
  - [ ] Images display correctly ✅
  - [ ] Info displays correctly ✅

- [ ] **Filters & Search**

  - [ ] All filters work ✅
  - [ ] Combined filters work ✅
  - [ ] Search works ✅
  - [ ] Sort works ✅
  - [ ] Pagination works ✅

- [ ] **Reviews**
  - [ ] Add review ✅
  - [ ] View reviews ✅
  - [ ] Delete review (admin) ✅

### Performance Tests

- [ ] **Page Load Speed**

  - [ ] Product list < 2s
  - [ ] Product detail < 2s
  - [ ] Upload < 5s
  - Metric: Lighthouse score > 80

- [ ] **Database Queries**

  - [ ] All queries < 100ms
  - [ ] Pagination works smoothly
  - [ ] Filters don't cause slow queries

- [ ] **Image Loading**
  - [ ] Thumbnails load quickly
  - [ ] Lazy loading works
  - [ ] Images cached correctly

### Browser Compatibility

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)
- [ ] **Mobile browsers** (iOS Safari, Chrome Mobile)

### Responsive Design

- [ ] **Desktop** (1920px+)
- [ ] **Laptop** (1366px)
- [ ] **Tablet** (768px)
- [ ] **Mobile** (375px)

### Security Tests

- [ ] **File upload validation**

  - [ ] Reject non-image files ✅
  - [ ] Reject oversized files ✅
  - [ ] Sanitize filenames ✅

- [ ] **Auth checks**
  - [ ] Admin routes protected ✅
  - [ ] Public routes accessible ✅
  - [ ] Token validation works ✅

---

## 📋 Phase 7: Deployment (1 ngày)

### Pre-deployment

- [ ] **Environment variables**

  - [ ] `.env` cho client
  - [ ] `.env` cho admin
  - [ ] Database connection
  - [ ] API base URLs

- [ ] **Build production**

  ```bash
  # Backend
  npm start

  # Client
  npm run build

  # Admin
  npm run build
  ```

- [ ] **Database backups**
  ```bash
  mongodump --out ./backup
  ```

### Deployment

- [ ] **Deploy backend**

  - [ ] Push code to server
  - [ ] Install dependencies
  - [ ] Start service
  - [ ] Verify endpoints

- [ ] **Deploy client**

  - [ ] Build static files
  - [ ] Upload to CDN/hosting
  - [ ] Update DNS/routing
  - [ ] Verify URLs

- [ ] **Deploy admin**
  - [ ] Build static files
  - [ ] Upload to CDN/hosting
  - [ ] Update DNS/routing
  - [ ] Verify URLs

### Post-deployment

- [ ] **Monitoring**

  - [ ] Setup error tracking
  - [ ] Setup performance monitoring
  - [ ] Setup uptime checks

- [ ] **Final verification**
  - [ ] Test all endpoints
  - [ ] Test UI workflows
  - [ ] Check image delivery
  - [ ] Monitor error logs

---

## 📊 Summary

| Phase     | Tasks              | Duration       | Status |
| --------- | ------------------ | -------------- | ------ |
| 1         | Integration        | 1 ngày         | ⏳     |
| 2         | Backend Testing    | 1 ngày         | ⏳     |
| 3         | Components         | 3-4 ngày       | ⏳     |
| 4         | Data Migration     | 1 ngày         | ⏳     |
| 5         | Image Optimization | 2 ngày         | ⏳     |
| 6         | Testing & QA       | 2-3 ngày       | ⏳     |
| 7         | Deployment         | 1 ngày         | ⏳     |
| **TOTAL** | **21 tasks**       | **11-12 ngày** | **⏳** |

---

## 📞 Support

Gặp vấn đề? Xem:

1. **QUICK_REFERENCE.md** - Troubleshooting section
2. **IMPLEMENTATION_GUIDE.md** - Q&A section
3. **Test logs** - Debug thông tin chi tiết

---

**Start with Phase 1 today! 🚀**
