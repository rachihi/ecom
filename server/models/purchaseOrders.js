const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const purchaseOrderItemSchema = new mongoose.Schema(
  {
    product: { type: ObjectId, ref: "products", required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, unique: true }, // Mã đơn hàng tự động (PO-YYYYMMDD-XXXX)
    supplier: { type: ObjectId, ref: "suppliers", required: true },
    items: [purchaseOrderItemSchema], // DEPRECATED: Keep for backward compatibility, use purchaseorderdetails table instead
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Pending", "Completed", "Cancelled"], default: "Pending" }, // Đang giao dịch, Hoàn thành, Hủy
    warehouseStatus: { type: String, enum: ["NotReceived", "Received"], default: "NotReceived" }, // Chưa nhập, Đã nhập
    paymentStatus: { type: String, enum: ["Unpaid", "Partial", "Paid"], default: "Unpaid" }, // Chưa thanh toán, Thanh toán 1 phần, Đã thanh toán
  },
  { timestamps: true }
);

const purchaseOrderModel = mongoose.model("purchaseorders", purchaseOrderSchema);
module.exports = purchaseOrderModel;


