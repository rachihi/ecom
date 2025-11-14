# 🚀 Quick Start Guide

## Một Trang Tóm Tắt Hệ Thống

---

## 📂 Cấu Trúc Thư Mục

```
ecom/
├── client/              # App khách hàng (React)
│   └── src/redux/sagas/
│       ├── productSaga.js    ✅ API-based (loại bỏ Firebase)
│       └── orderSaga.js      ✅ Mới tạo
│
├── admin-client/        # Dashboard quản lý (React + TS)
│   └── src/services/
│       └── api.js       ✅ 50+ API functions
│
├── server/              # Backend (Node.js/Express)
│   ├── routes/          ⏳ Cần implement
│   ├── controllers/     ⏳ Cần implement
│   └── models/          ⏳ Cần implement
│
├── ARCHITECTURE.md      ✅ Kiến trúc toàn hệ thống
├── DEVELOPER_GUIDE.md   ✅ Hướng dẫn phát triển
├── UPDATE_NOTES.md      ✅ Ghi chú cập nhật
└── PROJECT_STATUS.md    ✅ Trạng thái dự án
```

---

## 🔑 Key Files

### 1. Client Redux-Saga

```
client/src/redux/sagas/productSaga.js
- GET_PRODUCTS      → API call → transform → dispatch success
- ADD_PRODUCT       → FormData → upload → save
- EDIT_PRODUCT      → FormData → upload → update
- REMOVE_PRODUCT    → API call → delete
- SEARCH_PRODUCT    → API call → transform
```

### 2. Client API Service

```
client/src/services/api.js
productAPI.getProducts()
productAPI.addProduct(formData)      ← FormData with multipart
productAPI.editProduct(id, formData) ← FormData with multipart
productAPI.deleteProduct(id)

orderAPI.createOrder(data)
orderAPI.getOrdersByUser(userId)
orderAPI.updateOrder(id, data)
orderAPI.cancelOrder(id)
```

### 3. Admin API Service

```
admin-client/src/services/api.js
adminAuthAPI.*              → 3 functions
adminProductAPI.*           → 6 functions
adminCategoryAPI.*          → 5 functions
adminCustomerAPI.*          → 5 functions
adminOrderAPI.*             → 7 functions
adminPaymentAPI.*           → 6 functions
adminSupplierAPI.*          → 5 functions
adminWarehouseAPI.*         → 6 functions
adminPurchaseOrderAPI.*     → 5 functions
adminPosAPI.*               → 5 functions
adminReportAPI.*            → 5 functions
```

---

## 🔗 API Endpoints

### Products (Cần implement)

```
GET    /api/product/all-product?page=1&limit=12
POST   /api/product/add-product                    ← FormData
PUT    /api/product/edit-product/:id               ← FormData
DELETE /api/product/delete-product/:id
```

### Orders (Cần implement)

```
GET    /api/order/all-orders?page=1
GET    /api/order/:id
POST   /api/order/create-order
POST   /api/order/create-order-admin              ← POS
PUT    /api/order/:id/status
PUT    /api/order/:id/cancel
```

### Payments (Cần implement)

```
GET    /api/payments?page=1&status=completed
POST   /api/payments
PUT    /api/payments/:id
DELETE /api/payments/:id
```

### Warehouse (Cần implement)

```
GET    /api/warehouse/stock
GET    /api/warehouse/movements
POST   /api/warehouse/import
POST   /api/warehouse/export
POST   /api/warehouse/adjust
```

### POS (Cần implement)

```
POST   /api/pos/create-order
POST   /api/pos/process-payment
GET    /api/pos/receipt/:orderId
```

---

## 🔐 Authentication

### Admin

```javascript
// Login
POST /api/auth/signin
Response: { token, user: { _id, role, exp } }

// Header
Authorization: Bearer {token}
localStorage.setItem('adminToken', token)
```

### Customer

```javascript
// Login
POST /api/customer/signin
Response: { token, user: { _id, role } }

// Header
Authorization: Bearer {token}
localStorage.setItem('serviceToken', token)
```

---

## 📊 Database Models

### User (Admin)

```javascript
{ _id, name, email, password, userRole: 1, userImage, createdAt }
```

### Customer

```javascript
{
  _id, code, fullName, email, phoneNumber, address, balance, status, orders;
}
```

### Product

```javascript
{
  _id, pName, pDescription, pPrice, pQuantity, pCategory, pImages, createdAt;
}
```

### Order

```javascript
{
  _id,
    orderNumber,
    customer,
    items,
    totalAmount,
    status,
    paymentStatus,
    shippingAddress,
    note,
    createdAt;
}
```

### Payment

```javascript
{
  _id, order, customer, amount, paymentDate, paymentMethod, status, note;
}
```

---

## 🛠️ Common Tasks

### ✅ Thêm sản phẩm

```javascript
// Client side
const formData = new FormData();
formData.append('pName', 'Product Name');
formData.append('pPrice', 100000);
formData.append('file', imageFile);

dispatch({ type: 'ADD_PRODUCT', payload: formData });

// Backend
POST /api/product/add-product (multipart/form-data)
  Body: formData
  Response: { _id, pName, pPrice, ... }
```

### ✅ Tạo đơn hàng

```javascript
// Client side
dispatch({
  type: 'CREATE_ORDER',
  payload: {
    items: [{ id, quantity, price }],
    totalAmount: 400000,
    shippingAddress: {...},
    customerId: '...'
  }
});

// Backend
POST /api/order/create-order
  Body: { items, totalAmount, shippingAddress }
  Response: { _id, orderNumber, status: 'pending' }
```

### ✅ Cập nhật trạng thái đơn hàng

```javascript
// Admin side
PUT /api/order/:orderId/status
  Body: { status: 'shipped', note: '...' }
  Response: { _id, status: 'shipped', ... }
```

### ✅ Thanh toán

```javascript
// Admin/Customer
POST /api/payments
  Body: { orderId, amount, paymentMethod, note }
  Response: { _id, amount, paymentDate, ... }
```

---

## 🚀 Setup & Run

### Terminal 1: Server

```bash
cd server
npm install
npm run dev
# Server running on http://localhost:8000
```

### Terminal 2: Client

```bash
cd client
npm install
npm run dev
# Client running on http://localhost:5173
```

### Terminal 3: Admin-Client

```bash
cd admin-client
npm install
npm start
# Admin running on http://localhost:3000
```

---

## 📋 Checklist Implement API

### Backend Routes

- [ ] routes/products.js (add, edit, delete)
- [ ] routes/orders.js (all endpoints)
- [ ] routes/payments.js (all endpoints)
- [ ] routes/warehouse.js (all endpoints)
- [ ] routes/suppliers.js (all endpoints)
- [ ] routes/customers.js (all endpoints)
- [ ] routes/pos.js (all endpoints)

### Backend Controllers

- [ ] controllers/products.js
- [ ] controllers/orders.js
- [ ] controllers/payments.js
- [ ] controllers/warehouse.js
- [ ] controllers/suppliers.js
- [ ] controllers/customers.js
- [ ] controllers/pos.js

### Backend Models

- [ ] models/products.js (+ indexes)
- [ ] models/orders.js (+ indexes)
- [ ] models/payments.js (+ indexes)
- [ ] models/warehouse.js (+ indexes)
- [ ] models/suppliers.js (+ indexes)
- [ ] models/customers.js (+ indexes)

### Frontend - Admin

- [ ] pages/apps/products/
- [ ] pages/apps/orders/
- [ ] pages/apps/customers/
- [ ] pages/apps/suppliers/
- [ ] pages/apps/warehouse/
- [ ] pages/apps/payments/
- [ ] pages/apps/pos/
- [ ] Authentication flow

---

## ⚠️ Important Notes

1. **File Upload**: Use `FormData` + `multipart/form-data`
2. **Token**: Auto-attached via axios interceptor
3. **Error Handling**: Caught in saga, displayed as notification
4. **Pagination**: ?page=1&limit=12
5. **Search**: ?q=keyword&limit=100
6. **Admin vs Customer**: Different auth endpoints, different roles

---

## 📚 Documentation

- **`ARCHITECTURE.md`** → System architecture & design
- **`DEVELOPER_GUIDE.md`** → Complete development guide
- **`UPDATE_NOTES.md`** → What changed from Firebase
- **`PROJECT_STATUS.md`** → Current progress & next steps

---

## 🎯 Next Priority

1. ⏳ **Implement Backend API** (3-5 days)
2. ⏳ **Build Admin Dashboard** (5-7 days)
3. ⏳ **Client Auth & Cart** (3-5 days)
4. ⏳ **Testing & Deployment** (3-5 days)

---

**Last Updated**: 13/11/2025  
**Status**: Ready for Backend Implementation ✅
