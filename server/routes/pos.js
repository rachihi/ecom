const express = require("express");
const router = express.Router();
const posController = require("../controller/pos");
const { loginCheck } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: POS
 *   description: Point of Sale operations
 */

/**
 * @swagger
 * /api/pos/order:
 *   post:
 *     summary: Create POS sale order (with optional payment)
 *     tags: [POS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     quantity: { type: number }
 *               amount: { type: number }
 *               customerId: { type: string }
 *               customer:
 *                 type: object
 *                 properties:
 *                   fullName: { type: string }
 *                   phoneNumber: { type: string }
 *                   email: { type: string }
 *                   address: { type: string }
 *               payment:
 *                 type: object
 *                 properties:
 *                   paymentMethod: { type: string }
 *                   amount: { type: number }
 *                   paymentDate: { type: string, format: date-time }
 *                   note: { type: string }
 *     responses:
 *       200:
 *         description: Created
 */
router.post("/order", loginCheck, posController.createSale);

module.exports = router;

