# Authentication Separation Guide

## Tổng quan

Hệ thống authentication đã được tách riêng cho **Admin** và **Customer**:

---

## 🔐 Kiến trúc Authentication

### 1. Admin Authentication (client-admin)

**Bảng**: `users`
**API Endpoints**:
- `POST /api/user/signin` - Admin đăng nhập
- `POST /api/user/signup` - Admin đăng ký (chỉ dùng lần đầu)

**Token**: JWT với `role: "Admin"` hoặc `"Employee"`

**Middleware**: `server/middleware/auth.js`

**Sử dụng**: Admin quản lý hệ thống (POS, kho, nhà cung cấp, đơn hàng, v.v.)

---

### 2. Customer Authentication (client)

**Bảng**: `customers`
**API Endpoints**:
- `POST /api/customer/signin` - Khách hàng đăng nhập
- `POST /api/customer/signup` - Khách hàng đăng ký
- `GET /api/customer/profile` - Lấy thông tin khách hàng

**Token**: JWT với `role: "CUSTOMER"`

**Middleware**: `server/middleware/customerAuth.js`

**Sử dụng**: Khách hàng mua sắm, xem lịch sử đơn hàng

---

## 📊 So sánh

| Tính năng | Admin | Customer |
|-----------|-------|----------|
| **Bảng** | `users` | `customers` |
| **API Prefix** | `/api/user/` | `/api/customer/` |
| **Role** | Admin/Employee | CUSTOMER |
| **Middleware** | `auth.js` | `customerAuth.js` |
| **Client App** | client-admin (port 3000) | client (port 5173) |
| **Chức năng** | Quản lý hệ thống | Mua sắm, xem đơn hàng |

---

## 🗄️ Database Schema

### Bảng `customers` (Updated)

```javascript
{
  _id: ObjectId,
  fullName: String (required),
  phoneNumber: String (required),
  email: String (required, unique),
  address: String (optional),
  taxCode: String (optional),
  
  // Auth fields
  password: String (hashed, null for guest),
  isRegistered: Boolean (true if has account, false if guest),
  lastLogin: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

**Phân biệt**:
- `isRegistered: true` → Khách hàng có tài khoản (có password)
- `isRegistered: false` → Khách vãng lai (không có password)

---

## 🔧 Backend Implementation

### 1. Controller: `server/controller/customerAuth.js`

```javascript
class CustomerAuth {
  // POST /api/customer/signup
  async signup(req, res) {
    // Validate: fullName, email, password, phoneNumber
    // Hash password
    // Create customer with isRegistered: true
    // Return JWT token
  }

  // POST /api/customer/signin
  async signin(req, res) {
    // Validate: email, password
    // Check customer exists and isRegistered: true
    // Verify password
    // Update lastLogin
    // Return JWT token
  }

  // GET /api/customer/profile
  async getProfile(req, res) {
    // Get customer from req.customerDetails (from middleware)
    // Return customer data (exclude password)
  }
}
```

### 2. Middleware: `server/middleware/customerAuth.js`

```javascript
const customerAuthMiddleware = (req, res, next) => {
  // Extract token from Authorization header
  // Verify JWT token
  // Check role === "CUSTOMER"
  // Attach customerDetails to req
  // Call next()
}
```

### 3. Routes: `server/routes/customerAuth.js`

```javascript
router.post("/signup", customerAuthController.signup);
router.post("/signin", customerAuthController.signin);
router.get("/profile", customerAuthMiddleware, customerAuthController.getProfile);
```

---

## 💻 Frontend Implementation (client)

### 1. API Service: `client/src/services/api.js`

```javascript
export const authAPI = {
  signin: (email, password) => 
    api.post('/customer/signin', { email, password }),
  
  signup: (fullName, email, password, phoneNumber, address) => 
    api.post('/customer/signup', { fullName, email, password, phoneNumber, address }),
  
  signout: () => {
    localStorage.removeItem('serviceToken');
    return Promise.resolve({ success: true });
  },
  
  getProfile: () => 
    api.get('/customer/profile'),
};
```

### 2. Auth Saga: `client/src/redux/sagas/authSaga.js`

**SIGNIN**:
```javascript
const response = yield call(authAPI.signin, email, password);
localStorage.setItem('serviceToken', response.data.token);

const user = {
  id: response.data.customer._id,
  fullname: response.data.customer.fullName,
  email: response.data.customer.email,
  phoneNumber: response.data.customer.phoneNumber,
  role: 'CUSTOMER',
};

yield put(setProfile(user));
```

**SIGNUP**:
```javascript
const response = yield call(authAPI.signup, fullName, email, password, phoneNumber, address);
localStorage.setItem('serviceToken', response.data.token);
// Similar to signin
```

### 3. Checkout: `client/src/views/checkout/step3/index.jsx`

```javascript
// If customer logged in
if (profile && profile.id) {
  orderData.customerId = profile.id;
} else {
  // Guest customer
  orderData.customer = {
    fullName: shipping.fullname,
    phoneNumber: shipping.mobile,
    email: shipping.email,
    address: shipping.address,
  };
}
```

---

## 🔄 Luồng hoạt động

### Customer Sign Up

```
1. Customer nhập: fullName, email, password, phoneNumber, address
2. POST /api/customer/signup
3. Backend:
   - Validate input
   - Check email chưa tồn tại
   - Hash password
   - Create customer với isRegistered: true
   - Generate JWT token (role: CUSTOMER)
4. Frontend:
   - Lưu token vào localStorage
   - Lưu customer profile vào Redux
   - Redirect về trang chủ
```

### Customer Sign In

```
1. Customer nhập: email, password
2. POST /api/customer/signin
3. Backend:
   - Validate input
   - Find customer với email và isRegistered: true
   - Verify password
   - Update lastLogin
   - Generate JWT token (role: CUSTOMER)
4. Frontend:
   - Lưu token vào localStorage
   - Lưu customer profile vào Redux
   - Redirect về trang chủ
```

### Guest Checkout (không đăng nhập)

```
1. Customer thêm sản phẩm vào giỏ
2. Checkout → Nhập thông tin giao hàng
3. POST /api/order/create-order
   - Không có customerId
   - Gửi customer object { fullName, phoneNumber, email, address }
4. Backend:
   - Tạo customer mới với isRegistered: false (guest)
   - Tạo order với customer._id
```

### Logged-in Checkout (đã đăng nhập)

```
1. Customer đã đăng nhập (có token)
2. Checkout → Thông tin tự động điền từ profile
3. POST /api/order/create-order
   - Gửi customerId (từ profile.id)
4. Backend:
   - Sử dụng customer hiện có
   - Tạo order với customerId
```

---

## 🧪 Testing

### Test Customer Signup

```bash
curl -X POST http://localhost:8000/api/customer/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyen Van A",
    "email": "customer@example.com",
    "password": "password123",
    "phoneNumber": "0123456789",
    "address": "123 Street, City"
  }'
```

### Test Customer Signin

```bash
curl -X POST http://localhost:8000/api/customer/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

### Test Get Profile

```bash
curl -X GET http://localhost:8000/api/customer/profile \
  -H "Authorization: Bearer <token>"
```

---

## ✅ Checklist

- [x] Sửa model `customers` - Thêm password, isRegistered, lastLogin
- [x] Tạo controller `customerAuth.js` - signup, signin, getProfile
- [x] Tạo middleware `customerAuth.js` - Verify customer token
- [x] Tạo routes `customerAuth.js` - /api/customer/*
- [x] Thêm routes vào `app.js`
- [x] Sửa client API - Dùng /api/customer/* endpoints
- [x] Sửa authSaga - Xử lý customer response format
- [x] Sửa checkout - Gửi customerId nếu đã đăng nhập

---

## 🚀 Next Steps

- [ ] Tạo trang Sign Up/Sign In UI cho client
- [ ] Tạo trang Customer Profile
- [ ] Tạo trang Order History (lịch sử đơn hàng)
- [ ] Thêm "Forgot Password" cho customer
- [ ] Thêm email verification

