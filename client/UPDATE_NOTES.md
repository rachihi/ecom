# Cập Nhật Hệ Thống: Loại Bỏ Firebase

## 📝 Tóm Tắt Các Thay Đổi

Dự án đã được **cập nhật hoàn toàn** để loại bỏ Firebase. Tất cả dữ liệu sản phẩm, đơn hàng, khách hàng bây giờ được quản lý qua API từ Backend Node.js.

---

## ✅ Các File Đã Cập Nhật

### 1. **productSaga.js** - Redux Saga cho Sản Phẩm

- ✅ `GET_PRODUCTS`: Lấy danh sách sản phẩm từ API
- ✅ `SEARCH_PRODUCT`: Tìm kiếm sản phẩm từ API
- ✅ `ADD_PRODUCT`: Thêm sản phẩm với upload ảnh qua FormData
- ✅ `EDIT_PRODUCT`: Chỉnh sửa sản phẩm với upload ảnh mới
- ✅ `REMOVE_PRODUCT`: Xoá sản phẩm từ API

**Thay đổi chính:**

- Loại bỏ tất cả `firebase.*` calls
- Sử dụng `FormData` cho file uploads
- Gọi API endpoints thay vì Firebase Realtime Database

### 2. **orderSaga.js** - Redux Saga cho Đơn Hàng (MỚI)

- ✅ `GET_ORDERS`: Lấy danh sách đơn hàng của user
- ✅ `CREATE_ORDER`: Tạo đơn hàng mới
- ✅ `UPDATE_ORDER`: Cập nhật trạng thái đơn hàng
- ✅ `CANCEL_ORDER`: Huỷ đơn hàng
- ✅ `GET_ORDER_DETAIL`: Lấy chi tiết đơn hàng

### 3. **api.js** - API Service

#### Sản phẩm (Products):

```javascript
// Thêm sản phẩm
productAPI.addProduct(formData);
// POST /api/product/add-product

// Chỉnh sửa sản phẩm
productAPI.editProduct(productId, formData);
// PUT /api/product/edit-product/{productId}

// Xoá sản phẩm
productAPI.deleteProduct(productId);
// DELETE /api/product/delete-product/{productId}
```

#### Đơn hàng (Orders):

```javascript
// Tạo đơn hàng
orderAPI.createOrder(orderData);
// POST /api/order/create-order

// Lấy đơn hàng của user
orderAPI.getOrdersByUser(userId);
// POST /api/order/order-by-user

// Lấy chi tiết đơn hàng
orderAPI.getOrderDetail(orderId);
// GET /api/order/{orderId}

// Cập nhật đơn hàng
orderAPI.updateOrder(orderId, data);
// PUT /api/order/{orderId}

// Huỷ đơn hàng
orderAPI.cancelOrder(orderId);
// PUT /api/order/{orderId}/cancel
```

---

## 📡 API Endpoints cần có trên Backend

### Products:

```
POST   /api/product/add-product           - Thêm sản phẩm (với upload ảnh)
PUT    /api/product/edit-product/:id      - Chỉnh sửa sản phẩm
DELETE /api/product/delete-product/:id    - Xoá sản phẩm
```

### Orders:

```
GET    /api/order/:id                     - Chi tiết đơn hàng
PUT    /api/order/:id                     - Cập nhật đơn hàng
PUT    /api/order/:id/cancel              - Huỷ đơn hàng
```

---

## 🔧 Hướng Dẫn Sử Dụng

### Để thêm sản phẩm (Admin):

```javascript
const formData = new FormData();
formData.append("pName", "Tên sản phẩm");
formData.append("pPrice", 100000);
formData.append("pQuantity", 50);
formData.append("file", imageFile); // ảnh chính

// Gọi action
dispatch({ type: "ADD_PRODUCT", payload: formData });
```

### Để tạo đơn hàng (Customer):

```javascript
dispatch({
  type: "CREATE_ORDER",
  payload: {
    items: [
      { id: "507f...", quantity: 2, price: 100000 },
      { id: "507g...", quantity: 1, price: 200000 },
    ],
    totalAmount: 400000,
    shippingAddress: {
      street: "123 Đường ABC",
      city: "Hà Nội",
      state: "HN",
      zipCode: "10000",
      country: "Việt Nam",
    },
    customerId: "507f...",
  },
});
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. File Upload

- Sử dụng `FormData` thay vì Firebase storage
- Server sẽ lưu ảnh trong `/public/uploads/products`
- URL ảnh được trả về trong response

### 2. Authentication

```javascript
// Token được lưu tự động
localStorage.setItem("serviceToken", token);

// Token được gắn vào header tự động
// Authorization: Bearer {token}
```

### 3. Error Handling

```javascript
// Nếu token expired (401), user sẽ bị redirect đến /signin
// Lỗi API sẽ được hiển thị qua action message
```

---

## 🚀 Bước Tiếp Theo

### Đã hoàn thành:

✅ productSaga.js - loại bỏ Firebase  
✅ orderSaga.js - tạo mới  
✅ API services - cập nhật

### Cần hoàn thành:

⏳ Backend API endpoints (Product CRUD, Order management)  
⏳ authSaga.js - xử lý đăng ký/đăng nhập  
⏳ Kiểm thử toàn bộ flow  
⏳ Admin-client modules (quản lý sản phẩm, đơn hàng, khách hàng, v.v.)

---

## 📚 Kiến Trúc Tập Tin

```
client/src/redux/
├── sagas/
│   ├── productSaga.js       ✅ Đã cập nhật (loại bỏ Firebase)
│   ├── orderSaga.js         ✅ Mới tạo
│   └── authSaga.js          ⏳ Cần tạo
├── actions/
├── reducers/
└── store.js

client/src/services/
└── api.js                   ✅ Đã cập nhật
```

---

## 🎯 Lợi Ích của Cập Nhật

1. **Hiệu suất tốt hơn**: API call qua HTTP + caching
2. **Quản lý dữ liệu tập trung**: Tất cả từ MongoDB backend
3. **Độ bảo mật cao hơn**: JWT authentication trên server
4. **Dễ scale**: Backend độc lập, dễ mở rộng
5. **Không phụ thuộc Firebase**: Dễ migrate nếu cần

---

## 💬 Câu Hỏi Thường Gặp

**Q: Tại sao không dùng Firebase nữa?**
A: Firebase không tối ưu cho e-commerce, đặc biệt là quản lý kho, thanh toán, POS. Backend custom tốt hơn cho yêu cầu phức tạp.

**Q: Ảnh sản phẩm được lưu ở đâu?**
A: Lưu trong `/server/public/uploads/products/` trên server.

**Q: Nếu API bị ngắt sẽ như thế nào?**
A: Error sẽ được catch trong saga, action message sẽ hiển thị, user có thể retry.

**Q: Có thể offline không?**
A: Không, cần internet để kết nối API. Có thể thêm caching/offline support sau.

---

**Ngày cập nhật**: 13/11/2025  
**Phiên bản**: 2.0 (Loại bỏ Firebase)
