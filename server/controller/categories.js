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
    let cImage = req.file?.filename;
    const filePath = `../server/public/uploads/categories/${cImage}`;

    if (!cName || !cDescription || !cStatus) {
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err);
        }
        return res.json({ error: "All filled must be required" });
      });
    } else {
      cName = toTitleCase(cName);
      try {
        let checkCategoryExists = await categoryModel.findOne({ cName: cName });
        if (checkCategoryExists) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.log(err);
            }
            return res.json({ error: "Category already exists" });
          });
        } else {
          let newCategory = new categoryModel({
            cName,
            cDescription,
            cStatus,
            cImage,
          });
          await newCategory.save((err) => {
            if (!err) {
              return res.json({ success: "Category created successfully" });
            }
          });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postEditCategory(req, res) {
    let { cId, cDescription, cStatus } = req.body;
    if (!cId || !cDescription || !cStatus) {
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
}

const categoryController = new Category();
module.exports = categoryController;
