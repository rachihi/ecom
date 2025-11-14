# Hệ Thống E-Commerce: Kiến Trúc Toàn Bộ

## 📋 Tổng Quan Hệ Thống

Dự án chia thành **3 phần độc lập**:

```
ecom/
├── server/               # Node.js + Express + MongoDB Backend
├── admin-client/         # React + TypeScript - Admin Dashboard
└── client/               # React - Customer Shopping
```

---

## 🏗️ Kiến Trúc Tổng Quát

### Backend (Server)

- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT Token
- **Port**: 8000
- **Uploads**: `/public/uploads` (products, categories, customize)

#### Routes tồn tại:

```
POST   /api/auth/signup          - Admin đăng ký
POST   /api/auth/signin          - Admin đăng nhập
GET    /api/user/profile         - Lấy profile admin

POST   /api/customer/signin      - Khách hàng đăng nhập
POST   /api/customer/signup      - Khách hàng đăng ký

GET    /api/product/all-product  - Danh sách sản phẩm (phân trang)
GET    /api/product/all-product?q=keyword - Tìm kiếm sản phẩm
GET    /api/category/all-category - Danh sách danh mục

POST   /api/order/create-order   - Tạo đơn hàng
POST   /api/order/order-by-user  - Lấy đơn hàng của user

GET    /api/customers/          - Quản lý khách hàng (Admin)
GET    /api/suppliers/          - Quản lý nhà cung cấp (Admin)
GET    /api/warehouse/          - Quản lý kho (Admin)
GET    /api/payments/           - Quản lý thanh toán (Admin)
GET    /api/pos/                - Giao diện POS (Admin)
```

---

## 💻 Phần 1: CLIENT (Khách Hàng - React)

### Cấu trúc:

```
client/
├── src/
│   ├── redux/
│   │   ├── sagas/
│   │   │   ├── productSaga.js    ✅ Đã cập nhật API
│   │   │   ├── orderSaga.js      ❌ Cần tạo
│   │   │   └── authSaga.js       ❌ Cần tạo
│   │   ├── actions/
│   │   ├── reducers/
│   │   └── store.js
│   ├── services/
│   │   └── api.js               ✅ API integration
│   ├── routers/
│   │   └── AppRouter.jsx        ✅ Routing
│   └── pages/
```

### Authentication Flow:

```
Customer Signs Up/In
     ↓
Call: POST /api/customer/signin
     ↓
Server trả về JWT Token
     ↓
Store token in localStorage: 'serviceToken'
     ↓
Token auto-attach vào headers qua axios interceptor
```

### API Calls (productSaga.js):

```javascript
// GET /api/product/all-product?page=1&limit=12
productAPI.getProducts({ page: 1, limit: 12 });

// GET /api/product/all-product?q=keyword&limit=100
productAPI.searchProducts(searchKey);

// GET /api/category/all-category?limit=1000
categoryAPI.getCategories();
```

---

## 👨‍💼 Phần 2: ADMIN-CLIENT (Quản Lý - React + TypeScript)

### Cấu trúc:

```
admin-client/
├── src/
│   ├── api/                 - API services
│   ├── components/          - Reusable components
│   ├── pages/               - Page components
│   ├── sections/            - Section components
│   ├── types/               - TypeScript interfaces
│   ├── menu-items/          - Navigation menu
│   ├── routes/              - Route configuration
│   ├── contexts/            - Auth context
│   ├── hooks/               - Custom hooks
│   └── themes/              - Theme configuration
```

### Modules được quản lý:

1. **Products** - Sản phẩm (CRUD)
2. **Categories** - Danh mục (CRUD)
3. **Orders** - Đơn hàng + Trạng thái + Thanh toán
4. **Customers** - Khách hàng
5. **Suppliers** - Nhà cung cấp
6. **Warehouse** - Kho (Nhập/Xuất)
7. **Payments** - Thanh toán
8. **POS** - Giao diện bán hàng

### Authentication:

```
Admin Login
    ↓
POST /api/auth/signin (với role: 1)
    ↓
JWT Token with role: "Admin" hoặc "Employee"
    ↓
Middleware auth.js kiểm tra token
```

---

## 🖥️ Phần 3: SERVER (Node.js + Express)

### Middleware:

```javascript
// Admin auth
const { loginCheck } = require("./middleware/auth");

// Customer auth
const { customerAuthCheck } = require("./middleware/customerAuth");

// Sử dụng:
router.get("/admin-only", loginCheck, controllerFunction);
router.get("/customer-only", customerAuthCheck, controllerFunction);
```

### Controllers:

```
controllers/
├── auth.js              - Admin authentication
├── products.js          - Product CRUD
├── categories.js        - Category CRUD
├── orders.js            - Order management
├── customers.js         - Customer management
├── suppliers.js         - Supplier management
├── warehouse.js         - Warehouse management
├── payments.js          - Payment management
└── pos.js              - POS operations
```

### Models:

```
models/
├── users.js            - Admin users (role: 1)
├── customers.js        - Customer users (role: 0)
├── products.js
├── categories.js
├── orders.js
├── suppliers.js
├── warehouses.js
├── payments.js
└── purchase_orders.js
```

---

## 🔄 Data Flow

### Ví dụ 1: Customer xem sản phẩm

```
Client Component
     ↓
dispatch(GET_PRODUCTS)
     ↓
productSaga.js
     ↓
productAPI.getProducts({ page: 1, limit: 12 })
     ↓
axios GET /api/product/all-product?page=1&limit=12
     ↓
Server routes/products.js
     ↓
controller/products.js
     ↓
models/products.js (MongoDB query)
     ↓
Response: { Products: [...], total: 100 }
     ↓
productSaga transform & dispatch getProductsSuccess()
     ↓
Reducer update Redux store
     ↓
Component re-render với sản phẩm mới
```

### Ví dụ 2: Admin tạo đơn hàng (POS)

```
Admin Dashboard (POS Interface)
     ↓
Chọn sản phẩm + nhập số lượng + chọn khách hàng
     ↓
POST /api/pos/create-order
     ↓
Server kiểm tra:
  - Token hợp lệ (middleware auth.js)
  - Role là Admin (loginCheck)
  - Validate dữ liệu
     ↓
controller/pos.js
     ↓
Create order in DB
Create payment record
Update stock in warehouse
     ↓
Response: { orderId, status, total }
     ↓
Update Redux store
     ↓
UI hiển thị success notification
```

---

## 🔐 Security & Authentication

### Admin Login:

```javascript
// Request
POST /api/auth/signin
{
  email: "admin@example.com",
  password: "password123"
}

// Response
{
  token: "eyJhbGciOiJIUzI1NiIs...",
  user: {
    _id: "507f1f77bcf86cd799439011",
    role: "Admin", // role: 1 trong DB
    exp: 1234567890
  }
}
```

### Token Usage:

```javascript
// Request header auto-attach qua interceptor:
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

// Server middleware kiểm tra:
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  req.userDetails = decoded;
  next();
}
```

---

## 📦 Current Status

### ✅ Đã hoàn thành:

- Backend routes cơ bản
- Client product listing từ API
- Authentication structure

### ❌ Cần hoàn thành:

- Admin Dashboard modules (quản lý)
- Order/Payment management flow
- POS interface
- Warehouse stock management
- Redux sagas cho tất cả modules

---

## 🚀 API Endpoints cần có

### Products:

```
GET    /api/product/all-product           - List (client)
GET    /api/product/{id}                  - Detail
POST   /api/product/add-product           - Create (admin)
PUT    /api/product/edit/{id}             - Update (admin)
DELETE /api/product/delete/{id}           - Delete (admin)
```

### Orders:

```
POST   /api/order/create-order            - Create (customer)
POST   /api/order/create-order-admin      - Create (admin - POS)
GET    /api/order/order-by-user/{userId}  - List by customer
GET    /api/order/admin/all-orders        - List all (admin)
GET    /api/order/{orderId}               - Detail
PUT    /api/order/{orderId}/status        - Update status
```

### Payments:

```
POST   /api/payments                      - Create payment
GET    /api/payments                      - List payments (admin)
GET    /api/payments/{id}                 - Detail
PUT    /api/payments/{id}                 - Update
```

---

## 🛠️ Environment Variables

### Server (.env):

```
DATABASE=mongodb://...
JWT_SECRET=your-secret-key
PORT=8000
NODE_ENV=development
```

### Client (.env):

```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 📝 Tiếp Theo

1. ✅ Cập nhật `productSaga.js` - loại bỏ Firebase
2. ⏳ Tạo `orderSaga.js` - xử lý đơn hàng
3. ⏳ Tạo API services cho admin-client
4. ⏳ Tạo management pages (Products, Orders, Customers, etc.)
5. ⏳ Tạo POS interface
