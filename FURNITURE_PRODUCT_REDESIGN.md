# Thiết Kế Lại Hệ Thống Sản Phẩm cho Buôn Bán Nội Thất

## 📋 Phân Tích Hiện Tại

### Cấu Trúc Sản Phẩm Hiện Tại (Server)

```javascript
{
  pName: String,
  pDescription: String,
  pPrice: Number,
  pSold: Number,
  pQuantity: Number,
  pCategory: ObjectId (Ref: categories),
  pImages: Array,
  pOffer: String,
  pRatingsReviews: Array,
  pStatus: String
}
```

**Vấn Đề Hiện Tại:**

- ❌ Thiếu thông tin chi tiết cho nội thất (kích thước, chất liệu, màu sắc, phong cách)
- ❌ `pImages` chỉ là Array string (filename), không có metadata
- ❌ Thiếu thông tin về kiểu lọc phù hợp cho nội thất
- ❌ Không có SKU (Stock Keeping Unit) cho các biến thể sản phẩm
- ❌ Hình ảnh lưu tại `public/uploads/products/` - OK nhưng cần cải thiện cấu trúc
- ⚠️ `pOffer` là String - không có thông tin chi tiết về khuyến mãi

---

## 🎯 Thiết Kế Mới Cho Nội Thất

### 1. **Mô Hình Sản Phẩm Được Cải Thiện**

#### a. Model Sản Phẩm (Backend - MongoDB)

```javascript
const furnitureProductSchema = new mongoose.Schema(
  {
    // Thông tin cơ bản
    pName: {
      type: String,
      required: true,
      maxlength: 255,
      index: true,
    },
    pSKU: {
      type: String,
      unique: true,
      required: true,
      // Format: FURN-CATEGORY-DATE-SERIAL (e.g., FURN-CHR-20231115-001)
    },
    pDescription: {
      type: String,
      required: true,
      maxlength: 3000,
    },
    pShortDescription: {
      type: String,
      maxlength: 500,
      // Mô tả ngắn gọn cho danh sách sản phẩm
    },

    // Giá
    pPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    pComparePrice: {
      type: Number,
      // Giá gốc trước khi giảm
    },
    pCost: {
      type: Number,
      // Giá vốn (chỉ admin thấy)
    },

    // Danh mục
    pCategory: {
      type: ObjectId,
      ref: "categories",
      required: true,
      index: true,
    },
    pSubCategory: {
      type: ObjectId,
      ref: "categories",
      // Danh mục con (nếu có)
    },

    // Thông tin nội thất
    furniture: {
      // Kích thước
      dimensions: {
        length: { type: Number, unit: "cm" }, // Chiều dài
        width: { type: Number, unit: "cm" }, // Chiều rộng
        height: { type: Number, unit: "cm" }, // Chiều cao
        depth: { type: Number, unit: "cm" }, // Độ sâu (nếu có)
      },

      // Chất liệu
      material: {
        primary: String, // Chất liệu chính (e.g., "Gỗ sồi", "Da", "Kệ")
        secondary: [String], // Chất liệu phụ
        filling: String, // Chất nhân (cho ghế: Bông, Latex, Xốp)
      },

      // Màu sắc & Hình ảnh cụ thể
      colors: [
        {
          colorName: String, // Tên màu (e.g., "Nâu Đậm", "Xám Sáng")
          colorCode: String, // Hex code (#2C2C2C)
          colorImage: String, // Ảnh của màu này (filename)
          available: Boolean,
          stock: Number,
        },
      ],

      // Phong cách
      style: [String], // ["Hiện đại", "Tối giản", "Vintage", "Cổ điển"]

      // Tính năng đặc biệt
      features: [String], // ["Có ngăn kéo", "Có ghế kéo", "Có chân thép"]

      // Tiêu chuẩn
      weight: Number, // kg
      maxWeight: Number, // Trọng lượng tối đa (cho ghế/giường)
      warranty: {
        duration: Number, // Tháng
        type: String, // "Toàn bộ | Khung | Bề mặt"
      },

      // Hướng dẫn chăm sóc
      care: [String], // ["Lau bằng khăn mềm", "Tránh tiếp xúc nước"]
    },

    // Hình ảnh
    images: [
      {
        filename: String, // Tên file (e.g., "1699608000_sofa-brown.jpg")
        filepath: String, // Đường dẫn đầy đủ (/products/category/filename)
        originalName: String, // Tên gốc
        type: String, // 'main' | 'detail' | 'color' | 'usage' | 'dimensions'
        alt: String, // Alt text cho SEO
        uploadedAt: Date,
        size: Number, // Bytes
      },
    ],
    thumbnailImage: String, // Ảnh thumbnail (filename của ảnh chính)

    // Tình trạng sản phẩm
    pQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    pReorder: {
      type: Number,
      default: 20,
      // Mức tồn kho để tự động cảnh báo
    },
    pSold: {
      type: Number,
      default: 0,
    },
    pStatus: {
      type: String,
      enum: ["active", "inactive", "discontinued", "draft"],
      default: "draft",
      index: true,
    },

    // Tính năng hiển thị
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isRecommended: {
      type: Boolean,
      default: false,
      index: true,
    },
    isNew: {
      type: Boolean,
      default: true,
      // Sản phẩm mới (trong 30 ngày)
    },

    // Khuyến mãi
    discount: {
      type: Number,
      min: 0,
      max: 100,
      // Phần trăm giảm giá (0-100)
    },
    pOffer: {
      type: String,
      // Miêu tả khuyến mãi (e.g., "Giảm 20% cho đơn từ 2 sản phẩm")
    },
    offerExpiry: Date, // Ngày hết hạn khuyến mãi

    // Đánh giá & Bình luận
    pRatingsReviews: [
      {
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        title: String, // Tiêu đề đánh giá
        review: String, // Nội dung đánh giá
        user: {
          type: ObjectId,
          ref: "customers",
        },
        verified: Boolean, // Người mua xác minh
        helpful: {
          yes: { type: Number, default: 0 },
          no: { type: Number, default: 0 },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // SEO
    seo: {
      title: String, // Meta title
      description: String, // Meta description
      keywords: [String], // Meta keywords
    },

    // Tags & Collections
    tags: [String], // ["Bán chạy", "Hàng mới", "Hàng bộ"]
    collections: [
      {
        type: ObjectId,
        ref: "collections",
      },
    ],

    // Người bán/Người tạo
    createdBy: {
      type: ObjectId,
      ref: "users",
    },
    updatedBy: {
      type: ObjectId,
      ref: "users",
    },
  },
  { timestamps: true }
);

// Indexes
furnitureProductSchema.index({ pName: "text", pDescription: "text" });
furnitureProductSchema.index({ pCategory: 1, pStatus: 1 });
furnitureProductSchema.index({ isFeatured: 1, isRecommended: 1 });
```

---

### 2. **Cấu Trúc Thư Mục Hình Ảnh (Server)**

```
public/
├── uploads/
│   ├── products/
│   │   ├── categories/
│   │   │   ├── 01-ghe/
│   │   │   │   ├── sofa-001/
│   │   │   │   │   ├── main.jpg
│   │   │   │   │   ├── main-thumbnail.jpg
│   │   │   │   │   ├── detail-1.jpg
│   │   │   │   │   ├── detail-2.jpg
│   │   │   │   │   ├── color-brown.jpg
│   │   │   │   │   ├── color-gray.jpg
│   │   │   │   │   ├── usage-livingroom.jpg
│   │   │   │   │   ├── dimensions.jpg
│   │   │   │   │   └── metadata.json
│   │   │   │   └── sofa-002/
│   │   │   ├── 02-ban/
│   │   │   └── 03-giuong/
│   │   ├── temp/           # Ảnh upload tạm
│   │   └── thumbnails/     # Cache thumbnails
│   └── categories/
│       ├── ghe.jpg
│       └── ban.jpg
```

---

### 3. **API Endpoints Cải Thiện**

#### Lấy Sản Phẩm Với Bộ Lọc

```
GET /api/product/all-product?page=1&limit=12&filters=...

Query Parameters:
- page: Number (default: 1)
- limit: Number (default: 12, max: 100)
- q: String (tìm kiếm theo tên)
- category: ObjectId (lọc theo danh mục)
- subCategory: ObjectId (lọc theo danh mục con)
- minPrice: Number
- maxPrice: Number
- materials: String[] (lọc theo chất liệu: "gỗ,da,kim loại")
- colors: String[] (lọc theo màu)
- styles: String[] (lọc theo phong cách)
- minRating: Number (1-5)
- isFeatured: Boolean
- isNew: Boolean
- sort: String (newest | popular | price-asc | price-desc | rating)

Response:
{
  success: true,
  data: {
    products: [
      {
        _id: ObjectId,
        pSKU: String,
        pName: String,
        pShortDescription: String,
        pPrice: Number,
        pComparePrice: Number,
        thumbnail: String (URL),
        rating: { average: 4.5, count: 120 },
        discount: 20,
        colors: [{ colorName: String, colorCode: String }],
        furniture: { dimensions: {...}, material: {...}, style: [...] }
      }
    ],
    total: Number,
    page: Number,
    limit: Number,
    totalPages: Number,
    hasMore: Boolean
  }
}
```

#### Upload Hình Ảnh Sản Phẩm

```
POST /api/product/upload-images

Form Data:
- productId: ObjectId (nếu edit) hoặc null (nếu create)
- images: File[] (multipart)
- imageTypes: String[] (main | detail | color | usage | dimensions)

Response:
{
  success: true,
  data: {
    images: [
      {
        filename: String,
        filepath: String,
        type: String,
        thumbnail: String,
        size: Number
      }
    ]
  }
}
```

---

### 4. **Danh Sách Bộ Lọc (Filter) Cho Nội Thất**

#### a. Danh Mục Chính

- 🪑 Ghế & Sofa (Armchair, Sofa 3 chỗ, Sofa 2 chỗ, Ghế massage)
- 🛏️ Giường (Giường đơn, Giường đôi, Giường tầng)
- 🚪 Tủ & Kệ (Tủ bếp, Tủ áo, Kệ sách, Tủ giày)
- 🪑 Bàn (Bàn ăn, Bàn làm việc, Bàn cà phê, Bàn console)
- 🛋️ Ghế ngồi khác (Ghế bar, Ghế gaming, Ghế đọc sách)

#### b. Bộ Lọc Chính

| Bộ Lọc         | Loại         | Giá Trị Ví Dụ                                 |
| -------------- | ------------ | --------------------------------------------- |
| **Giá**        | Range        | 500,000 - 50,000,000 VND                      |
| **Chất Liệu**  | Multi-Select | Gỗ sồi, Gỗ pine, Da thật, Da giả, Kệ, Thép    |
| **Màu Sắc**    | Color Picker | #8B4513 (Nâu), #808080 (Xám), #FFFFFF (Trắng) |
| **Phong Cách** | Multi-Select | Hiện đại, Tối giản, Vintage, Cổ điển, Retro   |
| **Kích Thước** | Tabs         | Nhỏ, Vừa, Lớn, Siêu lớn                       |
| **Tính Năng**  | Multi-Select | Có ngăn kéo, Xoay, Kéo rộng, Gập gọn          |
| **Đánh Giá**   | Star Rating  | 4★ & up, 3★ & up, etc.                        |
| **Bộ Sưu Tập** | Multi-Select | Bán chạy, Hàng mới, Sale, Hàng bộ             |

#### c. Chi Tiết Bộ Lọc

```javascript
// Cấu trúc filter config
const filterConfig = {
  categories: {
    label: "Danh mục",
    type: "checkbox",
    options: [
      { value: "cat_001", label: "Ghế & Sofa", count: 245 },
      { value: "cat_002", label: "Giường", count: 128 },
      // ...
    ],
  },

  price: {
    label: "Khoảng giá",
    type: "range",
    min: 500000,
    max: 50000000,
    step: 100000,
    format: "currency",
  },

  materials: {
    label: "Chất liệu",
    type: "checkbox",
    options: [
      { value: "wood-oak", label: "Gỗ sồi", count: 156 },
      { value: "leather", label: "Da thật", count: 89 },
      { value: "fabric", label: "Vải", count: 234 },
      // ...
    ],
  },

  colors: {
    label: "Màu sắc",
    type: "color",
    options: [
      { value: "brown", label: "Nâu", code: "#8B4513", count: 78 },
      { value: "gray", label: "Xám", code: "#808080", count: 145 },
      { value: "white", label: "Trắng", code: "#FFFFFF", count: 92 },
      // ...
    ],
  },

  styles: {
    label: "Phong cách",
    type: "checkbox",
    options: [
      { value: "modern", label: "Hiện đại", count: 267 },
      { value: "minimalist", label: "Tối giản", count: 156 },
      { value: "vintage", label: "Vintage", count: 89 },
      // ...
    ],
  },

  dimensions: {
    label: "Kích thước",
    type: "tabs",
    options: [
      { value: "small", label: "Nhỏ (< 1m)", count: 124 },
      { value: "medium", label: "Vừa (1-2m)", count: 298 },
      { value: "large", label: "Lớn (2-3m)", count: 156 },
      { value: "xlarge", label: "Siêu lớn (> 3m)", count: 67 },
    ],
  },

  features: {
    label: "Tính năng",
    type: "checkbox",
    options: [
      { value: "drawer", label: "Có ngăn kéo", count: 187 },
      { value: "swivel", label: "Xoay", count: 65 },
      { value: "reclining", label: "Kéo rộng", count: 92 },
      // ...
    ],
  },

  rating: {
    label: "Đánh giá",
    type: "stars",
    options: [
      { value: 5, label: "⭐⭐⭐⭐⭐ 5 sao", count: 234 },
      { value: 4, label: "⭐⭐⭐⭐ 4 sao & lên", count: 456 },
      { value: 3, label: "⭐⭐⭐ 3 sao & lên", count: 567 },
      // ...
    ],
  },
};
```

---

### 5. **Cập Nhật Model Danh Mục**

```javascript
const categorySchema = new mongoose.Schema(
  {
    cName: {
      type: String,
      required: true,
      unique: true,
    },
    cImage: String, // Ảnh danh mục

    // NEW FIELDS
    cSlug: String, // URL-friendly (e.g., "ghe-sofa")
    cDescription: String,
    cIcon: String, // Icon cho sidebar

    parentCategory: {
      type: ObjectId,
      ref: "categories",
      // Cho phép tạo sub-categories
    },

    displayOrder: Number, // Thứ tự hiển thị
    isActive: {
      type: Boolean,
      default: true,
    },

    // SEO
    seo: {
      title: String,
      description: String,
      keywords: [String],
    },

    // Bộ lọc mặc định cho category này
    defaultFilters: [String], // e.g., ["materials", "colors", "styles", "dimensions"]
  },
  { timestamps: true }
);
```

---

## 📁 Cấu Trúc File Hình Ảnh Chi Tiết

### Qui Tắc Đặt Tên File

```
{TIMESTAMP}_{SKU}_{TYPE}_{COLOR-CODE}.{ext}

Ví dụ:
- 1699608000_FURN-CHR-20231115-001_main.jpg
- 1699608001_FURN-CHR-20231115-001_color-brown.jpg
- 1699608002_FURN-CHR-20231115-001_detail-1.jpg
- 1699608003_FURN-CHR-20231115-001_usage-livingroom.jpg
- 1699608004_FURN-CHR-20231115-001_dimensions.jpg
```

### Metadata JSON (Lưu Cùng Ảnh)

```json
{
  "productId": "507f1f77bcf86cd799439011",
  "filename": "1699608000_FURN-CHR-20231115-001_main.jpg",
  "type": "main",
  "originalName": "sofa-brown-main.jpg",
  "uploadedAt": "2023-11-15T10:00:00Z",
  "size": 456789,
  "dimensions": {
    "width": 1200,
    "height": 900
  },
  "alt": "Sofa da màu nâu 3 chỗ ngồi phong cách hiện đại",
  "thumbnails": {
    "sm": "1699608000_FURN-CHR-20231115-001_main_sm.jpg",
    "md": "1699608000_FURN-CHR-20231115-001_main_md.jpg",
    "lg": "1699608000_FURN-CHR-20231115-001_main_lg.jpg"
  }
}
```

---

## 🔧 Cập Nhật Server (Node.js)

### 1. Cấu Hình Multer Cải Thiện

```javascript
// server/config/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public/uploads/products");

    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    // Định dạng: TIMESTAMP_ORIGINALNAME_TYPE
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${timestamp}_${name}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận file ảnh
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, WEBP allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

module.exports = upload;
```

### 2. Cập Nhật Controller

```javascript
// server/controller/products.js (Excerpt - upload images section)

static async uploadProductImages(req, res) {
  try {
    const { productId } = req.body;
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    // Lấy product info
    const product = productId ?
      await productModel.findById(productId) :
      { pSKU: `TEMP-${Date.now()}` };

    const uploadedImages = [];

    for (const file of files) {
      const metadata = {
        productId: product._id,
        filename: file.filename,
        type: req.body.imageTypes?.[files.indexOf(file)] || 'detail',
        originalName: file.originalname,
        uploadedAt: new Date(),
        size: file.size,
        dimensions: {
          width: 1200, // Sẽ update sau khi xử lý ảnh
          height: 900
        },
        alt: `${product.pName || 'Product'} image`
      };

      // Lưu metadata vào file JSON
      const metadataPath = path.join(
        __dirname,
        `../public/uploads/products/${file.filename}.json`
      );
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      uploadedImages.push({
        filename: file.filename,
        filepath: `/uploads/products/${file.filename}`,
        type: metadata.type,
        alt: metadata.alt,
        size: file.size
      });
    }

    return res.json({
      success: 'Images uploaded successfully',
      data: { images: uploadedImages }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 🎨 Cập Nhật Client & Admin-Client

### 1. React Component - Product Filter

```typescript
// admin-client/src/components/ProductFilter.tsx
interface ProductFilterProps {
  onFiltersChange: (filters: FilterParams) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    category: null,
    priceRange: [500000, 50000000],
    materials: [],
    colors: [],
    styles: [],
    dimensions: null,
    features: [],
    minRating: 0,
    sort: "newest",
  });

  const handleFilterChange = (filterType: string, value: any) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <Box sx={{ p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
      {/* Price Range Filter */}
      <FilterSection title="Khoảng giá">
        <PriceRangeSlider
          min={500000}
          max={50000000}
          value={filters.priceRange}
          onChange={(range) => handleFilterChange("priceRange", range)}
        />
      </FilterSection>

      {/* Material Filter */}
      <FilterSection title="Chất liệu">
        <CheckboxGroup
          options={materialOptions}
          selected={filters.materials}
          onChange={(materials) => handleFilterChange("materials", materials)}
        />
      </FilterSection>

      {/* Color Filter */}
      <FilterSection title="Màu sắc">
        <ColorPicker
          colors={colorOptions}
          selected={filters.colors}
          onChange={(colors) => handleFilterChange("colors", colors)}
        />
      </FilterSection>

      {/* Style Filter */}
      <FilterSection title="Phong cách">
        <CheckboxGroup
          options={styleOptions}
          selected={filters.styles}
          onChange={(styles) => handleFilterChange("styles", styles)}
        />
      </FilterSection>

      {/* Dimension Filter */}
      <FilterSection title="Kích thước">
        <TabGroup
          tabs={dimensionOptions}
          selected={filters.dimensions}
          onChange={(dim) => handleFilterChange("dimensions", dim)}
        />
      </FilterSection>
    </Box>
  );
};

export default ProductFilter;
```

### 2. React Component - Product Image Upload

```typescript
// admin-client/src/components/ProductImageUpload.tsx
interface ProductImageUploadProps {
  productId?: string;
  onImagesUploaded: (images: UploadedImage[]) => void;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  onImagesUploaded,
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string[]>([]);

  const handleImageSelect = async (files: File[]) => {
    setUploading(true);

    const formData = new FormData();
    formData.append("productId", productId || "");

    files.forEach((file, index) => {
      formData.append("images", file);
      formData.append("imageTypes", getImageType(index)); // main, detail, color, etc.
    });

    try {
      const response = await adminProductAPI.uploadImages(formData);
      onImagesUploaded(response.data.images);

      // Show preview
      const previews = files.map((file) => URL.createObjectURL(file));
      setPreview(previews);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ border: "2px dashed #ccc", p: 3, textAlign: "center" }}>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleImageSelect(Array.from(e.target.files || []))}
          disabled={uploading}
        />
      </Box>

      {/* Preview */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 2,
          mt: 2,
        }}
      >
        {preview.map((src, idx) => (
          <Box
            key={idx}
            component="img"
            src={src}
            sx={{
              width: "100%",
              height: 150,
              objectFit: "cover",
              borderRadius: 1,
            }}
          />
        ))}
      </Box>

      {uploading && <CircularProgress sx={{ mt: 2 }} />}
    </Box>
  );
};

export default ProductImageUpload;
```

---

## 📊 Database Migration Script

```javascript
// server/scripts/migrateProducts.js
const mongoose = require("mongoose");
const productModel = require("../models/products");

async function migrateToFurnitureSchema() {
  try {
    const products = await productModel.find({});

    for (let product of products) {
      const updated = {
        ...product.toObject(),
        pSKU: `FURN-${product._id
          .toString()
          .slice(-8)
          .toUpperCase()}-${Date.now()}`,
        furniture: {
          dimensions: {
            length: 0,
            width: 0,
            height: 0,
          },
          material: {
            primary: "Unknown",
            secondary: [],
            filling: "",
          },
          colors: [],
          style: [],
          features: [],
          weight: 0,
          maxWeight: 0,
          warranty: { duration: 12, type: "Toàn bộ" },
          care: [],
        },
        images: (product.pImages || []).map((img, idx) => ({
          filename: img,
          filepath: `/uploads/products/${img}`,
          type: idx === 0 ? "main" : "detail",
          alt: product.pName,
          uploadedAt: new Date(),
          size: 0,
        })),
        seo: {
          title: product.pName,
          description: product.pDescription?.substring(0, 160),
          keywords: [product.pName],
        },
        tags: [],
      };

      await productModel.updateOne({ _id: product._id }, updated, {
        new: true,
      });
    }

    console.log("✅ Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run: node server/scripts/migrateProducts.js
module.exports = migrateToFurnitureSchema;
```

---

## ✅ Checklist Triển Khai

- [ ] Cập nhật MongoDB Schema cho Products
- [ ] Cập nhật MongoDB Schema cho Categories (thêm sub-categories)
- [ ] Cập nhật Multer configuration
- [ ] Cập nhật Product Controller (add upload endpoint)
- [ ] Cập nhật Product Routes
- [ ] Cập nhật Client API Service (new endpoints)
- [ ] Cập nhật Admin-Client API Service
- [ ] Tạo React Components cho Filter
- [ ] Tạo React Components cho Image Upload
- [ ] Migrate dữ liệu cũ
- [ ] Test upload & display hình ảnh
- [ ] Test filters
- [ ] Cập nhật Product Display Pages
- [ ] Cập nhật Admin Product Management Pages

---

## 📞 Hỗ Trợ Triển Khai

Sẵn sàng giúp bạn:

1. ✅ Cập nhật MongoDB schemas chi tiết
2. ✅ Viết controller functions đầy đủ
3. ✅ Tạo React components cho filters & upload
4. ✅ Migrate dữ liệu cũ
5. ✅ Setup image optimization & thumbnails
6. ✅ Test toàn bộ hệ thống

Hãy cho tôi biết bạn muốn bắt đầu từ phần nào!
