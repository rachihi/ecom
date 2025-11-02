const productModel = require("../models/products");
const warehouseModel = require("../models/warehouses");
const fs = require("fs");
const path = require("path");

class Product {
  // Delete Image from uploads -> products folder
  static deleteImages(images, mode) {
    var basePath =
      path.resolve(__dirname + "../../") + "/public/uploads/products/";
    console.log(basePath);
    for (var i = 0; i < images.length; i++) {
      let filePath = "";
      if (mode == "file") {
        filePath = basePath + `${images[i].filename}`;
      } else {
        filePath = basePath + `${images[i]}`;
      }
      console.log(filePath);
      if (fs.existsSync(filePath)) {
        console.log("Exists image");
      }
      fs.unlink(filePath, (err) => {
        if (err) {
          return err;
        }
      });
    }
  }

  async getAllProduct(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();
      const filter = q ? { pName: { $regex: q, $options: 'i' } } : {};

      const total = await productModel.countDocuments(filter);
      const Products = await productModel
        .find(filter)
        .populate("pCategory", "_id cName")
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.json({ Products, total, page, limit });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async postAddProduct(req, res) {
    let { pName, pDescription, pPrice, pQuantity, pCategory, pOffer, pStatus } = req.body;
    let images = req.files || [];
    // Validation
    if (
      !pName |
      !pDescription |
      !pPrice |
      !pQuantity |
      !pCategory |
      !pOffer |
      !pStatus
    ) {
      if (images.length) Product.deleteImages(images, "file");
      return res.json({ error: "All filled must be required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      if (images.length) Product.deleteImages(images, "file");
      return res.json({
        error: "Name 255 & Description must not be 3000 charecter long",
      });
    } else {
      try {
        let allImages = [];
        for (const img of images) {
          allImages.push(img.filename);
        }
        let newProduct = new productModel({
          pImages: allImages,
          pName,
          pDescription,
          pPrice,
          pQuantity,
          pCategory,
          pOffer,
          pStatus,
        });
        let save = await newProduct.save();
        if (save) {
          return res.json({ success: "Product created successfully" });
        }
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  async postEditProduct(req, res) {
    let {
      pId,
      pName,
      pDescription,
      pPrice,
      pQuantity,
      pCategory,
      pOffer,
      pStatus,
      pImages,
    } = req.body;
    let editImages = req.files || [];

    // Validate other fields
    if (
      !pId |
      !pName |
      !pDescription |
      !pPrice |
      !pQuantity |
      !pCategory |
      !pOffer |
      !pStatus
    ) {
      return res.json({ error: "All filled must be required" });
    }
    // Validate Name and description
    else if (pName.length > 255 || pDescription.length > 3000) {
      return res.json({
        error: "Name 255 & Description must not be 3000 charecter long",
      });
    } else {
      let editData = {
        pName,
        pDescription,
        pPrice,
        pQuantity,
        pCategory,
        pOffer,
        pStatus,
      };
      if (editImages && editImages.length > 0) {
        let allEditImages = [];
        for (const img of editImages) {
          allEditImages.push(img.filename);
        }
        editData = { ...editData, pImages: allEditImages };
        if (pImages) Product.deleteImages(pImages.split(","), "string");
      }
      try {
        let editProduct = productModel.findByIdAndUpdate(pId, editData);
        editProduct.exec((err) => {
          if (err) console.log(err);
          return res.json({ success: "Product edit successfully" });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getDeleteProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteProductObj = await productModel.findById(pId);
        let deleteProduct = await productModel.findByIdAndDelete(pId);
        if (deleteProduct) {
          // Delete Image from uploads -> products folder
          Product.deleteImages(deleteProductObj.pImages, "string");

          // Delete warehouse entry for this product
          await warehouseModel.deleteOne({ product: pId });

          return res.json({ success: "Product deleted successfully" });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getSingleProduct(req, res) {
    let { pId } = req.body;
    if (!pId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let singleProduct = await productModel
          .findById(pId)
          .populate("pCategory", "cName")
          .populate("pRatingsReviews.user", "name email userImage");
        if (singleProduct) {
          return res.json({ Product: singleProduct });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async getProductByCategory(req, res) {
    let { catId } = req.body;
    if (!catId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pCategory: catId })
          .populate("pCategory", "cName");
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Search product wrong" });
      }
    }
  }

  async getProductByPrice(req, res) {
    let { price } = req.body;
    if (!price) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let products = await productModel
          .find({ pPrice: { $lt: price } })
          .populate("pCategory", "cName")
          .sort({ pPrice: -1 });
        if (products) {
          return res.json({ Products: products });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getWishProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let wishProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (wishProducts) {
          return res.json({ Products: wishProducts });
        }
      } catch (err) {
        return res.json({ error: "Filter product wrong" });
      }
    }
  }

  async getCartProduct(req, res) {
    let { productArray } = req.body;
    if (!productArray) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let cartProducts = await productModel.find({
          _id: { $in: productArray },
        });
        if (cartProducts) {
          return res.json({ Products: cartProducts });
        }
      } catch (err) {
        return res.json({ error: "Cart product wrong" });
      }
    }
  }

  async postAddReview(req, res) {
    let { pId, uId, rating, review } = req.body;
    if (!pId || !rating || !review || !uId) {
      return res.json({ error: "All filled must be required" });
    } else {
      let checkReviewRatingExists = await productModel.findOne({ _id: pId });
      if (checkReviewRatingExists.pRatingsReviews.length > 0) {
        checkReviewRatingExists.pRatingsReviews.map((item) => {
          if (item.user === uId) {
            return res.json({ error: "Your already reviewd the product" });
          } else {
            try {
              let newRatingReview = productModel.findByIdAndUpdate(pId, {
                $push: {
                  pRatingsReviews: {
                    review: review,
                    user: uId,
                    rating: rating,
                  },
                },
              });
              newRatingReview.exec((err, result) => {
                if (err) {
                  console.log(err);
                }
                return res.json({ success: "Thanks for your review" });
              });
            } catch (err) {
              return res.json({ error: "Cart product wrong" });
            }
          }
        });
      } else {
        try {
          let newRatingReview = productModel.findByIdAndUpdate(pId, {
            $push: {
              pRatingsReviews: { review: review, user: uId, rating: rating },
            },
          });
          newRatingReview.exec((err, result) => {
            if (err) {
              console.log(err);
            }
            return res.json({ success: "Thanks for your review" });
          });
        } catch (err) {
          return res.json({ error: "Cart product wrong" });
        }
      }
    }
  }

  async deleteReview(req, res) {
    let { rId, pId } = req.body;
    if (!rId) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        let reviewDelete = productModel.findByIdAndUpdate(pId, {
          $pull: { pRatingsReviews: { _id: rId } },
        });
        reviewDelete.exec((err, result) => {
          if (err) {
            console.log(err);
          }
          return res.json({ success: "Your review is deleted" });
        });
      } catch (err) {
        console.log(err);
      }
    }
  }
}

const productController = new Product();
module.exports = productController;
