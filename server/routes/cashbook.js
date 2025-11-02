const express = require("express");
const router = express.Router();
const { loginCheck } = require("../middleware/auth");
const cashbookController = require("../controller/cashbook");

// List cashbook entries (optionally filter by from/to dates)
router.get("/", loginCheck, cashbookController.list);

module.exports = router;

