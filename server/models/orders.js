const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, unique: true }, // Mã đơn hàng tự động (ORD-YYYYMMDD-XXXX)
    allProduct: [
      {
        id: { type: ObjectId, ref: "products" },
        quantitiy: Number,
      },
    ], // DEPRECATED: Keep for backward compatibility, use orderdetails table instead
    customer: {
      type: ObjectId,
      ref: "customers",
      required: false,
      default: null,
    },
    user: {
      type: ObjectId,
      ref: "users",
      required: true,
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
      default: "Not processed",
      enum: [
        "Not processed",
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
  },
  { timestamps: true }
);

const orderModel = mongoose.model("orders", orderSchema);
module.exports = orderModel;
