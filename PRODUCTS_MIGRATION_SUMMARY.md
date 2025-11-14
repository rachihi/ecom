# ✅ Thay đổi từ products_new sang products

## 📋 Tóm tắt

Đã replace toàn bộ 3 file cũ bằng phiên bản mới (từ products_new):

- ✅ `server/models/products.js` - Schema MongoDB mới cho nội thất
- ✅ `server/controller/products.js` - Controller xử lý nội thất + upload ảnh
- ✅ `server/routes/products.js` - Routes với Multer configuration

## 🗑️ Đã xoá

- ❌ `server/models/products_new.js`
- ❌ `server/controller/products_new.js`
- ❌ `server/routes/products_new.js`

## 📦 Các file vẫn cần update

### 1. **server/app.js** (QUAN TRỌNG)

Cần thay đổi dòng route products:

**Trước:**

```javascript
app.use("/api/product", require("./routes/products_new"));
```

**Sau:**

```javascript
app.use("/api/product", require("./routes/products"));
```

### 2. **admin-client pages** (Đã update)

- ✅ `admin-client/src/pages/admin/products/index.tsx` - Đã update để sử dụng useSWR với API mới

### 3. **client pages** (Chưa update)

- ⏳ Cần update: `client/src/pages/` để sử dụng API mới
- ⏳ Cần update: `client/src/services/productAPI.js` (đã có sẵn, chỉ cần import)

## 🔄 Thay đổi API Response Format

**API endpoint**: `/api/product/all-product`

**Response cấu trúc mới:**

```json
{
  "success": true,
  "products": [...],
  "pagination": {
    "total": number,
    "page": number,
    "limit": number,
    "pages": number
  }
}
```

## 📝 Các thay đổi chính trong code

### Model (products.js)

1. **Thêm field:**

   - `pDiscount` (alias cho `discount`)
   - `pImages` (array of filenames for compatibility)
   - `furniture` object đầy đủ với dimensions, materials, colors, styles, features

2. **Enum values:**

   - `pStatus`: Hỗ trợ cả "active"/"Active" và "inactive"/"Inactive"

3. **Methods & Virtuals:**
   - `getMainImage()` - Lấy ảnh chính
   - `getPriceAfterDiscount()` - Tính giá sau giảm
   - `getAverageRating()` - Tính rating trung bình
   - Virtual fields: `discountedPrice`, `averageRating`, `reviewCount`

### Controller (products.js)

1. **getAllProduct:**

   - Thêm query parameter: `search` (thay cho `q`)
   - Thêm sort options: `price-low`, `price-high`
   - Response format mới với `pagination`

2. **postAddProduct / postEditProduct:**

   - Hỗ trợ `furniture` data (JSON parse)
   - Hỗ trợ multiple files upload
   - Tự động tạo `pImages` array

3. **Compatibility:**
   - Hỗ trợ cả `discount` và `pDiscount`

### Routes (products.js)

1. **Multer config:**

   - Max file: 5MB
   - Max files: 10
   - Hỗ trợ: JPEG, PNG, WEBP, GIF

2. **Error handling:**
   - Status code: 400 cho file size/type errors
   - Status code: 500 cho server errors

## 🚀 Tiếp theo cần làm

### Priority 1 - NGAY

1. **Update server/app.js:**

   ```javascript
   // Tìm dòng có products_new
   // Thay đổi thành products
   app.use("/api/product", require("./routes/products"));
   ```

2. **Test endpoints:**

   ```bash
   # Test GET all products
   curl http://localhost:PORT/api/product/all-product

   # Test POST single product
   curl -X POST http://localhost:PORT/api/product/single-product \
     -H "Content-Type: application/json" \
     -d '{"pId": "..."}'
   ```

### Priority 2 - Ngay sau

3. **Update client pages:**

   - Import `productAPI.js`
   - Update query params (search thay cho q)
   - Handle response format (pagination)

4. **Test admin page:**
   - Tạo sản phẩm mới
   - Upload ảnh
   - Sửa sản phẩm
   - Xoá sản phẩm

### Priority 3 - Tối ưu

5. **Image optimization:**

   - Setup thumbnail generation
   - Image compression
   - Caching strategy

6. **Data migration:**
   - Migrate old products to new schema (nếu có dữ liệu cũ)

## ⚠️ Breaking Changes

### Query Parameters

| Cũ                    | Mới                                               |
| --------------------- | ------------------------------------------------- |
| `?q=search`           | `?search=search` hoặc `?q=search` (hỗ trợ cả hai) |
| `Products` (response) | `products`                                        |
| `total` (response)    | `pagination.total`                                |

### Field Names

| Cũ           | Mới                      |
| ------------ | ------------------------ |
| `pOffer`     | `pDiscount` / `discount` |
| Single image | Multiple `images` array  |

## 📚 Tài liệu tham khảo

- **Admin Products Guide**: `/ADMIN_PRODUCTS_PAGE_GUIDE.md`
- **Product API Reference**: `/QUICK_REFERENCE.md`
- **Implementation Guide**: `/IMPLEMENTATION_GUIDE.md`

## ✔️ Checklist

- [x] Replace models/products.js
- [x] Replace controller/products.js
- [x] Replace routes/products.js
- [x] Xoá các file \_new
- [x] Update admin-client products page
- [ ] Update server/app.js route
- [ ] Test endpoints
- [ ] Update client pages
- [ ] Migrate old data (nếu cần)
