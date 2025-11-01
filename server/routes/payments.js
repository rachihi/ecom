const express = require("express");
const router = express.Router();
const paymentsController = require("../controller/payments");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payments for orders
 */

/**
 * @swagger
 * /api/payments/order/{orderId}:
 *   get:
 *     summary: List payments by order
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment list and summary
 * /api/payments/:
 *   post:
 *     summary: Create payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order: { type: string }
 *               paymentMethod: { type: string }
 *               amount: { type: number }
 *               paymentDate: { type: string, format: date-time }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Created
 */
router.get("/order/:orderId", paymentsController.listByOrder);
router.post("/", paymentsController.create);

module.exports = router;


