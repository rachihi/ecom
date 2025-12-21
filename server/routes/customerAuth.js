const express = require("express");
const router = express.Router();
const customerAuthController = require("../controller/customerAuth");
const customerAuthMiddleware = require("../middleware/customerAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer Config for Avatars
const uploadDir = path.join(__dirname, "../public/uploads/avatars");
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

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MBLimit
    fileFilter: (req, file, cb) => {
        if (["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPG, PNG, WEBP allowed."), false);
        }
    }
});

/**
 * @swagger
 * tags:
 *   name: Customer Auth
 *   description: Customer authentication endpoints
 */

/**
 * @swagger
 * /api/customer/signup:
 *   post:
 *     summary: Customer sign up
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - phoneNumber
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Nguyen Van A"
 *               email:
 *                 type: string
 *                 example: "customer@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               phoneNumber:
 *                 type: string
 *                 example: "0123456789"
 *               address:
 *                 type: string
 *                 example: "123 Street, City"
 *     responses:
 *       200:
 *         description: Sign up successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 customer:
 *                   type: object
 *       400:
 *         description: Validation error or email already exists
 */
router.post("/signup", customerAuthController.signup);

/**
 * @swagger
 * /api/customer/signin:
 *   post:
 *     summary: Customer sign in
 *     tags: [Customer Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "customer@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Sign in successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 customer:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post("/signin", customerAuthController.signin);

/**
 * @swagger
 * /api/customer/profile:
 *   get:
 *     summary: Get customer profile
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", customerAuthMiddleware, customerAuthController.getProfile);

/**
 * @swagger
 * /api/customer/upload-avatar:
 *   post:
 *     summary: Upload avatar
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post("/upload-avatar", customerAuthMiddleware, upload.single("avatar"), customerAuthController.uploadAvatar);

/**
 * @swagger
 * /api/customer/profile:
 *   put:
 *     summary: Update customer profile
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 */
router.put("/profile", customerAuthMiddleware, customerAuthController.updateProfile);

/**
 * @swagger
 * /api/customer/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 */
router.post("/change-password", customerAuthMiddleware, customerAuthController.changePassword);

module.exports = router;

