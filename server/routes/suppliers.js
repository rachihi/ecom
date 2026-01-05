const express = require("express");
const router = express.Router();
const suppliersController = require("../controller/suppliers");

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management
 */

/**
 * @swagger
 * /api/suppliers/:
 *   get:
 *     summary: List suppliers
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: List
 *   post:
 *     summary: Create supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               address: { type: string }
 *               taxCode: { type: string }
 *     responses:
 *       200:
 *         description: Created
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier by id
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               address: { type: string }
 *               taxCode: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
const multer = require("multer");
const { loginCheck } = require("../middleware/auth");

const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../public/uploads/suppliers");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: storage });

router.get("/", suppliersController.list);
router.get("/export", loginCheck, suppliersController.getExportSupplier);
router.post("/import", loginCheck, upload.single("file"), suppliersController.postImportSupplier);
router.get("/:id", suppliersController.getById);
router.post("/", suppliersController.create);
router.put("/:id", suppliersController.update);
router.delete("/:id", suppliersController.remove);

module.exports = router;


