# Admin Products Page - useSWR + API mới

## Tổng quan

Admin products page đã được cập nhật để sử dụng **API endpoints mới** (API furniture) với **useSWR** để quản lý dữ liệu. Page hỗ trợ đầy đủ các thông tin sản phẩm nội thất.

## 📊 Thay đổi chính

### 1. Cấu trúc dữ liệu sản phẩm (ProductRow)

**Trước (API cũ):**

```typescript
interface ProductRow {
  _id: string;
  pName: string;
  pPrice?: number;
  pQuantity?: number;
  pCategory?: any;
  pStatus?: string;
  pOffer?: number;
  pImages?: string[];
}
```

**Sau (API mới - Furniture):**

```typescript
interface ProductRow {
  _id: string;
  pName: string;
  pPrice?: number;
  pQuantity?: number;
  pCategory?: any;
  pStatus?: string;
  pDiscount?: number; // Thay đổi: pOffer → pDiscount
  pImages?: any[]; // Cấu trúc hình ảnh phong phú hơn
  furniture?: {
    // Mới: Thông tin nội thất chi tiết
    dimensions?: {
      length?: number;
      width?: number;
      height?: number;
      depth?: number;
    };
    materials?: { primary?: string; secondary?: string };
    colors?: string[];
    style?: string[];
    features?: string[];
  };
}
```

### 2. Bộ lọc nâng cao

Page hiện tại hỗ trợ 4 bộ lọc:

```typescript
// 1. Tìm kiếm theo tên/mô tả
const [q, setQ] = useState("");
// Sử dụng: ?search=keyword

// 2. Lọc theo danh mục
const [filterCategory, setFilterCategory] = useState("");
// Sử dụng: ?category=categoryId

// 3. Lọc theo trạng thái
const [filterStatus, setFilterStatus] = useState("");
// Sử dụng: ?status=Active|Inactive

// 4. Sắp xếp
const [sortBy, setSortBy] = useState("newest");
// Tùy chọn: newest, oldest, price-low, price-high, popular
```

### 3. Query URL xây dựng động

```typescript
const queryParams = new URLSearchParams();
queryParams.append("page", fetchPage.toString());
queryParams.append("limit", limit.toString());
if (debouncedQ) queryParams.append("search", debouncedQ);
if (filterCategory) queryParams.append("category", filterCategory);
if (filterStatus) queryParams.append("status", filterStatus);
queryParams.append("sort", sortBy);

const { data, mutate, isLoading } = useSWR(
  `/api/product/all-product?${queryParams.toString()}`
);
```

### 4. Cấu trúc response từ API

API endpoint `/api/product/all-product` trả về:

```json
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "pName": "Ghế gỗ hiện đại",
      "pPrice": 5000000,
      "pQuantity": 50,
      "pStatus": "Active",
      "pDiscount": 10,
      "pCategory": { "_id": "...", "cName": "Ghế" },
      "pImages": [
        {
          "filename": "1699000000_FURN-CHR_main_1.jpg",
          "filepath": "/uploads/products/...",
          "type": "main",
          "alt": "Ghế chính",
          "uploadedAt": "2024-01-01",
          "size": 256000
        }
      ],
      "furniture": {
        "dimensions": {
          "length": 60,
          "width": 70,
          "height": 90,
          "depth": 60
        },
        "materials": {
          "primary": "Gỗ tự nhiên",
          "secondary": "Nệm xốp"
        },
        "colors": ["Đen", "Trắng", "Xám"],
        "style": ["Hiện đại", "Tối giản"],
        "features": ["Có thể quay", "Tựa lưng lệch"]
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

## 🎯 Các tính năng

### 1. Xem danh sách sản phẩm

- **Phân trang**: 5, 10, 20, 50 items/trang
- **Tìm kiếm**: Gõ tên sản phẩm (debounce 500ms)
- **Lọc danh mục**: Chọn từ dropdown
- **Lọc trạng thái**: Đang bán / Ngưng bán
- **Sắp xếp**: 5 tùy chọn (Mới nhất, Cũ nhất, Giá thấp, Giá cao, Phổ biến)

### 2. Thêm sản phẩm mới

Dialog form hỗ trợ:

**Thông tin cơ bản:**

- Tên sản phẩm
- SKU (mã sản phẩm)
- Danh mục
- Mô tả chi tiết
- Giá bán (VND)
- Số lượng tồn
- Giảm giá (%)

**Thông tin nội thất:**

- **Kích thước**: Dài, Rộng, Cao, Sâu (cm)
- **Chất liệu**: Chất liệu chính, Chất liệu phụ
- **Màu sắc**: Danh sách các màu khả dụng
- **Phong cách**: Danh sách phong cách (Hiện đại, Cổ điển, v.v.)
- **Tính năng**: Danh sách tính năng đặc biệt

**Khác:**

- **Trạng thái**: Đang bán / Ngưng bán
- **Hình ảnh**: Upload nhiều hình cùng lúc

### 3. Sửa sản phẩm

- Mở lại dialog với dữ liệu sản phẩm
- Chỉnh sửa mọi trường
- Có thể thêm hình ảnh mới
- Xem số hình ảnh hiện tại

### 4. Xoá sản phẩm

- Xác nhận trước khi xoá
- Thông báo sau khi xoá thành công/thất bại

## 📝 Ví dụ sử dụng

### Thêm sản phẩm mới

```typescript
// FormData sẽ được gửi đến /api/product/add-product
{
  pName: "Sofa da cao cấp",
  pDescription: "Sofa da Italy nhập khẩu...",
  pPrice: "25000000",
  pQuantity: "5",
  pCategory: "507f1f77bcf86cd799439011",
  pDiscount: "5",
  pStatus: "Active",
  pSKU: "FURN-SFA-001",
  furniture: JSON.stringify({
    dimensions: { length: 200, width: 100, height: 85, depth: 95 },
    materials: { primary: "Da thật", secondary: "Khung gỗ sồi" },
    colors: ["Đen", "Nâu"],
    style: ["Hiện đại", "Sang trọng"],
    features: ["Có chỗ nằm", "Kéo dài"]
  }),
  files: [File, File, File]  // Multiple files
}
```

### API response format

```json
{
  "success": true,
  "message": "Sản phẩm đã được tạo",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "pName": "Sofa da cao cấp",
    ...
  }
}
```

## 🔄 Luồng thực thi

### Thêm/Sửa sản phẩm

```
User nhập liệu
    ↓
Nhấn "Lưu"
    ↓
handleSave() tạo FormData
    ↓
POST /api/product/add-product hoặc /api/product/edit-product
    ↓
setIsLoading2(true) - Hiển thị "Đang lưu..."
    ↓
API xử lý, upload hình ảnh, lưu vào DB
    ↓
Response success/error
    ↓
Hiển thị Snackbar thông báo
    ↓
mutate() - Refresh danh sách useSWR
    ↓
Dialog đóng lại

```

### Xoá sản phẩm

```
User nhấn "Xoá"
    ↓
Hiển thị confirm dialog
    ↓
User xác nhận
    ↓
performDelete() → POST /api/product/delete-product
    ↓
API xử lý xoá
    ↓
Hiển thị notification
    ↓
mutate() - Refresh danh sách
```

## 🎨 UI Components sử dụng

```typescript
// Material-UI components
- TextField: Input fields
- Select/MenuItem: Dropdowns
- Dialog/DialogContent/DialogActions: Forms & confirmations
- Table/TableHead/TableBody/TableRow/TableCell: Data table
- TablePagination: Phân trang
- Button: Nút hành động
- Stack: Layout
- Chip: Tags cho hình ảnh, phong cách, tính năng
- Snackbar/Alert: Thông báo
- Typography: Text
- Grid: Layout columns
- Box: Container
```

## ⚙️ Cấu hình quan trọng

### 1. Tên field thay đổi

| Cũ                    | Mới                | Ghi chú                           |
| --------------------- | ------------------ | --------------------------------- |
| `pOffer`              | `pDiscount`        | Tên field thay đổi trong API      |
| `q` (query param)     | `search`           | Tên query parameter thay đổi      |
| `Products` (response) | `products`         | Tên field trong response thay đổi |
| `total` (response)    | `pagination.total` | Cấu trúc response thay đổi        |

### 2. State quản lý

```typescript
// Tìm kiếm & bộ lọc
const [q, setQ] = useState(""); // Keyword tìm kiếm
const [filterCategory, setFilterCategory] = useState(""); // Category ID
const [filterStatus, setFilterStatus] = useState(""); // Active/Inactive
const [sortBy, setSortBy] = useState("newest"); // Sort option

// Phân trang
const [page, setPage] = useState(0); // 0-indexed
const [limit, setLimit] = useState(10); // Items per page

// Dialog & Form
const [open, setOpen] = useState(false); // Dialog state
const [confirmId, setConfirmId] = useState(null); // Delete confirm
const [form, setForm] = useState({}); // Form data
const [imgFiles, setImgFiles] = useState([]); // Selected images
const [isLoading2, setIsLoading2] = useState(false); // Save loading

// Thông báo
const [snack, setSnack] = useState({
  open: false,
  message: "",
  severity: "success" | "error",
});
```

### 3. Form data structure

```typescript
// Khi tạo/sửa sản phẩm, FormData bao gồm:
{
  // Basic fields
  pName: string
  pDescription: string
  pPrice: string (number as string)
  pQuantity: string (number as string)
  pCategory: string (category ID)
  pDiscount: string (number as string)
  pStatus: 'Active' | 'Inactive'
  pSKU: string

  // Furniture info (JSON string)
  furniture: JSON.stringify({
    dimensions: { length, width, height, depth }
    materials: { primary, secondary }
    colors: string[]
    style: string[]
    features: string[]
  })

  // Images (multiple files)
  files: File[] (FormData sẽ append từng file)

  // Nếu sửa
  pId: string (product ID)
}
```

## 🚀 API Endpoints sử dụng

### Lấy danh sách sản phẩm

```
GET /api/product/all-product?page=1&limit=10&search=keyword&category=id&status=Active&sort=newest
```

**Response:**

```json
{
  "products": [...],
  "pagination": { "total": number, "page": number, "limit": number, "pages": number }
}
```

### Thêm sản phẩm mới

```
POST /api/product/add-product
Content-Type: multipart/form-data

FormData: { pName, pDescription, pPrice, ... files }
```

### Sửa sản phẩm

```
POST /api/product/edit-product
Content-Type: multipart/form-data

FormData: { pId, pName, pDescription, ... files }
```

### Xoá sản phẩm

```
POST /api/product/delete-product
Content-Type: application/json

{ "pId": "507f1f77bcf86cd799439011" }
```

## 🔗 File liên quan

- **Backend**: `/server/controller/products_new.js` - Logic xử lý
- **Backend**: `/server/routes/products_new.js` - Route definitions
- **Backend**: `/server/models/products_new.js` - Database schema
- **Frontend**: `/admin-client/src/pages/admin/products/index.tsx` - Trang này

## 💡 Ghi chú

1. **useSWR** tự động refetch khi dependency thay đổi
2. **Debounce** tìm kiếm giảm số request (500ms)
3. **FormData** hỗ trợ upload multiple files
4. **Snackbar** tự động đóng sau 3 giây
5. **Chip** dùng để hiển thị tags (màu, phong cách, tính năng)
6. **Loading state** (`isLoading2`) ngăn multiple submit

## ❌ Lỗi phổ biến

### 1. API không trả về `products` field

**Vấn đề**: Server trả về `Products` (hoa) nhưng code đợi `products` (thường)

**Giải pháp**: Kiểm tra response structure, cập nhật field name trong useMemo

### 2. Form không cập nhật furniture data

**Vấn đề**: Cấu trúc lồng sâu khó update

**Giải pháp**: Dùng spread operator đúng cách:

```typescript
setForm((f) => ({
  ...f,
  furniture: {
    ...f.furniture,
    materials: { ...f.furniture?.materials, primary: value },
  },
}));
```

### 3. Hình ảnh không upload

**Vấn đề**: Quên append files vào FormData

**Giải pháp**:

```typescript
imgFiles.forEach((file) => {
  fd.append("files", file);
});
```

### 4. Phân trang không reset khi filter

**Giải pháp**:

```typescript
setFilterCategory(value);
setPage(0); // Reset về trang 1
```

## 📚 Tham khảo thêm

- useSWR documentation: https://swr.vercel.app/
- Material-UI: https://mui.com/
- FormData API: https://developer.mozilla.org/en-US/docs/Web/API/FormData
