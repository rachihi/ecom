# 🚀 QUICK REFERENCE - Hệ Thống Sản Phẩm Nội Thất

## 📌 Files Quan Trọng

```
📁 Backend
├── server/models/products_new.js          ← Model MongoDB mới (400 lines)
├── server/controller/products_new.js      ← Controller (500 lines)
├── server/routes/products_new.js          ← Routes + Multer (200 lines)

📁 Frontend - Client
├── client/src/services/productAPI.js      ← API service (300 lines)
├── client/src/hooks/useProduct.js         ← ✅ Đã cập nhật (Firebase → API)
├── client/src/hooks/useFeaturedProducts.js ← ✅ Đã cập nhật
├── client/src/hooks/useRecommendedProducts.js ← ✅ Đã cập nhật

📁 Frontend - Admin
├── admin-client/src/services/adminProductAPI.js ← API service (400 lines)

📁 Documentation
├── FURNITURE_PRODUCT_REDESIGN.md          ← Tổng quan (500 lines)
├── IMPLEMENTATION_GUIDE.md                ← Hướng dẫn (300 lines)
├── PRODUCT_REDESIGN_SUMMARY.md            ← Summary (400 lines)
└── QUICK_REFERENCE.md                     ← File này
```

---

## ⚡ API Endpoints Nhanh

### Public (Client)

```bash
# Lấy sản phẩm
GET   /api/product/all-product?page=1&limit=12&q=sofa&sort=newest

# Chi tiết
POST  /api/product/single-product          { pId: "..." }

# Filters
GET   /api/product/all-product?minPrice=1000000&maxPrice=5000000&materials=gỗ

# Special
GET   /api/product/featured                # Nổi bật
GET   /api/product/new-products            # Hàng mới
GET   /api/product/bestsellers             # Bán chạy
GET   /api/product/top-rated               # Đánh giá cao

# Reviews
POST  /api/product/add-review              { pId, rating, title, review }
```

### Admin Only (Protected by Auth Middleware)

```bash
# Upload ảnh
POST  /api/product/upload-images           FormData: images[], imageTypes[]

# CRUD
POST  /api/product/add-product             FormData: images[], furnitureData, ...
POST  /api/product/edit-product            FormData: images[], pId, ...
DELETE /api/product/delete-product/:id

# Reviews
POST  /api/product/delete-review           { pId, reviewId }
```

---

## 🔧 Cấu Hình Nhanh

### 1. Backend (app.js)

```javascript
// Thêm route
const productRoutes = require("./routes/products_new");
app.use("/api/product", productRoutes);
```

### 2. Client (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Admin-Client (.env)

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

---

## 📊 Sử Dụng API - Code Examples

### **JavaScript - Client**

#### Lấy sản phẩm với filter

```javascript
import { productAPI } from "@/services/productAPI";

// Tất cả sản phẩm
const response = await productAPI.getProducts({
  page: 1,
  limit: 12,
  category: "cat_001",
  minPrice: 1000000,
  maxPrice: 5000000,
  materials: "gỗ,da",
  sort: "price-asc",
});

// Response
const { products, total, totalPages, hasMore } = response.data.data;
products.forEach((product) => {
  console.log(product.pName, product.pPrice, product.discount);
});
```

#### Lấy chi tiết sản phẩm

```javascript
const response = await productAPI.getProductById("507f1f77bcf86cd799439011");
const product = productAPI.transformProduct(response.data.data);

console.log(product.name);
console.log(product.furniture.dimensions);
console.log(product.furniture.colors);
console.log(product.reviews);
```

#### Lấy ảnh

```javascript
const mainImage = productAPI.getMainImage(product);
const url = productAPI.getImageUrl(mainImage.filename);
// Result: http://localhost:8000/api/uploads/products/1699608000_...jpg

// Hoặc
const url = productAPI.getImageUrl(product.thumbnailImage);
```

#### Thêm đánh giá

```javascript
await productAPI.addReview(productId, {
  rating: 5,
  title: "Sản phẩm tuyệt vời",
  review: "Chất lượng rất tốt, bền, đẹp",
});
```

### **TypeScript - Admin**

#### Upload ảnh

```typescript
import { adminProductAPI } from "@/services/api";

const formData = new FormData();
imageFiles.forEach((file) => formData.append("images", file));
imageTypes.forEach((type) => formData.append("imageTypes", type));

const response = await adminProductAPI.uploadImages(formData);
console.log(response.data.data.images); // URLs uploaded
```

#### Tạo sản phẩm

```typescript
const furniture = {
  dimensions: { length: 200, width: 90, height: 80 },
  material: { primary: "Da", filling: "Xốp" },
  colors: [
    { colorName: "Nâu", colorCode: "#8B4513", available: true },
    { colorName: "Xám", colorCode: "#808080", available: true },
  ],
  style: ["Hiện đại", "Luxury"],
  features: ["Có tựa tay", "Có gối"],
  warranty: { duration: 24, type: "Toàn bộ" },
  care: ["Lau bằng khăn mềm", "Tránh tiếp xúc nước"],
};

const productData = {
  pName: "Sofa Da Nâu 3 Chỗ",
  pDescription: "Mô tả chi tiết...",
  pShortDescription: "Sofa da cao cấp...",
  pPrice: 5000000,
  pComparePrice: 6500000,
  pQuantity: 20,
  pCategory: "cat_001",
  discount: 23,
  pStatus: "active",
  isFeatured: true,
  furniture,
};

const formData = adminProductAPI.prepareProductData(productData, imageFiles, [
  "main",
  "detail",
  "detail",
  "color-brown",
]);

const response = await adminProductAPI.addProduct(formData);
console.log(response.data.data._id); // ID sản phẩm mới
```

#### Cập nhật sản phẩm

```typescript
const formData = adminProductAPI.prepareProductData(
  { ...productData, pName: "Tên mới" },
  [newImageFile], // Nếu thay ảnh
  ["main"]
);

const response = await adminProductAPI.editProduct(productId, formData);
```

#### Lấy thống kê

```typescript
const stats = await adminProductAPI.getProductStats("month");
const topSelling = await adminProductAPI.getTopSellingProducts(10, "month");
const lowSelling = await adminProductAPI.getLowSellingProducts(10);
```

---

## 🎨 Filters Available

### Query Parameters Format

```
?minPrice=VALUE
?maxPrice=VALUE
?materials=gỗ,da,kim%20loại        (comma-separated)
?colors=%238B4513,%23808080         (hex codes, URL-encoded)
?styles=hiện%20đại,tối%20giản       (URL-encoded)
?isFeatured=true
?isRecommended=true
?isNew=true
?sort=newest|oldest|popular|price-asc|price-desc|rating
```

### Filter Options

```javascript
const filters = {
  category: "cat_001",
  priceRange: [500000, 50000000],
  materials: ["gỗ", "da", "vải"],
  colors: ["#8B4513", "#808080", "#FFFFFF"],
  styles: ["Hiện đại", "Tối giản", "Vintage"],
  dimensions: "medium", // small|medium|large|xlarge
  features: ["drawer", "swivel"],
  minRating: 3,
  sort: "price-asc",
};
```

---

## 🖼️ Hình Ảnh - Qui Tắc

### Upload

```
Max files: 10 per request
Max size: 5MB per file
Formats: JPEG, PNG, WEBP, GIF
```

### Lưu trữ

```
Folder: public/uploads/products/
Format: {TIMESTAMP}_{SKU}_{TYPE}_{INDEX}.{EXT}
Example: 1699608000_FURN-CHR-001_main.jpg
```

### Loại Ảnh (Image Types)

```
- main:       Ảnh chính (thumbnail)
- detail:     Chi tiết, nhiều góc
- color:      Ảnh màu khác nhau
- usage:      Ảnh sử dụng trong phòng
- dimensions: Ảnh kích thước
- 360:        Ảnh 360 độ (nếu có)
```

### URL Truy Cập

```
http://localhost:8000/api/uploads/products/{FILENAME}
or
productAPI.getImageUrl(filename)
```

---

## 📝 Furniture Data Structure

### Template

```javascript
{
  dimensions: {
    length: 200,     // cm
    width: 90,
    height: 80,
    depth: 90        // optional
  },
  material: {
    primary: "Da sập",      // Main material
    secondary: ["Nỉ"],      // Secondary materials
    filling: "Xốp"          // For seating
  },
  colors: [
    {
      colorName: "Nâu đậm",
      colorCode: "#8B4513",
      colorImage: "filename.jpg",
      available: true,
      stock: 5
    }
  ],
  style: ["Hiện đại", "Luxury"],
  features: ["Có ngăn kéo", "Xoay", "Kéo rộng"],
  weight: 80,
  maxWeight: 300,           // For seating
  warranty: {
    duration: 24,           // months
    type: "Toàn bộ",        // Full/Frame/Surface
    description: "Bảo hành 2 năm toàn bộ sản phẩm"
  },
  care: ["Lau bằng khăn mềm", "Tránh tiếp xúc nước"],
  assembly: {
    required: true,
    time: "1-2 giờ"
  },
  origin: "Việt Nam"
}
```

### Furniture Templates

```javascript
// Admin-Client
const template = adminProductAPI.createFurnitureTemplate("sofa");
// Types: general, sofa, bed, table
```

---

## 🔍 Troubleshooting

### Issue: Upload ảnh không hoạt động

```
❌ Error: "ENOENT: no such file or directory"
✅ Fix: Kiểm tra thư mục public/uploads/products/ tồn tại
        const uploadDir = path.join(__dirname, '../public/uploads/products');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
```

### Issue: Hình ảnh không hiển thị

```
❌ Error: 404 Not Found
✅ Fix: Kiểm tra .env có VITE_API_BASE_URL đúng
        Kiểm tra URL: http://localhost:8000/api/uploads/products/filename
```

### Issue: Filter không hoạt động

```
❌ Error: Không lọc được
✅ Fix: Đảm bảo query params format đúng
        Đúng: ?minPrice=1000000&maxPrice=5000000
        Sai:  ?price=1000000-5000000
```

### Issue: File type validation

```
❌ Error: "Invalid file type"
✅ Fix: Chỉ upload JPEG, PNG, WEBP, GIF
        Max 5MB per file
        Max 10 files per request
```

---

## 📊 Performance Tips

### Database Indexes

```javascript
// Đã có sẵn:
✅ Text search index: pName, pDescription
✅ Filter indexes: pCategory, pStatus, pPrice
✅ Featured indexes: isFeatured, isRecommended
✅ Performance index: createdAt, view_count
```

### Query Optimization

```javascript
// Select specific fields (not all)
.select('_id pSKU pName pPrice thumbnail');

// Limit results
?limit=12 (default, max 100)

// Pagination
?page=1&limit=12
```

### Image Optimization

```
- Thumbnails: Auto generate từ main
- Sizes: Small (200px), Medium (500px), Large (1000px)
- Format: WebP for modern browsers, JPEG fallback
- Cache: Browser cache + CDN cache
```

---

## 🧪 Testing Checklist

### Backend

- [ ] POST /upload-images - Upload 5 ảnh
- [ ] POST /add-product - Tạo sản phẩm mới
- [ ] POST /edit-product - Cập nhật sản phẩm
- [ ] GET /all-product - Lấy tất cả
- [ ] GET /all-product?q=sofa - Tìm kiếm
- [ ] GET /all-product?minPrice=1M&maxPrice=5M - Lọc giá
- [ ] GET /all-product?materials=gỗ - Lọc chất liệu
- [ ] POST /single-product - Chi tiết
- [ ] DELETE /delete-product/:id - Xóa

### Frontend

- [ ] Load sản phẩm list
- [ ] Filter by category
- [ ] Filter by price
- [ ] Filter by material, color, style
- [ ] Search products
- [ ] View product detail
- [ ] View images (main + detail)
- [ ] Add review
- [ ] View featured products
- [ ] View recommended products

### Admin

- [ ] Upload images
- [ ] Create product
- [ ] Edit product
- [ ] Delete product
- [ ] View product list
- [ ] Filter products
- [ ] See product stats
- [ ] See top-selling products

---

## 📞 Support

### Issue Reporting Template

```
## Problem
Mô tả vấn đề...

## Expected
Kết quả mong đợi...

## Actual
Kết quả thực tế...

## Steps
1. ...
2. ...
3. ...

## Screenshots/Logs
[Gắn ảnh hoặc error logs]

## Environment
- Backend: Node.js {version}
- Client: React {version}
- Admin: React {version}
- DB: MongoDB {version}
```

---

## 📚 Related Docs

1. **FURNITURE_PRODUCT_REDESIGN.md** - Chi tiết đầy đủ
2. **IMPLEMENTATION_GUIDE.md** - Hướng dẫn triển khai
3. **PRODUCT_REDESIGN_SUMMARY.md** - Tổng kết
4. **QUICK_REFERENCE.md** - File này (quick lookup)

---

## ✨ Next Steps

1. ✅ Integrate routes vào app.js
2. ✅ Test all endpoints
3. ⏳ Build React components
4. ⏳ Migrate old data
5. ⏳ Deploy to production

**Ready to implement!** 🚀
