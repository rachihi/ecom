const express = require("express");
const router = express.Router();
const brainTreeController = require("../controller/braintree");

/**
 * @swagger
 * tags:
 *   name: Braintree
 *   description: Braintree payment gateway
 */

/**
 * @swagger
 * /api/braintree/get-token:
 *   post:
 *     summary: Get Braintree client token
 *     tags: [Braintree]
 *     responses:
 *       200:
 *         description: Token
 * /api/braintree/payment:
 *   post:
 *     summary: Process Braintree payment
 *     tags: [Braintree]
 *     responses:
 *       200:
 *         description: Result
 */
router.post("/braintree/get-token", brainTreeController.ganerateToken);
router.post("/braintree/payment", brainTreeController.paymentProcess);

module.exports = router;
