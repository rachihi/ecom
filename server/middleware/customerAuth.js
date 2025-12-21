const jwt = require("jsonwebtoken");
require("dotenv").config();

const { JWT_SECRET = "test_secret_key_123" } = process.env;

/**
 * Middleware to verify customer JWT token
 * Attaches customerDetails to req object
 */
const customerAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    // console.log("Auth Header:", authHeader);

    const token = authHeader?.split(" ")[1]; // Bearer <token>

    if (!token) {
      console.log("No token provided in header");
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // console.log("Decoded:", decoded);

    // Check if token is for customer
    if (decoded.role !== "CUSTOMER") {
      console.log("Role mismatch:", decoded.role);
      return res.status(403).json({ error: "Access denied. Customer token required." });
    }

    req.customerDetails = decoded;
    next();
  } catch (err) {
    console.error("Customer auth middleware error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token", details: err.message });
  }
};

module.exports = customerAuthMiddleware;

