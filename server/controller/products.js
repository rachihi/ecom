/**
 * FURNITURE PRODUCT CONTROLLER
 * Xử lý tất cả các thao tác liên quan đến sản phẩm nội thất
 */

const productModel = require("../models/products");
const fs = require("fs");
const path = require("path");

class Product {

  // ===========================
  // CRUD OPERATIONS
  // ===========================

  static async getAllProduct(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 12, 100);
      const search = (req.query.search || req.query.q || "").trim();

      let filter = { pStatus: { $in: ["active", "Active"] } };

      if (search) {
        filter.$or = [
          { pName: { $regex: search, $options: "i" } },
          { pDescription: { $regex: search, $options: "i" } },
          { pSKU: { $regex: search, $options: "i" } },
        ];
      }

      if (req.query.category) {
        filter.pCategory = req.query.category;
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
            sortOption = { pSold: -1 };
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

      const total = await productModel.countDocuments(filter);
      const productsRaw = await productModel
        .find(filter)
        .populate("pCategory", "_id cName")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit);

      // Keep images as stored (base64 array or filenames)
      const products = productsRaw.map((p) => ({
        ...p.toObject()
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
        .populate("pCategory", "_id cName");

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

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
        pQuantity,
        pCategory,
        discount,
        pDiscount,
        pStatus,
        pSKU,
        furniture,
      } = req.body;


      if (!pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
        return res.json({ error: "All required fields must be filled" });
      }


      let images = req.body.image

      const thumbnailImage = req.body.images.length > 0 ? req.body.images[0] : undefined;


      let furnitureData = {};
      if (furniture) {
        try {
          furnitureData = typeof furniture === "string" ? JSON.parse(furniture) : furniture;
          // Ensure colors is array of objects { colorName }
          if (furnitureData.colors) {
            if (typeof furnitureData.colors === 'string') {
              // Split string to array
              furnitureData.colors = furnitureData.colors.split(',').map(c => c.trim()).filter(c => c).map(c => ({ colorName: c }));
            } else if (Array.isArray(furnitureData.colors)) {
              // If array of strings, convert to array of objects
              furnitureData.colors = furnitureData.colors.map(c => {
                if (typeof c === 'string') return { colorName: c };
                if (typeof c === 'object' && c.colorName) return c;
                return null;
              }).filter(Boolean);
            } else {
              furnitureData.colors = [];
            }
          }
          if (furnitureData.style && !Array.isArray(furnitureData.style)) {
            if (typeof furnitureData.style === 'string') {
              furnitureData.style = furnitureData.style.split(',').map(s => s.trim()).filter(s => s);
            } else {
              furnitureData.style = [];
            }
          }
          if (furnitureData.features && !Array.isArray(furnitureData.features)) {
            if (typeof furnitureData.features === 'string') {
              furnitureData.features = furnitureData.features.split(',').map(f => f.trim()).filter(f => f);
            } else {
              furnitureData.features = [];
            }
          }
        } catch (e) {
          console.warn("Could not parse furniture data");
        }
      }

      const newProduct = new productModel({
        pName,
        pDescription,
        pShortDescription,
        pPrice,
        pQuantity,
        pCategory,
        discount: discount || pDiscount || 0,
        pDiscount: discount || pDiscount || 0,
        pStatus,
        pSKU,
        images,
        thumbnailImage,
        furniture: furnitureData,
      });

      const savedProduct = await newProduct.save();

      return res.json({
        success: "Product created successfully",
        data: { _id: savedProduct._id, pSKU: savedProduct.pSKU },
      });
    } catch (err) {
      console.error(err);
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
        pQuantity,
        pCategory,
        discount,
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
      if (!pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
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
        pQuantity,
        pCost,
        pComparePrice,
        isFeatured,
        isRecommended,
        isNewProduct,
        isBestseller,
        isOnSale,
        discount: discount || pDiscount || 0,
        pDiscount: discount || pDiscount || 0,
        pStatus,
      };

      const thumbnailImage = req.body.images.length > 0 ? req.body.images[0] : undefined;

      // Cập nhật dữ liệu
      updateData.thumbnailImage = thumbnailImage;
      updateData.images = req.body.images;
      if (furniture) {
        try {
          let furnitureData = typeof furniture === "string" ? JSON.parse(furniture) : furniture;
          // Ensure colors is array of objects { colorName }
          if (furnitureData.colors) {
            if (typeof furnitureData.colors === 'string') {
              furnitureData.colors = furnitureData.colors.split(',').map(c => c.trim()).filter(c => c).map(c => ({ colorName: c }));
            } else if (Array.isArray(furnitureData.colors)) {
              furnitureData.colors = furnitureData.colors.map(c => {
                if (typeof c === 'string') return { colorName: c };
                if (typeof c === 'object' && c.colorName) return c;
                return null;
              }).filter(Boolean);
            } else {
              furnitureData.colors = [];
            }
          }
          // Ensure style is array of strings
          if (furnitureData.style && !Array.isArray(furnitureData.style)) {
            if (typeof furnitureData.style === 'string') {
              furnitureData.style = furnitureData.style.split(',').map(s => s.trim()).filter(s => s);
            } else {
              furnitureData.style = [];
            }
          }
          // Ensure features is array of strings
          if (furnitureData.features && !Array.isArray(furnitureData.features)) {
            if (typeof furnitureData.features === 'string') {
              furnitureData.features = furnitureData.features.split(',').map(f => f.trim()).filter(f => f);
            } else {
              furnitureData.features = [];
            }
          }
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
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getDeleteProduct(req, res) {
    try {
      const { pId } = req.body;

      if (!pId) {
        return res.json({ error: "Product ID required" });
      }

      const product = await productModel.findById(pId);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (product.images && product.images.length) {
        const first = product.images[0];
        const isBase64 = typeof first === "string" && first.length > 100 && /^[A-Za-z0-9+/=]+$/.test(first);
        if (!isBase64) {
          Product.deleteImages(product.images, "string");
        }
      }

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
      const products = await productModel.findBestsellers(limit);
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
}

module.exports = Product;
