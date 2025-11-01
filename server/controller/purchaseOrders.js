const purchaseOrderModel = require("../models/purchaseOrders");
const warehouseModel = require("../models/warehouses");

class PurchaseOrdersController {
  async list(req, res) {
    try {
      const list = await purchaseOrderModel
        .find({})
        .populate("supplier")
        .populate("items.product", "pName pImages pPrice")
        .sort({ _id: -1 });
      return res.json({ purchaseOrders: list });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getById(req, res) {
    const { id } = req.params;
    try {
      const po = await purchaseOrderModel
        .findById(id)
        .populate("supplier")
        .populate("items.product", "pName pImages pPrice");
      if (!po) return res.status(404).json({ error: "Not found" });
      return res.json({ purchaseOrder: po });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req, res) {
    const { supplier, items, totalAmount, status } = req.body;
    if (!supplier || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return res.json({ message: "All filled must be required" });
    }
    try {
      const created = await new purchaseOrderModel({ supplier, items, totalAmount, status: status || "Draft" }).save();
      return res.json({ success: "Purchase order created", purchaseOrder: created });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async updateStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.json({ message: "All filled must be required" });
    try {
      const po = await purchaseOrderModel.findById(id);
      if (!po) return res.status(404).json({ error: "Not found" });
      const prevStatus = po.status;
      po.status = status;
      await po.save();
      // On Completed: increment stock
      if (prevStatus !== "Completed" && status === "Completed") {
        for (const it of po.items) {
          await warehouseModel.findOneAndUpdate(
            { product: it.product },
            { $inc: { quantity: it.quantity }, lastUpdated: Date.now() },
            { upsert: true }
          );
        }
      }
      return res.json({ success: "Status updated", purchaseOrder: po });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async remove(req, res) {
    const { id } = req.params;
    try {
      const deleted = await purchaseOrderModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      return res.json({ success: "Purchase order deleted" });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new PurchaseOrdersController();


