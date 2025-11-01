const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const warehouseSchema = new mongoose.Schema(
  {
    product: { type: ObjectId, ref: "products", required: true, unique: true },
    quantity: { type: Number, required: true, default: 0 },
    location: { type: String, default: null },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const warehouseModel = mongoose.model("warehouses", warehouseSchema);
module.exports = warehouseModel;


