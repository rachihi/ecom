# 📖 Developer Guide: E-Commerce System Architecture

## 🎯 Tổng Quan Dự Án

Dự án E-Commerce được chia thành **3 phần độc lập**:

```
┌─────────────────────────────────────────────────────────┐
│                   Browser/Client                         │
├──────────────────────┬──────────────────┬───────────────┤
│  Client App          │  Admin Dashboard │   Customer    │
│  (React)             │  (React + TS)    │   (React)     │
│  Port: 3000          │  Port: 3001      │   Port: 3000  │
└──────────────────────┴──────────────────┴───────────────┘
                             │
                    HTTP REST API (Axios)
                             │
┌─────────────────────────────────────────────────────────┐
│            Backend Server (Node.js/Express)              │
│                      Port: 8000                          │
│  - User Management (Admin/Customer Auth)                │
│  - Product CRUD                                         │
│  - Order Management                                     │
│  - Payment Processing                                   │
│  - Warehouse Management                                 │
│  - Supplier Management                                  │
│  - POS Operations                                       │
└─────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────┐
│            MongoDB Database                              │
│  - Collections: products, orders, customers, etc        │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ Phần 1: CLIENT (Khách Hàng)

### Cấu Trúc Thư Mục

```
client/
├── src/
│   ├── redux/
│   │   ├── sagas/
│   │   │   ├── productSaga.js    ✅ Products CRUD
│   │   │   ├── orderSaga.js      ✅ Orders CRUD
│   │   │   ├── authSaga.js       ❌ Cần tạo
│   │   │   └── ...
│   │   ├── actions/
│   │   ├── reducers/
│   │   └── store.js
│   ├── services/
│   │   └── api.js                ✅ API Integration
│   ├── routers/
│   │   └── AppRouter.jsx
│   └── pages/
│       ├── HomePage
│       ├── SignIn
│       ├── SignUp
│       ├── ProductDetail
│       ├── Cart
│       ├── Checkout
│       └── UserAccount
```

### Chức Năng

- 🛍️ Duyệt sản phẩm, tìm kiếm
- 🛒 Quản lý giỏ hàng
- 👤 Đăng ký/Đăng nhập
- 📦 Tạo đơn hàng
- 💳 Thanh toán
- 📜 Xem lịch sử đơn hàng

### API Endpoints Sử Dụng

**Products:**

```
GET /api/product/all-product?page=1&limit=12
GET /api/product/all-product?q=keyword
GET /api/product/single-product
```

**Orders:**

```
POST /api/order/create-order
POST /api/order/order-by-user
GET /api/order/:orderId
```

**Categories:**

```
GET /api/category/all-category
```

**Auth:**

```
POST /api/customer/signin
POST /api/customer/signup
GET /api/customer/profile
```

---

## 👨‍💼 Phần 2: ADMIN-CLIENT (Quản Lý)

### Cấu Trúc Thư Mục

```
admin-client/
├── src/
│   ├── api/                    # API services
│   ├── components/             # Reusable UI components
│   │   ├── @extended/
│   │   │   ├── EnhancedTable.tsx
│   │   │   └── FormDialog.tsx
│   │   └── ...
│   ├── pages/                  # Page components
│   ├── sections/               # Section components
│   │   ├── apps/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── suppliers/
│   │   │   ├── warehouse/
│   │   │   ├── payments/
│   │   │   └── pos/
│   │   └── ...
│   ├── types/                  # TypeScript interfaces
│   │   ├── product.ts
│   │   ├── order.ts
│   │   ├── customer.ts
│   │   ├── supplier.ts
│   │   ├── warehouse.ts
│   │   └── payment.ts
│   ├── services/
│   │   └── api.js              ✅ API Integration
│   ├── menu-items/             # Navigation menu
│   ├── routes/                 # Route configuration
│   ├── contexts/               # Auth context
│   ├── hooks/                  # Custom hooks
│   └── themes/
```

### Modules & Chức Năng

#### 1️⃣ **Products Management**

```
POST   /api/product/add-product
PUT    /api/product/edit-product/:id
DELETE /api/product/delete-product/:id
```

- Thêm sản phẩm (với upload ảnh)
- Chỉnh sửa thông tin
- Xoá sản phẩm
- Quản lý danh mục

#### 2️⃣ **Orders Management**

```
GET    /api/order/all-orders
GET    /api/order/:id
PUT    /api/order/:id/status
PUT    /api/order/:id/cancel
```

- Xem tất cả đơn hàng
- Cập nhật trạng thái (pending, processing, shipped, delivered, cancelled)
- Huỷ đơn hàng
- Tra cứu thông tin khách hàng

#### 3️⃣ **Customers Management**

```
GET    /api/customers
POST   /api/customers
PUT    /api/customers/:id
DELETE /api/customers/:id
```

- Danh sách khách hàng
- Thêm khách hàng mới
- Chỉnh sửa thông tin
- Xoá khách hàng
- Tra cứu công nợ

#### 4️⃣ **Suppliers Management**

```
GET    /api/suppliers
POST   /api/suppliers
PUT    /api/suppliers/:id
DELETE /api/suppliers/:id
```

- Quản lý nhà cung cấp
- Công nợ nhà cung cấp
- Lịch sử cung cấp

#### 5️⃣ **Warehouse Management**

```
GET    /api/warehouse/stock
GET    /api/warehouse/movements
POST   /api/warehouse/import
POST   /api/warehouse/export
```

- Kiểm tra tồn kho
- Nhập kho từ nhà cung cấp
- Xuất kho cho đơn hàng
- Điều chỉnh tồn kho
- Báo cáo kho

#### 6️⃣ **Payments Management**

```
GET    /api/payments
POST   /api/payments
PUT    /api/payments/:id
```

- Quản lý thanh toán đơn hàng
- Theo dõi công nợ khách hàng
- Báo cáo doanh thu
- Hỗ trợ: Cash, Bank Transfer

#### 7️⃣ **POS (Point of Sale)**

```
POST   /api/pos/create-order
POST   /api/pos/process-payment
GET    /api/pos/receipt/:orderId
```

- Giao diện bán hàng nhanh
- Chọn sản phẩm, nhập số lượng
- Chọn khách hàng
- Thanh toán ngay lập tức
- In hóa đơn
- Tích hợp với warehouse

#### 8️⃣ **Reports & Analytics**

```
GET    /api/reports/sales
GET    /api/reports/revenue
GET    /api/reports/inventory
GET    /api/reports/customers
```

- Báo cáo bán hàng
- Báo cáo doanh thu
- Báo cáo tồn kho
- Phân tích khách hàng

---

## 🖥️ Phần 3: SERVER (Backend)

### Stack Technology

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT
- **File Upload**: Multer
- **Port**: 8000

### Cấu Trúc Thư Mục

```
server/
├── routes/                 # API routes
│   ├── auth.js            # Admin authentication
│   ├── customerAuth.js    # Customer authentication
│   ├── products.js        # Product endpoints
│   ├── orders.js          # Order endpoints
│   ├── customers.js       # Customer endpoints
│   ├── suppliers.js       # Supplier endpoints
│   ├── warehouse.js       # Warehouse endpoints
│   ├── payments.js        # Payment endpoints
│   ├── pos.js             # POS endpoints
│   └── ...
├── controllers/           # Business logic
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   └── ...
├── models/               # Database schemas
│   ├── users.js         # Admin users (role: 1)
│   ├── customers.js     # Customer users (role: 0)
│   ├── products.js
│   ├── orders.js
│   ├── payments.js
│   ├── suppliers.js
│   ├── warehouses.js
│   └── ...
├── middleware/          # Custom middleware
│   ├── auth.js         # Admin auth middleware
│   ├── customerAuth.js # Customer auth middleware
│   └── errorHandler.js
├── config/
│   ├── db.js           # Database connection
│   ├── keys.js         # JWT secret, env vars
│   └── upload.js       # Multer config
└── public/uploads/     # Uploaded files
    ├── products/
    ├── categories/
    └── customize/
```

### Database Schema Overview

#### Users (Admin)

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  userRole: Number, // 1 = Admin, 0 = Customer
  userImage: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Customers

```javascript
{
  _id: ObjectId,
  code: String,           // Unique customer code
  fullName: String,
  email: String,
  phoneNumber: String,
  address: String,
  balance: Number,        // Customer's debt
  status: String,         // active, inactive
  orders: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

#### Products

```javascript
{
  _id: ObjectId,
  pName: String,
  pDescription: String,
  pPrice: Number,
  pQuantity: Number,
  pCategory: ObjectId,    // Reference to Category
  pImages: [String],      // Array of image URLs
  createdAt: Date,
  updatedAt: Date
}
```

#### Orders

```javascript
{
  _id: ObjectId,
  orderNumber: String,
  customer: ObjectId,     // Reference to Customer
  items: [{
    product: ObjectId,
    quantity: Number,
    price: Number,
    subtotal: Number
  }],
  totalAmount: Number,
  status: String,         // pending, processing, shipped, delivered, cancelled
  paymentStatus: String,  // unpaid, partially_paid, paid
  shippingAddress: {},
  note: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Payments

```javascript
{
  _id: ObjectId,
  order: ObjectId,        // Reference to Order
  customer: ObjectId,
  amount: Number,
  paymentDate: Date,
  paymentMethod: String,  // Cash, BankTransfer
  status: String,         // completed, pending, cancelled
  note: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Authentication Flow

#### Admin Login

```
1. User input email/password
2. POST /api/auth/signin
3. Server verify password (bcrypt)
4. Generate JWT token (role: "Admin", exp: 7 days)
5. Response: { token, user: { _id, role, exp } }
6. Client save token to localStorage
7. Token auto-attach to header: Authorization: Bearer {token}
```

#### Customer Login

```
1. User input email/password
2. POST /api/customer/signin
3. Server verify password (bcrypt)
4. Generate JWT token (role: "CUSTOMER")
5. Client save token to localStorage (key: 'serviceToken')
6. Token auto-attach to API requests
```

#### Middleware Protection

```javascript
// Admin routes
app.put("/api/product/edit/:id", auth, productController.editProduct);

// Customer routes
app.get("/api/customer/profile", customerAuth, customerController.getProfile);
```

---

## 🔄 Data Flow Examples

### 1️⃣ Customer Buys Product

```
┌─ CLIENT ─────────────────────────────────────────┐
│ Customer clicks "Buy"                            │
│ Cart: [{ id, qty }, { id, qty }]                │
└──────────────────┬──────────────────────────────┘
                   │ dispatch(CREATE_ORDER)
                   ↓
┌─ REDUX SAGA ─────────────────────────────────────┐
│ orderSaga receives CREATE_ORDER                  │
│ Transforms: { items, total, address, customerId }
└──────────────────┬──────────────────────────────┘
                   │ API call
                   ↓
┌─ API SERVICE ────────────────────────────────────┐
│ axios.post('/order/create-order', orderData)    │
│ Headers: Authorization: Bearer {token}          │
└──────────────────┬──────────────────────────────┘
                   │ HTTP POST
                   ↓
┌─ SERVER ─────────────────────────────────────────┐
│ routes/orders.js                                │
│   └─ POST /api/order/create-order               │
│       └─ middleware/customerAuth.js (verify JWT)│
│           └─ controller/orders.js               │
│               ├─ Validate order data            │
│               ├─ Save to MongoDB                │
│               ├─ Update warehouse stock         │
│               └─ Return: { orderId, status }    │
└──────────────────┬──────────────────────────────┘
                   │ Response 201
                   ↓
┌─ API SERVICE ────────────────────────────────────┐
│ return response.data                            │
└──────────────────┬──────────────────────────────┘
                   │ Transform
                   ↓
┌─ REDUX SAGA ─────────────────────────────────────┐
│ yield put(createOrderSuccess(order))            │
└──────────────────┬──────────────────────────────┘
                   │ dispatch action
                   ↓
┌─ REDUX REDUCER ──────────────────────────────────┐
│ Update state.orders = [...orders, newOrder]    │
└──────────────────┬──────────────────────────────┘
                   │ Store update
                   ↓
┌─ REACT COMPONENT ────────────────────────────────┐
│ Component re-render                             │
│ Display: "Order created successfully!"          │
│ Redirect to: /order/:orderId                    │
└──────────────────────────────────────────────────┘
```

### 2️⃣ Admin Creates Order (POS)

```
┌─ ADMIN CLIENT ───────────────────────────────────┐
│ POS interface                                    │
│ 1. Search customer                              │
│ 2. Select products + quantity                   │
│ 3. Click "Create Order"                         │
└──────────────────┬──────────────────────────────┘
                   │ API call
                   ↓
┌─ API SERVICE ────────────────────────────────────┐
│ axios.post('/pos/create-order', orderData)      │
│ Headers: Authorization: Bearer {adminToken}    │
└──────────────────┬──────────────────────────────┘
                   │ HTTP POST
                   ↓
┌─ SERVER ─────────────────────────────────────────┐
│ routes/pos.js                                   │
│   └─ POST /api/pos/create-order                 │
│       └─ middleware/auth.js (verify admin JWT)  │
│           └─ controller/pos.js                  │
│               ├─ Create order document          │
│               ├─ Create payment record          │
│               ├─ Update warehouse stock         │
│               └─ Return order + receipt data    │
└──────────────────┬──────────────────────────────┘
                   │ Response
                   ↓
┌─ ADMIN CLIENT ───────────────────────────────────┐
│ Display: "Order #ORD-001 created"              │
│ Show option: Print receipt / Process payment   │
└──────────────────────────────────────────────────┘
```

---

## 🔐 Security Best Practices

### 1. Password Hashing

```javascript
// Using bcrypt
const hashedPassword = bcrypt.hashSync(password, 10);
```

### 2. JWT Tokens

```javascript
// Token expires in 7 days
const token = jwt.sign(
  { _id: user._id, role: user.userRole },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
```

### 3. Middleware Protection

```javascript
// Only authenticated users can access
app.get("/api/order/:id", auth, controllerFunction);

// Only admins can access
app.put("/api/product/:id", auth, controllerFunction);
```

### 4. Input Validation

```javascript
// Validate before saving
const { error, value } = schema.validate(req.body);
if (error) return res.status(400).json({ error });
```

---

## 📡 API Response Format

### Success Response

```javascript
{
  status: 200,
  data: {
    id: "...",
    name: "...",
    ...
  },
  message: "Success"
}
```

### Error Response

```javascript
{
  status: 400,
  error: "Validation failed",
  details: { field: "error message" }
}
```

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone <repository-url>
cd ecom
```

### 2. Install Dependencies

**Server:**

```bash
cd server
npm install
```

**Client:**

```bash
cd client
npm install
```

**Admin Client:**

```bash
cd admin-client
npm install
```

### 3. Setup Environment Variables

**Server (.env):**

```
DATABASE=mongodb://localhost:27017/ecom
JWT_SECRET=your-secret-key-here
PORT=8000
NODE_ENV=development
```

**Client (.env):**

```
VITE_API_BASE_URL=http://localhost:8000/api
```

**Admin Client (.env):**

```
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### 4. Run Applications

**Server:**

```bash
cd server
npm start     # Production
npm run dev   # Development with nodemon
```

**Client (Customer):**

```bash
cd client
npm run dev   # Vite dev server
```

**Admin Client:**

```bash
cd admin-client
npm start     # Create-react-app dev server
```

### 5. Access Applications

- Client: http://localhost:5173 (Vite)
- Admin: http://localhost:3000 (Create-react-app)
- Server API: http://localhost:8000/api

---

## 📚 Additional Resources

- [Redux Saga Documentation](https://redux-saga.js.org/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [JWT Documentation](https://jwt.io/)
- [Axios Documentation](https://axios-http.com/)

---

## ✅ Checklist Before Deployment

- [ ] All environment variables configured
- [ ] MongoDB connection verified
- [ ] JWT secret set securely
- [ ] File upload directory permissions set
- [ ] Multer configuration for image upload
- [ ] CORS enabled for all frontends
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] API endpoints tested
- [ ] Authentication flow tested
- [ ] Database indexes created

---

**Last Updated**: 13/11/2025  
**Version**: 2.0 (No Firebase)  
**Author**: Dev Team
