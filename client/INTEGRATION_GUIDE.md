# Client Integration Guide

## Tổng quan

Client (khách hàng) đã được tích hợp với API từ server Node.js thay vì Firebase.

---

## Cài đặt

### 1. Cài dependencies

```bash
cd client
npm install
# hoặc
yarn install
```

### 2. Tạo file .env

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Sửa nội dung `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Chạy client

```bash
npm run dev
# hoặc
yarn dev
```

Client sẽ chạy ở `http://localhost:3000`

---

## Các tính năng đã tích hợp

### ✅ 1. Hiển thị sản phẩm từ API

- **File**: `client/src/redux/sagas/productSaga.js`
- **API**: `GET /api/product/all-product?page=1&limit=12`
- **Chức năng**: Lấy danh sách sản phẩm với phân trang

### ✅ 2. Tìm kiếm sản phẩm

- **File**: `client/src/redux/sagas/productSaga.js`
- **API**: `GET /api/product/all-product?q=keyword&limit=100`
- **Chức năng**: Tìm kiếm sản phẩm theo tên

### ✅ 3. Thanh toán tạo đơn hàng

- **File**: `client/src/views/checkout/step3/index.jsx`
- **API**: `POST /api/order/create-order`
- **Chức năng**: 
  - Tạo đơn hàng từ giỏ hàng
  - Tự động tạo khách hàng nếu chưa có
  - Trừ tồn kho sản phẩm
  - Xóa giỏ hàng sau khi đặt hàng thành công

---

## Cấu trúc API Service

### File: `client/src/services/api.js`

```javascript
import { productAPI, orderAPI, categoryAPI, authAPI } from '@/services/api';

// Lấy sản phẩm
const response = await productAPI.getProducts({ page: 1, limit: 12, q: 'search' });

// Tạo đơn hàng
const response = await orderAPI.createOrder(orderData);
```

---

## Format dữ liệu

### Product (từ API → Redux)

**API Response**:
```json
{
  "Products": [
    {
      "_id": "123",
      "pName": "Product Name",
      "pPrice": 100000,
      "pImages": ["image1.jpg"],
      "pQuantity": 10,
      "pCategory": "category_id"
    }
  ],
  "total": 100
}
```

**Transformed to Redux**:
```javascript
{
  id: "123",
  name: "Product Name",
  price: 100000,
  images: ["image1.jpg"],
  image: "image1.jpg",
  quantity: 10,
  maxQuantity: 10,
  category: "category_id"
}
```

### Order (Client → API)

```javascript
{
  allProduct: [
    { id: "product_id", quantitiy: 2 } // Note: typo 'quantitiy' in backend
  ],
  amount: 200000,
  transactionId: "TXN-1234567890",
  address: "Customer Name, Address",
  phone: 123456789,
  customer: {
    fullName: "Customer Name",
    phoneNumber: "0123456789",
    email: "customer@example.com",
    address: "Address"
  }
}
```

---

## Lưu ý

1. **Backend typo**: Field `quantitiy` (không phải `quantity`) trong `allProduct`
2. **Guest orders**: Đơn hàng khách vãng lai được hỗ trợ (không cần đăng nhập)
3. **Phone number**: Phải là số nguyên (parseInt)
4. **Transaction ID**: Tự động generate `TXN-${Date.now()}`

---

## Các bước tiếp theo (TODO)

- [ ] Tích hợp đăng nhập/đăng ký với API
- [ ] Hiển thị lịch sử đơn hàng
- [ ] Tích hợp categories filter
- [ ] Thêm OrderDetails table (snapshot sản phẩm)
- [ ] Thêm payment tracking

---

## Troubleshooting

### Lỗi CORS

Nếu gặp lỗi CORS, kiểm tra server có cấu hình:

```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Lỗi 401 Unauthorized

- Kiểm tra token trong localStorage: `serviceToken`
- API sẽ tự động thêm `Authorization: Bearer <token>` vào header

### Sản phẩm không hiển thị

- Kiểm tra server đang chạy ở port 8000
- Kiểm tra `.env` có đúng `VITE_API_BASE_URL`
- Mở DevTools → Network để xem API response

