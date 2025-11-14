/**
 * PRODUCT ROUTES
 * Routes cho hệ thống quản lý sản phẩm nội thất
 */

const express = require("express");
const router = express.Router();
const productController = require("../controller/products");
const auth = require("../middleware/auth");
const customerAuth = require("../middleware/customerAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ===========================
// MULTER CONFIGURATION
// ===========================

const uploadDir = path.join(__dirname, "../public/uploads/products");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const random = Math.floor(Math.random() * 1000);
    const filename = `${timestamp}_${name}_${random}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, PNG, WEBP, GIF allowed."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

const uploadErrorHandler = (req, res, next) => {
  next();
};

// ===========================
// PUBLIC ROUTES - GET PRODUCTS
// ===========================

router.get("/all-product", (req, res) => productController.getAllProduct(req, res));
router.get("/featured", (req, res) => productController.getAllProduct(req, res));
router.get("/new-products", (req, res) => productController.getNewProducts(req, res));
router.get("/bestsellers", (req, res) => productController.getBestsellers(req, res));
router.get("/top-rated", (req, res) => productController.getTopRated(req, res));

router.post(
  "/single-product",
  (req, res) => productController.getSingleProduct(req, res)
);

router.post(
  "/product-by-category",
  (req, res) => productController.getProductByCategory(req, res)
);

router.post(
  "/product-by-price",
  (req, res) => productController.getProductByPrice(req, res)
);

// ===========================
// REVIEWS & RATINGS
// ===========================

router.post(
  "/add-review",
  customerAuth,
  (req, res) => productController.postAddReview(req, res)
);

router.post(
  "/delete-review",
  customerAuth,
  (req, res) => productController.deleteReview(req, res)
);

// ===========================
// ADMIN ONLY ROUTES
// ===========================

router.post(
  "/upload-images",
  auth.loginCheck,
  auth.isAdmin,
  upload.array("images", 10),
  uploadErrorHandler,
  (req, res) => productController.uploadProductImages(req, res)
);

router.post(
  "/add-product",
  auth.loginCheck,
  auth.isAdmin,
  (req, res) => productController.postAddProduct(req, res)
);

router.put(
  "/edit-product/:id",
  auth.loginCheck,
  auth.isAdmin,
  (req, res) => productController.postEditProduct(req, res)
);

router.delete(
  "/delete-product/:id",
  auth.loginCheck,
  auth.isAdmin,
  (req, res) => {
    req.body.pId = req.params.id;
    productController.getDeleteProduct(req, res);
  }
);

router.post(
  "/delete-product",
  auth.loginCheck,
  auth.isAdmin,
  (req, res) => productController.deleteProduct(req, res)
);

router.post(
  "/edit-product",
  auth.loginCheck,
  auth.isAdmin,
  (req, res) => productController.editProduct(req, res)
);

// ===========================
// ERROR HANDLING
// ===========================

router.use((err, req, res, next) => {
  console.error("Router error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File size is too large. Maximum 5MB allowed.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files. Maximum 10 files allowed.",
      });
    }
  }

  if (err.message.includes("Invalid file type")) {
    return res.status(400).json({
      error: "Invalid file type. Only JPEG, PNG, WEBP, GIF allowed.",
    });
  }

  res.status(500).json({ error: "Internal server error" });
});

module.exports = router;
