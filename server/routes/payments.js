const express = require("express");
const router = express.Router();
const paymentsController = require("../controller/payments");

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payments for orders and purchase orders
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
 * /api/payments/purchase-order/{purchaseOrderId}:
 *   get:
 *     summary: List payments by purchase order
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: purchaseOrderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment list and summary
 * /api/payments/:
 *   post:
 *     summary: Create payment (order income or purchase payout)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order: { type: string }
 *               purchaseOrder: { type: string }
 *               paymentMethod: { type: string }
 *               amount: { type: number }
 *               paymentDate: { type: string, format: date-time }
 *               note: { type: string }
 *     responses:
 *       200:
 *         description: Created
 */
router.get("/order/:orderId", paymentsController.listByOrder);
router.get("/purchase-order/:purchaseOrderId", paymentsController.listByPurchaseOrder);
router.post("/", paymentsController.create);
router.put("/:id", paymentsController.update);
router.delete("/:id", paymentsController.remove);

module.exports = router;


