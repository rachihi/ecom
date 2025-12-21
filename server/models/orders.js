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
    },
    user: {
      type: ObjectId,
      ref: "users",
      required: false,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "Pending",
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ],
    },
    paymentStatus: {
      type: String,
      default: "Unpaid",
      enum: ["Unpaid", "Partial", "Paid"],
    },
    paymentMethod: {
      type: String,
      default: "Cash",
      enum: ["Cash", "BankTransfer", "Card"],
    },
  },
  { timestamps: true }
);

const orderModel = mongoose.model("orders", orderSchema);
module.exports = orderModel;
