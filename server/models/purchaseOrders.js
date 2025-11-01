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
    supplier: { type: ObjectId, ref: "suppliers", required: true },
    items: [purchaseOrderItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["Draft", "Completed", "Cancelled"], default: "Draft" },
  },
  { timestamps: true }
);

const purchaseOrderModel = mongoose.model("purchaseorders", purchaseOrderSchema);
module.exports = purchaseOrderModel;


