/**
 * FURNITURE PRODUCT CONTROLLER
 * Xử lý tất cả các thao tác liên quan đến sản phẩm nội thất
 */

const productModel = require("../models/products");
const warehouseModel = require("../models/warehouses");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

class Product {

  // ===========================
  // CRUD OPERATIONS
  // ===========================

  static async getAllProduct(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 12, 100);
      const search = (req.query.search || req.query.q || "").trim();

      let filter = {};

      if (search) {
        filter.$or = [
          { pName: { $regex: search, $options: "i" } },
          { pDescription: { $regex: search, $options: "i" } },
          { pSKU: { $regex: search, $options: "i" } },
        ];
      }

      if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
        filter.pCategory = new mongoose.Types.ObjectId(req.query.category);
      }

      if (req.query.status) {
        filter.pStatus = { $in: [req.query.status, req.query.status.charAt(0).toUpperCase() + req.query.status.slice(1)] };
      }

      if (req.query.minPrice || req.query.maxPrice) {
        filter.pPrice = {};
        if (req.query.minPrice) {
          filter.pPrice.$gte = parseFloat(req.query.minPrice);
        }
        if (req.query.maxPrice) {
          filter.pPrice.$lte = parseFloat(req.query.maxPrice);
        }
      }

      if (req.query.isFeatured) {
        filter.isFeatured = true;
      }

      if (req.query.isRecommended) {
        filter.isRecommended = true;
      }

      let sortOption = { createdAt: -1 };
      if (req.query.sort) {
        switch (req.query.sort) {
          case "newest":
            sortOption = { createdAt: -1 };
            break;
          case "oldest":
            sortOption = { createdAt: 1 };
            break;
          case "popular":
            sortOption = { "warehouse.sold": -1 };
            break;
          case "price-low":
          case "price-asc":
            sortOption = { pPrice: 1 };
            break;
          case "price-high":
          case "price-desc":
            sortOption = { pPrice: -1 };
            break;
          default:
            sortOption = { createdAt: -1 };
        }
      }

      // Aggregation Pipeline
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "warehouses",
            localField: "_id",
            foreignField: "product",
            as: "warehouse",
          },
        },
        {
          $unwind: {
            path: "$warehouse",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            pQuantity: { $ifNull: ["$warehouse.quantity", 0] },
            pSold: { $ifNull: ["$warehouse.sold", 0] },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "pCategory",
            foreignField: "_id",
            as: "pCategory"
          }
        },
        {
          $unwind: {
            path: "$pCategory",
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: sortOption },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ];

      const productsRaw = await productModel.aggregate(pipeline);
      const total = await productModel.countDocuments(filter);

      const priceStats = await productModel.aggregate([
        { $match: { pStatus: 'Active' } },
        {
          $group: {
            _id: null,
            min: { $min: "$pPrice" },
            max: { $max: "$pPrice" }
          }
        }
      ]);
      const minPrice = priceStats.length > 0 ? priceStats[0].min : 0;
      const maxPrice = priceStats.length > 0 ? priceStats[0].max : 0;

      // Keep images as stored
      const products = productsRaw.map((p) => ({
        ...p,
        id: p._id // Ensure id field presence if needed
      }));

      return res.json({
        success: true,
        products,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
        minPrice,
        maxPrice
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getSingleProduct(req, res) {
    try {
      const { pId } = req.body;

      if (!pId) {
        return res.status(400).json({ error: "Product ID required" });
      }

      const product = await productModel
        .findById(pId)
        .populate("pCategory", "_id cName")
        .lean();

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const warehouse = await warehouseModel.findOne({ product: pId });
      product.pQuantity = warehouse ? warehouse.quantity : 0;
      product.pSold = warehouse ? warehouse.sold : 0;

      await productModel.findByIdAndUpdate(pId, { $inc: { view_count: 1 } });

      return res.json({
        success: true,
        data: product,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async postAddProduct(req, res) {
    try {
      const {
        pName,
        pDescription,
        pShortDescription,
        pPrice,
        pCost,
        pQuantity,
        pCategory,
        pDiscount,
        pStatus,
        pSKU,
        furniture,
        isFeatured,
        isRecommended,
        isNewProduct,
        isBestseller,
        isOnSale,
      } = req.body;


      if (!pName || !pPrice || !pCost || !pCategory || !pStatus || !pSKU) {
        return res.json({ error: "All required fields must be filled" });
      }


      let images = req.body.images;

      const thumbnailImage = req.body.images.length > 0 ? req.body.images[0] : undefined;


      let furnitureData = {};
      if (furniture) {
        try {
          furnitureData = typeof furniture === "string" ? JSON.parse(furniture) : furniture;
        } catch (e) {
          console.warn("Could not parse furniture data");
        }
      }

      const newProduct = new productModel({
        pName,
        pDescription,
        pShortDescription,
        pPrice,
        pCost,
        pCategory,
        pDiscount: pDiscount || 0,
        pStatus,
        pSKU,
        images,
        thumbnailImage,
        furniture: furnitureData,
        isFeatured,
        isRecommended,
        isNewProduct,
        isBestseller,
        isOnSale,
      });

      const savedProduct = await newProduct.save();

      // Create/Update Warehouse
      const location = req.body.location || null;
      await warehouseModel.findOneAndUpdate(
        { product: savedProduct._id },
        {
          quantity: pQuantity || 0,
          sold: 0,
          location: location,
          lastUpdated: Date.now()
        },
        { upsert: true }
      );


      return res.json({
        success: "Product created successfully",
        data: { _id: savedProduct._id, pSKU: savedProduct.pSKU },
      });
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        if (err.keyPattern && err.keyPattern.pSlug) {
          return res.status(400).json({ error: "Tên sản phẩm đã tồn tại" });
        }
        if (err.keyPattern && err.keyPattern.pSKU) {
          return res.status(400).json({ error: "Mã sản phẩm (SKU) đã tồn tại" });
        }
        return res.status(400).json({ error: "Dữ liệu bị trùng lặp (SKU hoặc Tên)" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async editProduct(req, res) {
    try {
      const {
        pId,
        pName,
        pDescription,
        pShortDescription,
        pSKU,
        pPrice,
        pCost,
        pComparePrice,
        pCategory,
        pDiscount,
        isFeatured,
        isRecommended,
        isNewProduct,
        isBestseller,
        isOnSale,
        pStatus,
        furniture,
      } = req.body;

      if (!pId) {
        return res.json({ error: "Product ID required" });
      }
      if (!pName || !pDescription || !pPrice || !pCategory || !pStatus) {
        return res.json({ error: "All required fields must be filled" });
      }
      // Không required ảnh nữa

      const existingProduct = await productModel.findById(pId);

      if (!existingProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updateData = {
        pName,
        pDescription,
        pShortDescription,
        pSKU,
        pPrice,
        pCost,
        pComparePrice,
        isFeatured,
        isRecommended,
        isNewProduct,
        isBestseller,
        isOnSale,
        pDiscount: pDiscount || 0,
        pStatus,
        pCategory
      };

      const thumbnailImage = req.body.images.length > 0 ? req.body.images[0] : undefined;

      // Cập nhật dữ liệu
      updateData.thumbnailImage = thumbnailImage;
      updateData.images = req.body.images;
      if (furniture) {
        try {
          let furnitureData = typeof furniture === "string" ? JSON.parse(furniture) : furniture;
          updateData.furniture = furnitureData;
        } catch (e) {
          console.warn("Could not parse furniture data");
        }
      }

      const updatedProduct = await productModel.findByIdAndUpdate(
        pId,
        updateData,
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      return res.json({
        success: "Product updated successfully",
        data: updatedProduct,
      });
    } catch (err) {
      console.error(err);
      if (err.code === 11000) {
        if (err.keyPattern && err.keyPattern.pSlug) {
          return res.status(400).json({ error: "Tên sản phẩm đã tồn tại" });
        }
        if (err.keyPattern && err.keyPattern.pSKU) {
          return res.status(400).json({ error: "Mã sản phẩm (SKU) đã tồn tại" });
        }
        return res.status(400).json({ error: "Dữ liệu bị trùng lặp (SKU hoặc Tên)" });
      }
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getDeleteProduct(req, res) {
    try {
      const { pId } = req.body;
      const warehouseModel = require("../models/warehouses"); // Import warehouse model

      if (!pId) {
        return res.json({ error: "Product ID required" });
      }

      const product = await productModel.findById(pId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Delete associated warehouse data
      await warehouseModel.deleteOne({ product: pId });
      await productModel.findByIdAndDelete(pId);

      return res.json({ success: "Product deleted successfully" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ===========================
  // FILTERING & SEARCH
  // images = images.map(img => `${SERVER_URL}/uploads/products/${img}`);
  // ===========================

  static async getProductByCategory(req, res) {
    try {
      const { categoryId, limit = 12, page = 1 } = req.body;

      if (!categoryId) {
        return res.json({ error: "Category ID required" });
      }

      const skip = (page - 1) * limit;

      const total = await productModel.countDocuments({
        pCategory: categoryId,
        pStatus: { $in: ["active", "Active"] },
      });

      const products = await productModel
        .find({ pCategory: categoryId, pStatus: { $in: ["active", "Active"] } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        data: { products, total, page, limit },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getProductByPrice(req, res) {
    try {
      const { minPrice, maxPrice, limit = 12, page = 1 } = req.body;

      const skip = (page - 1) * limit;

      const filter = {
        pStatus: { $in: ["active", "Active"] },
        pPrice: { $gte: minPrice, $lte: maxPrice },
      };

      const total = await productModel.countDocuments(filter);

      const products = await productModel
        .find(filter)
        .sort({ pPrice: 1 })
        .skip(skip)
        .limit(limit);

      return res.json({
        success: true,
        data: { products, total, page, limit },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ===========================
  // REVIEWS & RATINGS
  // ===========================

  static async postAddReview(req, res) {
    try {
      const { pId, rating, title, review, userId } = req.body;

      if (!pId || !rating || !review) {
        return res.json({ error: "Product ID, rating, and review are required" });
      }

      const newReview = {
        rating,
        title,
        review,
        user: userId,
        createdAt: new Date(),
      };

      const product = await productModel.findByIdAndUpdate(
        pId,
        { $push: { pRatingsReviews: newReview } },
        { new: true }
      );

      return res.json({
        success: "Review added successfully",
        data: product,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async deleteReview(req, res) {
    try {
      const { pId, reviewId } = req.body;

      if (!pId || !reviewId) {
        return res.json({ error: "Product ID and Review ID required" });
      }

      const product = await productModel.findByIdAndUpdate(
        pId,
        { $pull: { pRatingsReviews: { _id: reviewId } } },
        { new: true }
      );

      return res.json({
        success: "Review deleted successfully",
        data: product,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ===========================
  // UTILITY METHODS
  // ===========================

  static async getBestsellers(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 12;
      // Use aggregation for bestsellers
      const products = await productModel.aggregate([
        { $match: { pStatus: "active", isBestseller: true } },
        {
          $lookup: {
            from: "warehouses",
            localField: "_id",
            foreignField: "product",
            as: "warehouse",
          },
        },
        {
          $unwind: { path: "$warehouse", preserveNullAndEmptyArrays: true }
        },
        { $sort: { "warehouse.sold": -1 } },
        { $limit: limit }
      ]);
      return res.json({ success: true, data: products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getNewProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 12;
      const days = parseInt(req.query.days) || 30;
      const products = await productModel.findNewProducts(limit, days);
      return res.json({ success: true, data: products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getTopRated(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 12;
      const products = await productModel.findTopRated(limit);
      return res.json({ success: true, data: products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
  static async getTopRated(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 12;
      const products = await productModel.findTopRated(limit);
      return res.json({ success: true, data: products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // ===========================
  // IMPORT / EXPORT
  // ===========================

  static async getExportProduct(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");
      const categoryModel = require("../models/categories");

      let filter = {};
      const type = req.query.type || 'all';

      // Define columns for template (and export)
      const templateColumns = [
        { header: 'Product Name', key: 'pName', width: 30 },
        { header: 'Description', key: 'pDescription', width: 30 },
        { header: 'Price', key: 'pPrice', width: 15 },
        { header: 'Cost', key: 'pCost', width: 15 },
        { header: 'Quantity', key: 'pQuantity', width: 15 },
        { header: 'Category', key: 'pCategory', width: 20 },
        { header: 'Product Code', key: 'pSKU', width: 20 },
        { header: 'Status', key: 'pStatus', width: 15 },
        { header: 'Offer', key: 'pOffer', width: 10 },
      ];

      if (type === 'template') {
        const buffer = await excelHandler.generateExcel([], templateColumns, 'Products Template');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=products_template.xlsx`);
        return res.send(buffer);
      }

      if (type === 'filtered') {
        // Reuse filter logic from getAllProduct
        const search = (req.query.search || req.query.q || "").trim();
        if (search) {
          filter.$or = [
            { pName: { $regex: search, $options: "i" } },
            { pDescription: { $regex: search, $options: "i" } },
            { pSKU: { $regex: search, $options: "i" } },
          ];
        }
        if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
          filter.pCategory = new mongoose.Types.ObjectId(req.query.category);
        }
        if (req.query.status) {
          filter.pStatus = { $in: [req.query.status, req.query.status.charAt(0).toUpperCase() + req.query.status.slice(1)] };
        }
      }

      // We need to look up category names and warehouse quantities
      // Reusing aggregation pipeline for data consistency
      const pipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "warehouses",
            localField: "_id",
            foreignField: "product",
            as: "warehouse",
          },
        },
        {
          $unwind: {
            path: "$warehouse",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            pQuantity: { $ifNull: ["$warehouse.quantity", 0] },
            pSold: { $ifNull: ["$warehouse.sold", 0] },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "pCategory",
            foreignField: "_id",
            as: "pCategoryVal" // Rename to avoid conflict if any, though usually fine
          }
        },
        {
          $unwind: {
            path: "$pCategoryVal",
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { createdAt: -1 } }
      ];

      const products = await productModel.aggregate(pipeline);

      const data = products.map(p => ({
        pName: p.pName,
        pSKU: p.pSKU,
        pCategory: p.pCategoryVal ? p.pCategoryVal.cName : '',
        pPrice: p.pPrice,
        pCost: p.pCost,
        pQuantity: p.pQuantity,
        pStatus: p.pStatus,
        pDescription: p.pDescription || '',
        pShortDescription: p.pShortDescription || '',
        // Furniture details
        material_primary: p.furniture?.material?.primary || '',
        material_secondary: p.furniture?.material?.secondary ? p.furniture.material.secondary.join(', ') : '',
        dim_length: p.furniture?.dimensions?.length || 0,
        dim_width: p.furniture?.dimensions?.width || 0,
        dim_height: p.furniture?.dimensions?.height || 0,
        dim_depth: p.furniture?.dimensions?.depth || 0,
        isFeatured: p.isFeatured ? 'Yes' : 'No',
        isNewProduct: p.isNewProduct ? 'Yes' : 'No',
        isBestseller: p.isBestseller ? 'Yes' : 'No'
      }));

      const columns = [
        { header: 'Name', key: 'pName', width: 30 },
        { header: 'SKU', key: 'pSKU', width: 15 },
        { header: 'Category', key: 'pCategory', width: 20 },
        { header: 'Price', key: 'pPrice', width: 15 },
        { header: 'Cost', key: 'pCost', width: 15 },
        { header: 'Quantity', key: 'pQuantity', width: 15 },
        { header: 'Status', key: 'pStatus', width: 15 },
        { header: 'Description', key: 'pDescription', width: 40 },
        { header: 'Short Desc', key: 'pShortDescription', width: 30 },
        { header: 'Material (Primary)', key: 'material_primary', width: 20 },
        { header: 'Material (Secondary)', key: 'material_secondary', width: 20 },
        { header: 'Length', key: 'dim_length', width: 10 },
        { header: 'Width', key: 'dim_width', width: 10 },
        { header: 'Height', key: 'dim_height', width: 10 },
        { header: 'Depth', key: 'dim_depth', width: 10 },
        { header: 'Featured', key: 'isFeatured', width: 10 },
        { header: 'New', key: 'isNewProduct', width: 10 },
        { header: 'Bestseller', key: 'isBestseller', width: 10 },
      ];

      const buffer = await excelHandler.generateExcel(data, columns, 'Products');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=products_${type}_${Date.now()}.xlsx`);
      return res.send(buffer);

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async postImportProduct(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");
      const categoryModel = require("../models/categories");

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const buffer = fs.readFileSync(req.file.path);

      const columnMapping = {
        'Product Name': 'pName',
        'Name': 'pName', // Fallback
        'Product Code': 'pSKU',
        'SKU': 'pSKU', // Fallback
        'Category': 'pCategoryName',
        'Price': 'pPrice',
        'Cost': 'pCost',
        'Quantity': 'pQuantity',
        'Status': 'pStatus',
        'Description': 'pDescription',
        'Short Desc': 'pShortDescription',
        'Offer': 'pOffer',
        'Material (Primary)': 'material_primary',
        'Material (Secondary)': 'material_secondary',
        'Length': 'dim_length',
        'Width': 'dim_width',
        'Height': 'dim_height',
        'Depth': 'dim_depth',
        'Featured': 'isFeatured',
        'New': 'isNewProduct',
        'Bestseller': 'isBestseller',
      };

      const records = await excelHandler.parseExcel(buffer, columnMapping);

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const record of records) {
        try {
          if (!record.pName || !record.pPrice) continue;

          // Find Category
          let categoryId = null;
          if (record.pCategoryName) {
            const cat = await categoryModel.findOne({ cName: { $regex: new RegExp(`^${record.pCategoryName}$`, 'i') } });
            if (cat) categoryId = cat._id;
          }

          // If no category found but pCategoryName exists, maybe create it? 
          // For now, if no category found, skip or assign default? 
          // User requirement didn't specify, I will require category.
          if (!categoryId && record.pCategoryName) {
            // Optional: Create new category
            // const newCat = await new categoryModel({ cName: record.pCategoryName, cStatus: 'Active' }).save();
            // categoryId = newCat._id;
          }

          if (!categoryId) {
            // Try to find ANY category to assign as default if missing, or skip
            // errors.push(`Category ${record.pCategoryName} not found for ${record.pName}`);
            // continue;

            // Fallback: get first category
            const firstCat = await categoryModel.findOne();
            if (firstCat) categoryId = firstCat._id;
          }

          const productData = {
            pName: record.pName,
            pSKU: record.pSKU, // Will be auto-generated if missing by model pre-save
            pPrice: parseFloat(record.pPrice),
            pCost: parseFloat(record.pCost || 0),
            pCategory: categoryId,
            pStatus: record.pStatus || 'Active',
            pDescription: record.pDescription,
            pShortDescription: record.pShortDescription,
            furniture: {
              dimensions: {
                length: parseFloat(record.dim_length || 0),
                width: parseFloat(record.dim_width || 0),
                height: parseFloat(record.dim_height || 0),
                depth: parseFloat(record.dim_depth || 0),
              },
              material: {
                primary: record.material_primary,
                secondary: record.material_secondary ? String(record.material_secondary).split(',').map(s => s.trim()) : []
              }
            },
            isFeatured: record.isFeatured === 'Yes',
            isNewProduct: record.isNewProduct === 'Yes',
            isBestseller: record.isBestseller === 'Yes',
          };

          // Update or Create based on SKU
          if (record.pSKU) {
            const existing = await productModel.findOne({ pSKU: record.pSKU });
            if (existing) {
              await productModel.findByIdAndUpdate(existing._id, productData);
              // Update Warehouse
              await warehouseModel.findOneAndUpdate(
                { product: existing._id },
                { quantity: parseInt(record.pQuantity || 0) },
                { upsert: true }
              );
              successCount++;
              continue;
            }
          }

          // Create new
          const newProduct = new productModel(productData);
          const saved = await newProduct.save();
          // Create Warehouse
          await warehouseModel.findOneAndUpdate(
            { product: saved._id },
            { quantity: parseInt(record.pQuantity || 0), sold: 0 },
            { upsert: true }
          );
          successCount++;

        } catch (err) {
          console.error(err);
          errorCount++;
          errors.push(`Error importing ${record.pName}: ${err.message}`);
        }
      }

      // Cleanup uploaded file
      fs.unlinkSync(req.file.path);

      return res.json({
        success: true,
        message: `Imported ${successCount} products successfully. ${errorCount} errors.`,
        errors
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = Product;
