const jwt = require("jsonwebtoken");
require("dotenv").config();

const { JWT_SECRET } = process.env;

/**
 * Middleware to verify customer JWT token
 * Attaches customerDetails to req object
 */
const customerAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token is for customer
    if (decoded.role !== "CUSTOMER") {
      return res.status(403).json({ error: "Access denied. Customer token required." });
    }

    req.customerDetails = decoded;
    next();
  } catch (err) {
    console.error("Customer auth middleware error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = customerAuthMiddleware;

