const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const warehouseSchema = new mongoose.Schema(
  {
    product: { type: ObjectId, ref: "products", required: true, unique: true }, // Tham chiếu 1-1 với Product
    quantity: { type: Number, required: true, default: 0 }, // Số lượng tồn kho hiện tại
    sold: { type: Number, default: 0 }, // Tổng số lượng đã bán (theo dõi inventory)
    location: { type: String, default: null }, // Vị trí kho (VD: Kệ A, Hàng 1)
    lastUpdated: { type: Date, default: Date.now }, // Thời gian cập nhật kho gần nhất
  },
  { timestamps: true }
);

const warehouseModel = mongoose.model("warehouses", warehouseSchema);
module.exports = warehouseModel;


