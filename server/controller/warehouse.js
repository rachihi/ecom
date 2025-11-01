const warehouseModel = require("../models/warehouses");

class WarehouseController {
  async list(req, res) {
    try {
      const list = await warehouseModel.find({}).populate("product", "pName pImages pPrice pQuantity").sort({ _id: -1 });
      return res.json({ warehouses: list });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getByProduct(req, res) {
    const { productId } = req.params;
    try {
      const doc = await warehouseModel.findOne({ product: productId }).populate("product", "pName pImages pPrice pQuantity");
      if (!doc) return res.status(404).json({ error: "Not found" });
      return res.json({ warehouse: doc });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async upsert(req, res) {
    const { product, quantity, location } = req.body;
    if (!product) return res.json({ message: "All filled must be required" });
    try {
      const updated = await warehouseModel.findOneAndUpdate(
        { product },
        { $set: { location: location || null }, $setOnInsert: { quantity: quantity || 0 }, lastUpdated: Date.now() },
        { upsert: true, new: true }
      );
      if (typeof quantity === "number") {
        updated.quantity = quantity;
        updated.lastUpdated = Date.now();
        await updated.save();
      }
      return res.json({ success: "Warehouse updated", warehouse: updated });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async adjust(req, res) {
    const { product, delta } = req.body;
    if (!product || typeof delta !== "number") return res.json({ message: "All filled must be required" });
    try {
      const updated = await warehouseModel.findOneAndUpdate(
        { product },
        { $inc: { quantity: delta }, lastUpdated: Date.now() },
        { upsert: true, new: true }
      );
      return res.json({ success: "Stock adjusted", warehouse: updated });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new WarehouseController();


