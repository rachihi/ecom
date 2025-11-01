const supplierModel = require("../models/suppliers");

class SuppliersController {
  async list(req, res) {
    try {
      const suppliers = await supplierModel.find({}).sort({ _id: -1 });
      return res.json({ suppliers });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getById(req, res) {
    const { id } = req.params;
    try {
      const supplier = await supplierModel.findById(id);
      if (!supplier) return res.status(404).json({ error: "Supplier not found" });
      return res.json({ supplier });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req, res) {
    const { name, phone, email, address, taxCode } = req.body;
    if (!name || !phone || !email || !address) return res.json({ message: "All filled must be required" });
    try {
      const created = await new supplierModel({ name, phone, email, address, taxCode: taxCode || null }).save();
      return res.json({ success: "Supplier created successfully", supplier: created });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { name, phone, email, address, taxCode } = req.body;
    try {
      const updated = await supplierModel.findByIdAndUpdate(
        id,
        { name, phone, email, address, taxCode: taxCode || null, updatedAt: Date.now() },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Supplier not found" });
      return res.json({ success: "Supplier updated successfully", supplier: updated });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async remove(req, res) {
    const { id } = req.params;
    try {
      const deleted = await supplierModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Supplier not found" });
      return res.json({ success: "Supplier deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new SuppliersController();


