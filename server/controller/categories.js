const { toTitleCase } = require("../config/function");
const categoryModel = require("../models/categories");
const fs = require("fs");

class Category {
  async getAllCategory(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();
      const filter = q ? { cName: { $regex: q, $options: 'i' } } : {};

      const total = await categoryModel.countDocuments(filter);
      const Categories = await categoryModel
        .find(filter)
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.json({ Categories, total, page, limit });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async postAddCategory(req, res) {
    let { cName, cDescription, cStatus } = req.body;

    if (!cName || !cStatus) {
      return res.json({ error: "All filled must be required" });
    }

    cName = toTitleCase(cName);
    try {
      let checkCategoryExists = await categoryModel.findOne({ cName: cName });
      if (checkCategoryExists) {
        return res.json({ error: "Tên danh mục đã tồn tại" });
      } else {
        let newCategory = new categoryModel({
          cName,
          cDescription,
          cStatus,
        });
        await newCategory.save();
        return res.json({ success: "Category created successfully" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async postEditCategory(req, res) {
    let { cId, cDescription, cStatus } = req.body;
    if (!cId || !cStatus) {
      return res.json({ error: "All filled must be required" });
    }
    try {
      let editCategory = categoryModel.findByIdAndUpdate(cId, {
        cDescription,
        cStatus,
        updatedAt: Date.now(),
      });
      let edit = await editCategory.exec();
      if (edit) {
        return res.json({ success: "Category edit successfully" });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getDeleteCategory(req, res) {
    let { cId } = req.body;
    if (!cId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deletedCategoryFile = await categoryModel.findById(cId);
        const filePath = `../server/public/uploads/categories/${deletedCategoryFile.cImage}`;

        let deleteCategory = await categoryModel.findByIdAndDelete(cId);
        if (deleteCategory) {
          // Delete Image from uploads -> categories folder 
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
            }
            return res.json({ success: "Category deleted successfully" });
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  // ===========================
  // IMPORT / EXPORT
  // ===========================

  async getExportCategory(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");

      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();
      const type = req.query.type || 'all';

      const templateColumns = [
        { header: 'Name', key: 'cName', width: 30 },
        { header: 'Description', key: 'cDescription', width: 40 },
        { header: 'Status', key: 'cStatus', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 20 },
      ];

      if (type === 'template') {
        const buffer = await excelHandler.generateExcel([], templateColumns, 'Categories Template');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=categories_template.xlsx`);
        return res.send(buffer);
      }

      let filter = { cStatus: 'Active' };
      if (type === 'filtered') {
        if (q) filter.cName = { $regex: q, $options: 'i' };
      } else {
        filter = {}; // Export all, regardless of status or search? Or just all Active? 
        // Requirement: "export all or export filtered". 
        // "All" usually means everything in DB.
      }

      const categories = await categoryModel.find(filter).sort({ _id: -1 });

      const data = categories.map(c => ({
        cName: c.cName,
        cDescription: c.cDescription || '',
        cStatus: c.cStatus,
        createdAt: c.createdAt ? c.createdAt.toISOString().split('T')[0] : ''
      }));

      const columns = [
        { header: 'Name', key: 'cName', width: 30 },
        { header: 'Description', key: 'cDescription', width: 40 },
        { header: 'Status', key: 'cStatus', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 },
      ];

      const buffer = await excelHandler.generateExcel(data, columns, 'Categories');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=categories_${type}_${Date.now()}.xlsx`);
      return res.send(buffer);

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async postImportCategory(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");
      // toTitleCase is imported at top

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const buffer = fs.readFileSync(req.file.path);

      const columnMapping = {
        'Name': 'cName',
        'Description': 'cDescription',
        'Status': 'cStatus',
      };

      const records = await excelHandler.parseExcel(buffer, columnMapping);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const record of records) {
        try {
          if (!record.cName) continue;

          let name = toTitleCase(String(record.cName));
          let status = record.cStatus || 'Active';
          let description = record.cDescription || '';

          const existing = await categoryModel.findOne({ cName: name });

          if (existing) {
            // Update? Or Skip? Usually Import implies Update if exists or Create if not.
            // But existing logic says "Category already exists" on create.
            // Let's UPDATE description/status if exists.
            await categoryModel.findByIdAndUpdate(existing._id, {
              cDescription: description,
              cStatus: status,
              updatedAt: Date.now()
            });
            successCount++;
          } else {
            const newCategory = new categoryModel({
              cName: name,
              cDescription: description,
              cStatus: status
            });
            await newCategory.save();
            successCount++;
          }

        } catch (err) {
          console.log(err);
          errorCount++;
          errors.push(`Error importing ${record.cName}: ${err.message}`);
        }
      }

      // Cleanup
      fs.unlinkSync(req.file.path);

      return res.json({
        success: true,
        message: `Imported ${successCount} categories successfully. ${errorCount} errors.`,
        errors
      });

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

const categoryController = new Category();
module.exports = categoryController;
