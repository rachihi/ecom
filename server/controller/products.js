/**
 * FURNITURE PRODUCT CONTROLLER
 * Xử lý tất cả các thao tác liên quan đến sản phẩm nội thất
 */

const productModel = require("../models/products");
const fs = require("fs");
const path = require("path");

class Product {
  // ===========================
  // HÌNH ẢNH - UPLOAD & DELETE
  // ===========================

  static async uploadProductImages(req, res) {
    try {
      const { productId } = req.body;
      const files = req.files || [];

      if (!files.length) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      const uploadedImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageType =
          req.body.imageTypes && req.body.imageTypes[i] 
            ? req.body.imageTypes[i] 
            : "detail";

        const metadata = {
          productId: productId || null,
          filename: file.filename,
          filepath: `/uploads/products/${file.filename}`,
          originalName: file.originalname,
          type: imageType,
          size: file.size,
          uploadedAt: new Date(),
          alt: `Product image - ${imageType}`,
        };

        const metadataPath = path.join(
          __dirname,
          `../public/uploads/products/${file.filename}.json`
        );
        try {
          fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
        } catch (err) {
          console.warn("Could not write metadata file:", err);
        }

        uploadedImages.push({
          filename: file.filename,
          filepath: metadata.filepath,
          type: imageType,
          alt: metadata.alt,
          size: file.size,
        });
      }

      return res.json({
        success: "Images uploaded successfully",
        data: { images: uploadedImages },
      });
    } catch (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static deleteImages(images, mode) {
    const basePath = path.resolve(__dirname + "../../") + "/public/uploads/products/";

    for (let i = 0; i < images.length; i++) {
      let filePath = "";

      if (mode === "file") {
        filePath = basePath + `${images[i].filename}`;
      } else {
        filePath = basePath + `${images[i]}`;
      }

      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }

      const metadataPath = filePath + ".json";
      if (fs.existsSync(metadataPath)) {
        fs.unlink(metadataPath, (err) => {
          if (err) console.error("Error deleting metadata:", err);
        });
      }
    }
  }

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
      const products = await productModel
        .find(filter)
        .populate("pCategory", "_id cName")
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit);

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

      const files = req.files || [];

      if (!pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
        if (files.length) Product.deleteImages(files, "file");
        return res.json({ error: "All required fields must be filled" });
      }

      if (!files.length) {
        return res.json({ error: "At least one product image is required" });
      }

      const images = files.map((file, index) => ({
        filename: file.filename,
        filepath: `/uploads/products/${file.filename}`,
        originalName: file.originalname,
        type: "main",
        alt: pName,
        uploadedAt: new Date(),
        size: file.size,
      }));

      const thumbnailImage = images[0].filename;

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
        pQuantity,
        pCategory,
        discount: discount || pDiscount || 0,
        pDiscount: discount || pDiscount || 0,
        pStatus,
        pSKU,
        images,
        pImages: images.map(img => img.filename),
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

  static async postEditProduct(req, res) {
    try {
      const {
        pId,
        pName,
        pDescription,
        pShortDescription,
        pPrice,
        pQuantity,
        pCategory,
        discount,
        pDiscount,
        pStatus,
        furniture,
      } = req.body;

      const editFiles = req.files || [];

      if (!pId) {
        if (editFiles.length) Product.deleteImages(editFiles, "file");
        return res.json({ error: "Product ID required" });
      }

      if (!pName || !pDescription || !pPrice || !pQuantity || !pCategory || !pStatus) {
        if (editFiles.length) Product.deleteImages(editFiles, "file");
        return res.json({ error: "All required fields must be filled" });
      }

      const updateData = {
        pName,
        pDescription,
        pShortDescription,
        pPrice,
        pQuantity,
        pCategory,
        discount: discount || pDiscount || 0,
        pDiscount: discount || pDiscount || 0,
        pStatus,
      };

      if (editFiles.length > 0) {
        const newImages = editFiles.map((file, index) => ({
          filename: file.filename,
          filepath: `/uploads/products/${file.filename}`,
          originalName: file.originalname,
          type: "main",
          alt: pName,
          uploadedAt: new Date(),
          size: file.size,
        }));

        updateData.images = newImages;
        updateData.pImages = newImages.map(img => img.filename);
        updateData.thumbnailImage = newImages[0].filename;
      }

      if (furniture) {
        try {
          updateData.furniture = typeof furniture === "string" ? JSON.parse(furniture) : furniture;
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
        const imageFilenames = product.images.map((img) => img.filename);
        Product.deleteImages(imageFilenames, "string");
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
