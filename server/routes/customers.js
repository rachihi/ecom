const express = require("express");
const router = express.Router();
const customersController = require("../controller/customers");
const multer = require("multer");
const { loginCheck } = require("../middleware/auth");

const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../public/uploads/customers");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Image Upload setting
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    },
});

const upload = multer({ storage: storage });


/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

/**
 * @swagger
 * /api/customers/:
 *   get:
 *     summary: List customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: A list of customers
 *   post:
 *     summary: Create a customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               taxCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Created
 */
router.get("/", customersController.list);
router.get("/export", customersController.getExportCustomer);
router.post("/import", upload.single("file"), customersController.postImportCustomer);
router.get("/:id", customersController.getById);
router.post("/", customersController.create);
router.put("/:id", customersController.update);
router.delete("/:id", customersController.remove);

module.exports = router;
