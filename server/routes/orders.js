const express = require("express");
const router = express.Router();
const ordersController = require("../controller/orders");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Sales orders
 */

/**
 * @swagger
 * /api/order/get-all-orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Orders list
 * /api/order/order-by-user:
 *   post:
 *     summary: Get orders by user
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Orders
 * /api/order/create-order:
 *   post:
 *     summary: Create order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allProduct:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     quantitiy: { type: number }
 *               user: { type: string }
 *               customerId: { type: string }
 *               customer:
 *                 type: object
 *                 properties:
 *                   fullName: { type: string }
 *                   phoneNumber: { type: string }
 *                   email: { type: string }
 *                   address: { type: string }
 *                   taxCode: { type: string }
 *               amount: { type: number }
 *               transactionId: { type: string }
 *               address: { type: string }
 *               phone: { type: number }
 *     responses:
 *       200:
 *         description: Created
 * /api/order/update-order:
 *   post:
 *     summary: Update order status
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oId: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 * /api/order/delete-order:
 *   post:
 *     summary: Delete order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oId: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get("/get-all-orders", ordersController.getAllOrders);
router.post("/order-by-user", ordersController.getOrderByUser);

router.post("/create-order", ordersController.postCreateOrder);
router.post("/update-order", ordersController.postUpdateOrder);
router.post("/delete-order", ordersController.postDeleteOrder);

module.exports = router;
