const express = require("express");
const router = express.Router();
const purchaseOrdersController = require("../controller/purchaseOrders");

/**
 * @swagger
 * tags:
 *   name: PurchaseOrders
 *   description: Supplier purchase orders
 */

/**
 * @swagger
 * /api/purchase-orders/:
 *   get:
 *     summary: List purchase orders
 *     tags: [PurchaseOrders]
 *     responses:
 *       200:
 *         description: List
 *   post:
 *     summary: Create purchase order
 *     tags: [PurchaseOrders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplier: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product: { type: string }
 *                     quantity: { type: number }
 *                     price: { type: number }
 *               totalAmount: { type: number }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Created
 * /api/purchase-orders/{id}:
 *   get:
 *     summary: Get purchase order by id
 *     tags: [PurchaseOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item
 *   delete:
 *     summary: Delete purchase order
 *     tags: [PurchaseOrders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 * /api/purchase-orders/{id}/status:
 *   put:
 *     summary: Update status of purchase order
 *     tags: [PurchaseOrders]
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
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 */
router.get("/", purchaseOrdersController.list);
router.get("/:id", purchaseOrdersController.getById);
router.post("/", purchaseOrdersController.create);
router.put("/:id", purchaseOrdersController.update);

router.put("/:id/receive", purchaseOrdersController.markReceived);
router.delete("/:id", purchaseOrdersController.remove);

module.exports = router;


