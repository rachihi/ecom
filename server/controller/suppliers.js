const supplierModel = require("../models/suppliers");
const fs = require("fs");

class SuppliersController {
  async list(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();

      const filter = q // Modified from 'const filter = q ? ...' to 'const filter = q ? ...'
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

  // ===========================
  // IMPORT / EXPORT
  // ===========================

  async getExportSupplier(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");
      // Reuse filter logic if needed, but usually search is passed
      const q = (req.query.q || '').trim();
      const type = req.query.type || 'all';

      const templateColumns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Tax Code', key: 'taxCode', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 },
      ];

      if (type === 'template') {
        const buffer = await excelHandler.generateExcel([], templateColumns, 'Suppliers Template');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=suppliers_template.xlsx`);
        return res.send(buffer);
      }

      let filter = {};
      if (type === 'filtered' && q) {
        filter = {
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { phone: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { address: { $regex: q, $options: 'i' } },
            { taxCode: { $regex: q, $options: 'i' } }
          ]
        };
      }

      const suppliers = await supplierModel.find(filter).sort({ _id: -1 });

      const data = suppliers.map(s => ({
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
        taxCode: s.taxCode || '',
        createdAt: s.createdAt ? s.createdAt.toISOString().split('T')[0] : ''
      }));

      const columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Address', key: 'address', width: 40 },
        { header: 'Tax Code', key: 'taxCode', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 },
      ];

      const buffer = await excelHandler.generateExcel(data, columns, 'Suppliers');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=suppliers_${type}_${Date.now()}.xlsx`);
      return res.send(buffer);

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async postImportSupplier(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const buffer = fs.readFileSync(req.file.path);

      const columnMapping = {
        'Name': 'name',
        'Phone': 'phone',
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
          if (!record.name || !record.phone || !record.email || !record.address) {
            continue; // Skip invalid
          }

          // Check existing email
          const existing = await supplierModel.findOne({ email: record.email });

          if (existing) {
            await supplierModel.findByIdAndUpdate(existing._id, {
              name: record.name,
              phone: record.phone,
              address: record.address,
              taxCode: record.taxCode,
              updatedAt: Date.now()
            });
            successCount++;
          } else {
            const newSupplier = new supplierModel({
              name: record.name,
              phone: record.phone,
              email: record.email,
              address: record.address,
              taxCode: record.taxCode
            });
            await newSupplier.save();
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
        message: `Imported ${successCount} suppliers successfully. ${errorCount} errors.`,
        errors
      });

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new SuppliersController();


