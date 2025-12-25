const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, unique: true }, // Mã đơn hàng tự động (ORD-YYYYMMDD-XXXX)
    customer: {
      type: ObjectId,
      ref: "customers",
      required: false,
      default: null,
      // Khách hàng đã đăng ký (nếu có)
    },
    user: {
      type: ObjectId,
      ref: "users",
      required: false,
      default: null,
      // Người dùng thực hiện đơn (nếu có)
    },
    amount: {
      type: Number,
      required: true,
      // Tổng giá trị đơn hàng
    },
    transactionId: {
      type: String,
      required: true,
      // Mã giao dịch (thường dùng cho thanh toán online)
    },
    address: {
      type: String,
      required: true,
      // Địa chỉ giao hàng
    },
    phone: {
      type: Number,
      required: true,
      // Số điện thoại nhận hàng
    },
    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",    // Chờ xử lý
        "Processing", // Đang xử lý
        "Shipped",    // Đang giao
        "Delivered",  // Đã giao
        "Cancelled",  // Đã huỷ
      ],
      // Trạng thái đơn hàng
    },
    paymentStatus: {
      type: String,
      default: "Unpaid",
      enum: ["Unpaid", "Partial", "Paid"],
      // Trạng thái thanh toán
    },
    paymentMethod: {
      type: String,
      default: "Cash",
      enum: ["Cash", "BankTransfer", "Card"],
      // Phương thức thanh toán
    },
  },
  { timestamps: true }
);

const orderModel = mongoose.model("orders", orderSchema);
module.exports = orderModel;
