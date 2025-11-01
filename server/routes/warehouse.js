const express = require("express");
const router = express.Router();
const warehouseController = require("../controller/warehouse");

/**
 * @swagger
 * tags:
 *   name: Warehouse
 *   description: Inventory management
 */

/**
 * @swagger
 * /api/warehouse/:
 *   get:
 *     summary: List warehouse items
 *     tags: [Warehouse]
 *     responses:
 *       200:
 *         description: List
 * /api/warehouse/product/{productId}:
 *   get:
 *     summary: Get warehouse by product
 *     tags: [Warehouse]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item
 * /api/warehouse/upsert:
 *   post:
 *     summary: Upsert warehouse record
 *     tags: [Warehouse]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product: { type: string }
 *               quantity: { type: number }
 *               location: { type: string }
 *     responses:
 *       200:
 *         description: Upserted
 * /api/warehouse/adjust:
 *   post:
 *     summary: Adjust stock quantity
 *     tags: [Warehouse]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product: { type: string }
 *               delta: { type: number }
 *     responses:
 *       200:
 *         description: Adjusted
 */
router.get("/", warehouseController.list);
router.get("/product/:productId", warehouseController.getByProduct);
router.post("/upsert", warehouseController.upsert);
router.post("/adjust", warehouseController.adjust);

module.exports = router;


