const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const orderDetailSchema = new mongoose.Schema(
  {
    order: { type: ObjectId, ref: "orders", required: true },
    productId: { type: ObjectId, ref: "products", required: false }, // Reference for tracking only, can be null if product deleted
    productName: { type: String, required: true }, // Snapshot at order time
    productImage: { type: String }, // Snapshot at order time
    productPrice: { type: Number, required: true }, // Snapshot at order time
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true }, // quantity * productPrice
  },
  { timestamps: true }
);

const orderDetailModel = mongoose.model("orderdetails", orderDetailSchema);
module.exports = orderDetailModel;

