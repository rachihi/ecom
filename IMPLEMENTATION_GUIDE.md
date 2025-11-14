# Hướng Dẫn Triển Khai Hệ Thống Sản Phẩm Nội Thất

## 📋 Tổng Quan

Đã thiết kế lại hoàn toàn hệ thống sản phẩm cho buôn bán nội thất với:

- ✅ Model sản phẩm chi tiết (`products_new.js`)
- ✅ Controller cải thiện (`products_new.js`)
- ✅ Routes mới (`products_new.js`)
- ✅ API services cho client & admin (`productAPI.js`, `adminProductAPI.js`)

---

## 🔑 Thay Đổi Chính

### 1. **Model Sản Phẩm Mới**

#### Thêm các trường mới:

```javascript
// Thông tin nội thất chi tiết
furniture: {
  dimensions: { length, width, height, depth },      // Kích thước (cm)
  material: { primary, secondary[], filling },       // Chất liệu
  colors: [{ colorName, colorCode, colorImage, ... }], // Màu sắc & biến thể
  style: ["Hiện đại", "Tối giản", ...],            // Phong cách
  features: ["Có ngăn kéo", "Xoay", ...],          // Tính năng
  weight: Number,                                    // Trọng lượng
  warranty: { duration, type, description },        // Bảo hành
  care: ["Hướng dẫn 1", "Hướng dẫn 2", ...],      // Chăm sóc
  assembly: { required, time }                      // Lắp ráp
}

// Hình ảnh cấu trúc tốt hơn
images: [{
  filename: String,
  filepath: String,
  type: "main|detail|color|usage|dimensions|360",
  alt: String,
  uploadedAt: Date,
  size: Number
}]

// SEO & Tags
seo: { title, description, keywords[] }
tags: ["Bán chạy", "Hàng mới", "Sale"]

// Thêm các trường quan trọng
pSKU: String,                    // SKU duy nhất
pSlug: String,                   // URL-friendly
pShortDescription: String,       // Mô tả ngắn
pComparePrice: Number,           // Giá gốc trước giảm
discount: Number,                // % giảm giá
isFeatured, isRecommended, isNew, isOnSale, isBestseller
```

#### Virtual Fields & Methods:

```javascript
// Tự động tính giá sau giảm
schema.virtual("discountedPrice").get(function() {
  return this.pPrice - this.pPrice * (this.discount / 100);
})

// Tính rating trung bình
methods.getAverageRating() { ... }

// Lấy ảnh chính
methods.getMainImage() { ... }
```

---

### 2. **Cấu Trúc Thư Mục Hình Ảnh**

```
public/uploads/products/
├── categories/
│   ├── ghe/
│   │   ├── sofa-001/
│   │   │   ├── main.jpg
│   │   │   ├── detail-1.jpg
│   │   │   ├── color-brown.jpg
│   │   │   └── metadata.json
│   ├── ban/
│   └── giuong/
├── temp/               # Upload tạm
└── thumbnails/        # Cache
```

**Qui tắc đặt tên file:**

```
{TIMESTAMP}_{SKU}_{TYPE}_{INDEX}.{EXT}

Ví dụ:
- 1699608000_FURN-CHR-20231115-001_main.jpg
- 1699608001_FURN-CHR-20231115-001_detail-1.jpg
- 1699608002_FURN-CHR-20231115-001_color-brown.jpg
```

**Metadata JSON:**

```json
{
  "productId": "507f1f77bcf86cd799439011",
  "filename": "1699608000_FURN-CHR-20231115-001_main.jpg",
  "type": "main",
  "originalName": "sofa-brown-main.jpg",
  "uploadedAt": "2023-11-15T10:00:00Z",
  "alt": "Sofa da màu nâu 3 chỗ"
}
```

---

### 3. **Bộ Lọc Nâng Cao**

#### Query Parameters:

```
GET /api/product/all-product?
  page=1
  &limit=12
  &q=sofa              # Tìm kiếm
  &category=cat_001    # Danh mục
  &minPrice=1000000
  &maxPrice=50000000
  &materials=gỗ,da    # Chất liệu (comma-separated)
  &colors=%238B4513,%23808080  # Hex codes
  &styles=hiện đại,tối giản    # Phong cách
  &isFeatured=true
  &isRecommended=true
  &isNew=true
  &sort=price-asc|price-desc|rating|newest|popular
```

#### Response Format:

```javascript
{
  success: true,
  data: {
    products: [
      {
        _id: ObjectId,
        pSKU: String,
        pName: String,
        pPrice: Number,
        discount: Number,
        thumbnail: String,
        rating: { average: 4.5, count: 120 },
        furniture: { dimensions, materials, colors, styles }
      }
    ],
    total: 245,
    page: 1,
    limit: 12,
    totalPages: 21,
    hasMore: true
  }
}
```

---

## 🚀 Các Bước Triển Khai

### **BƯỚC 1: Cập Nhật Backend**

#### 1.1 Thay thế model

```bash
# Cấp lên models/products.js mới hoặc giữ products_new.js
# Không xóa cũ, để migration
cp server/models/products_new.js server/models/products_furniture.js
```

#### 1.2 Cập nhật routes trong app.js

```javascript
// app.js
const productRoutes = require("./routes/products_new"); // NEW
app.use("/api/product", productRoutes);
```

#### 1.3 Test upload endpoint

```bash
curl -X POST http://localhost:8000/api/product/upload-images \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "imageTypes=main" \
  -F "imageTypes=detail" \
  -H "Authorization: Bearer {token}"
```

---

### **BƯỚC 2: Cập Nhật Frontend (Client)**

#### 2.1 Cập nhật API service

```javascript
// client/src/services/api.js
// Import productAPI từ productAPI.js
import { productAPI } from "./productAPI";

export { productAPI };
```

#### 2.2 Cập nhật hooks để dùng API mới

```javascript
// client/src/hooks/useProduct.js
// Đã cập nhật - sử dụng productAPI.getProductById()

// client/src/hooks/useFeaturedProducts.js
// Đã cập nhật - sử dụng productAPI.getFeaturedProducts()

// client/src/hooks/useRecommendedProducts.js
// Đã cập nhật - sử dụng productAPI.getRecommendedProducts()
```

#### 2.3 Tạo hook mới cho Filter

```javascript
// client/src/hooks/useProductFilters.js
const useProductFilters = (initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productAPI.getProducts(filters);
        setProducts(response.data.data.products);
        setTotal(response.data.data.total);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return { products, filters, setFilters, loading, total };
};

export default useProductFilters;
```

---

### **BƯỚC 3: Cập Nhật Admin (Admin-Client)**

#### 3.1 Cập nhật API service

```typescript
// admin-client/src/services/api.js
// Đã cấu hình apiFormData cho file upload
// Export adminProductAPI
```

#### 3.2 Tạo Product Edit Page

```typescript
// admin-client/src/pages/admin/products/EditProduct.tsx
import { adminProductAPI } from "@/services/api";
import ProductImageUpload from "@/components/ProductImageUpload";
import FurnitureInfoForm from "@/components/FurnitureInfoForm";

const EditProduct: React.FC = () => {
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [furniture, setFurniture] = useState({});

  const handleSave = async () => {
    const formData = adminProductAPI.prepareProductData(
      { ...product, furniture },
      images,
      images.map((img) => img.type)
    );

    const response = await adminProductAPI.editProduct(product._id, formData);
    // Handle success
  };

  return (
    <Box>
      <ProductImageUpload
        onImagesUploaded={setImages}
        productId={product._id}
      />
      <FurnitureInfoForm
        onChange={setFurniture}
        initialData={product?.furniture}
      />
      <Button onClick={handleSave}>Lưu</Button>
    </Box>
  );
};
```

#### 3.3 Tạo Product Filter Component

```typescript
// admin-client/src/components/ProductFilter.tsx
const ProductFilter: React.FC = () => {
  const [filters, setFilters] = useState({
    category: null,
    priceRange: [500000, 50000000],
    materials: [],
    styles: [],
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    // Trigger search
  };

  return (
    <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
      <PriceRangeSlider {...} />
      <MaterialCheckbox {...} />
      <ColorPicker {...} />
      <StyleCheckbox {...} />
    </Box>
  );
};
```

---

## 📊 So Sánh: Cũ vs Mới

| Tính Năng              | Cũ                      | Mới                                                |
| ---------------------- | ----------------------- | -------------------------------------------------- |
| **Thông tin sản phẩm** | Basic (tên, giá, mô tả) | Chi tiết nội thất (kích thước, chất liệu, màu sắc) |
| **Hình ảnh**           | Array string (filename) | Array objects (type, alt, metadata)                |
| **Màu sắc**            | Không có                | Biến thể theo màu với stock riêng                  |
| **Bộ lọc**             | Danh mục, giá           | Danh mục + 7 bộ lọc khác                           |
| **Khuyến mãi**         | String mô tả            | % discount + expiry date                           |
| **Rating**             | Array có sẵn            | Tính average, tỉ lệ helpful                        |
| **Upload ảnh**         | Multer basic            | Multer + metadata + validation                     |
| **SEO**                | Không có                | Title, description, keywords                       |
| **SKU**                | Không có                | SKU duy nhất + slug                                |
| **API**                | Basic CRUD              | 20+ endpoints với advanced filters                 |

---

## 🔄 Migration từ Cấu Trúc Cũ

### Script Migration:

```javascript
// server/scripts/migrateProducts.js
async function migrate() {
  const oldProducts = await OldProductModel.find({});

  for (let oldProduct of oldProducts) {
    const newProduct = {
      pName: oldProduct.pName,
      pDescription: oldProduct.pDescription,
      pSKU: `FURN-${oldProduct._id.toString().slice(-8).toUpperCase()}`,
      pPrice: oldProduct.pPrice,
      pQuantity: oldProduct.pQuantity,
      pCategory: oldProduct.pCategory,

      // Convert old images
      images: oldProduct.pImages.map((img, idx) => ({
        filename: img,
        filepath: `/uploads/products/${img}`,
        type: idx === 0 ? "main" : "detail",
        alt: oldProduct.pName,
        uploadedAt: new Date(),
      })),

      // Default furniture info
      furniture: {
        dimensions: { length: 0, width: 0, height: 0 },
        material: { primary: "", secondary: [] },
        colors: [],
        style: [],
        features: [],
        warranty: { duration: 12, type: "Toàn bộ" },
      },

      pStatus: oldProduct.pStatus || "active",
      pRatingsReviews: oldProduct.pRatingsReviews || [],
    };

    await NewProductModel.create(newProduct);
  }
}

// Run: node server/scripts/migrateProducts.js
```

---

## 🛠️ Troubleshooting

### Vấn Đề 1: Upload hình ảnh thất bại

**Nguyên nhân:** Multer configuration không đúng
**Giải pháp:**

```javascript
// Kiểm tra thư mục uploads tồn tại
const uploadDir = path.join(__dirname, "../public/uploads/products");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

### Vấn Đề 2: Filter không hoạt động

**Nguyên nhân:** Query parameters không khớp
**Giải pháp:**

```javascript
// Kiểm tra format
GET /api/product/all-product?minPrice=1000000&maxPrice=5000000
// KHÔNG: /all-product?price=1000000-5000000

// Đảm bảo backend xử lý đúng
if (req.query.minPrice) {
  filter.pPrice.$gte = parseFloat(req.query.minPrice);
}
```

### Vấn Đề 3: Hình ảnh không hiển thị

**Nguyên nhân:** Đường dẫn API_BASE_URL sai
**Giải pháp:**

```javascript
// client/.env
VITE_API_BASE_URL=http://localhost:8000/api

// admin-client/.env
REACT_APP_API_BASE_URL=http://localhost:8000/api

// Kiểm tra image URL
console.log(productAPI.getImageUrl(product.thumbnailImage));
// Output: http://localhost:8000/api/uploads/products/1699608000_...jpg
```

---

## 📚 Tài Liệu Liên Quan

Tất cả file đã được tạo:

1. ✅ `FURNITURE_PRODUCT_REDESIGN.md` - Tổng quan thiết kế
2. ✅ `server/models/products_new.js` - Model MongoDB
3. ✅ `server/controller/products_new.js` - Controller
4. ✅ `server/routes/products_new.js` - Routes
5. ✅ `client/src/services/productAPI.js` - Client API
6. ✅ `admin-client/src/services/adminProductAPI.js` - Admin API
7. 📄 `IMPLEMENTATION_GUIDE.md` - Hướng dẫn này

---

## ✅ Checklist Triển Khai

- [ ] **Backend**

  - [ ] Cập nhật routes trong app.js
  - [ ] Kiểm tra thư mục uploads tồn tại
  - [ ] Test upload endpoint
  - [ ] Test filter endpoints
  - [ ] Migrate dữ liệu cũ (nếu cần)

- [ ] **Client**

  - [ ] Cập nhật productAPI import
  - [ ] Cập nhật hooks (useProduct, useFeaturedProducts, etc)
  - [ ] Tạo/cập nhật filter components
  - [ ] Tạo/cập nhật product display components
  - [ ] Test tất cả pages

- [ ] **Admin-Client**

  - [ ] Cập nhật api.js
  - [ ] Tạo Product Edit page
  - [ ] Tạo Product Create page
  - [ ] Tạo Product List page với filters
  - [ ] Tạo Image Upload component
  - [ ] Tạo Furniture Info form
  - [ ] Test CRUD operations

- [ ] **Testing**
  - [ ] Upload 5+ hình ảnh cùng lúc
  - [ ] Test tất cả filters
  - [ ] Test search
  - [ ] Test pagination
  - [ ] Test product detail page
  - [ ] Test product creation
  - [ ] Test product edit
  - [ ] Test product delete

---

## 📞 Hỗ Trợ

Nếu cần help về:

1. **Backend:** Upload ảnh, filters, validation
2. **Frontend:** Components, hooks, styling
3. **Database:** Migration, indexing, optimization
4. **DevOps:** Deployment, image optimization

Hãy cho tôi biết module nào cần tiếp tục phát triển!
