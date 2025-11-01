const express = require("express");
const router = express.Router();
const authController = require("../controller/auth");
const { loginCheck, isAuth, isAdmin } = require("../middleware/auth");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & authorization
 */

/**
 * @swagger
 * /api/isadmin:
 *   post:
 *     summary: Check is admin
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Result
 * /api/signup:
 *   post:
 *     summary: Sign up
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Signed up
 * /api/signin:
 *   post:
 *     summary: Sign in
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Signed in
 * /api/user:
 *   post:
 *     summary: Get users (admin)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Users
 */
router.post("/isadmin", authController.isAdmin);
router.post("/signup", authController.postSignup);
router.post("/signin", authController.postSignin);
router.post("/user", loginCheck, isAuth, isAdmin, authController.allUser);

module.exports = router;
