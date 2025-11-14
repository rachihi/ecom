const express = require("express");
const router = express.Router();
const customerAuthController = require("../controller/customerAuth");
const customerAuthMiddleware = require("../middleware/customerAuth");

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

module.exports = router;

