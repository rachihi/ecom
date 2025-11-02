const supplierModel = require("../models/suppliers");

class SuppliersController {
  async list(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();

      const filter = q
        ? {
            $or: [
              { name: { $regex: q, $options: 'i' } },
              { phone: { $regex: q, $options: 'i' } },
              { email: { $regex: q, $options: 'i' } },
              { address: { $regex: q, $options: 'i' } },
              { taxCode: { $regex: q, $options: 'i' } }
            ]
          }
        : {};

      const total = await supplierModel.countDocuments(filter);
      const suppliers = await supplierModel
        .find(filter)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.json({ suppliers, total, page, limit });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
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


