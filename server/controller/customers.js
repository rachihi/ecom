const customerModel = require("../models/customers");
const fs = require("fs");

class CustomersController {
  async list(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();

      const filter = q
        ? {
          $or: [
            { fullName: { $regex: q, $options: 'i' } },
            { phoneNumber: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
            { taxCode: { $regex: q, $options: 'i' } }
          ]
        }
        : {};

      const total = await customerModel.countDocuments(filter);
      const customers = await customerModel
        .find(filter)
        .populate('user', 'name email')
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.json({ customers, total, page, limit });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
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

  async getDeleteCustomer(req, res) {
    let { cId } = req.body;
    if (!cId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteCustomer = await customerModel.findByIdAndDelete(cId);
        if (deleteCustomer) {
          return res.json({ success: "Customer deleted successfully" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  // ===========================
  // IMPORT / EXPORT
  // ===========================

  async getExportCustomer(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");

      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();
      const type = req.query.type || 'all';

      const templateColumns = [
        { header: 'Full Name', key: 'fullName', width: 25 },
        { header: 'Phone', key: 'phoneNumber', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Tax Code', key: 'taxCode', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 },
      ];

      if (type === 'template') {
        const buffer = await excelHandler.generateExcel([], templateColumns, 'Customers Template');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=customers_template.xlsx`);
        return res.send(buffer);
      }

      let filter = {};
      if (type === 'filtered') {
        if (q) {
          filter.$or = [
            { fullName: { $regex: q, $options: 'i' } },
            { phoneNumber: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ];
        }
      }
      // If exported from Customer Page, usually no other filters except search?

      const customers = await customerModel.find(filter).sort({ _id: -1 });

      const data = customers.map(c => ({
        fullName: c.fullName,
        phoneNumber: c.phoneNumber,
        email: c.email,
        address: c.address || '',
        taxCode: c.taxCode || '',
        isRegistered: c.isRegistered ? 'Yes' : 'No',
        createdAt: c.createdAt ? c.createdAt.toISOString().split('T')[0] : ''
      }));

      const columns = [
        { header: 'Full Name', key: 'fullName', width: 25 },
        { header: 'Phone', key: 'phoneNumber', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Tax Code', key: 'taxCode', width: 15 },
        { header: 'Registered', key: 'isRegistered', width: 10 },
        { header: 'Created At', key: 'createdAt', width: 15 },
      ];

      const buffer = await excelHandler.generateExcel(data, columns, 'Customers');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=customers_${type}_${Date.now()}.xlsx`);
      return res.send(buffer);

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async postImportCustomer(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const buffer = fs.readFileSync(req.file.path);

      const columnMapping = {
        'Full Name': 'fullName',
        'Phone': 'phoneNumber',
        'Email': 'email',
        'Address': 'address',
        'Tax Code': 'taxCode'
      };

      const records = await excelHandler.parseExcel(buffer, columnMapping);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const record of records) {
        try {
          if (!record.fullName || !record.email || !record.phoneNumber) {
            // Skip invalid
            continue;
          }

          // Check existing email
          const existing = await customerModel.findOne({ email: record.email });

          if (existing) {
            // Update
            await customerModel.findByIdAndUpdate(existing._id, {
              fullName: record.fullName,
              phoneNumber: record.phoneNumber,
              address: record.address,
              taxCode: record.taxCode,
              updatedAt: Date.now()
            });
            successCount++;
          } else {
            const newCustomer = new customerModel({
              fullName: record.fullName,
              phoneNumber: record.phoneNumber,
              email: record.email,
              address: record.address,
              taxCode: record.taxCode,
              isRegistered: false // Imported customers are usually guests until they register/claim
            });
            await newCustomer.save();
            successCount++;
          }

        } catch (err) {
          console.log(err);
          errorCount++;
          errors.push(`Error importing ${record.email}: ${err.message}`);
        }
      }

      // Cleanup
      fs.unlinkSync(req.file.path);

      return res.json({
        success: true,
        message: `Imported ${successCount} customers successfully. ${errorCount} errors.`,
        errors
      });

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

const customersController = new CustomersController();
module.exports = customersController;
