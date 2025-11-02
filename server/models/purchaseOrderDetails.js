const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const purchaseOrderDetailSchema = new mongoose.Schema(
  {
    purchaseOrder: { type: ObjectId, ref: "purchaseorders", required: true },
    productId: { type: ObjectId, ref: "products", required: false }, // Reference for tracking only, can be null if product deleted
    productName: { type: String, required: true }, // Snapshot at purchase time
    productImage: { type: String }, // Snapshot at purchase time
    productPrice: { type: Number, required: true }, // Snapshot at purchase time (purchase price)
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true }, // quantity * productPrice
  },
  { timestamps: true }
);

const purchaseOrderDetailModel = mongoose.model("purchaseorderdetails", purchaseOrderDetailSchema);
module.exports = purchaseOrderDetailModel;

