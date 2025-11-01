const customerModel = require("../models/customers");

class CustomersController {
  async list(req, res) {
    try {
      const customers = await customerModel.find({}).populate("user", "name email").sort({ _id: -1 });
      return res.json({ customers });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getById(req, res) {
    const { id } = req.params;
    try {
      const customer = await customerModel.findById(id).populate("user", "name email");
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      return res.json({ customer });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req, res) {
    const { user, fullName, phoneNumber, email, address, taxCode } = req.body;
    if (!fullName || !phoneNumber || !email || !address) {
      return res.json({ message: "All filled must be required" });
    }
    try {
      const newCustomer = new customerModel({ user: user || null, fullName, phoneNumber, email, address, taxCode: taxCode || null });
      const saved = await newCustomer.save();
      if (saved) return res.json({ success: "Customer created successfully", customer: saved });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { user, fullName, phoneNumber, email, address, taxCode } = req.body;
    try {
      const updated = await customerModel.findByIdAndUpdate(
        id,
        { user: user || null, fullName, phoneNumber, email, address, taxCode: taxCode || null, updatedAt: Date.now() },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Customer not found" });
      return res.json({ success: "Customer updated successfully", customer: updated });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async remove(req, res) {
    const { id } = req.params;
    try {
      const deleted = await customerModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Customer not found" });
      return res.json({ success: "Customer deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new CustomersController();


