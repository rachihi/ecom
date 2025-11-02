const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/keys");
const userModel = require("../models/users");

exports.loginCheck = (req, res, next) => {
  try {
    let header = req.headers.authorization || req.headers.token;
    if (!header) throw new Error("No token");
    let token = header.startsWith("Bearer ") ? header.replace("Bearer ", "") : header;
    const decode = jwt.verify(token, JWT_SECRET);
    req.userDetails = decode;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "You must be logged in" });
  }
};

exports.isAuth = (req, res, next) => {
  let { loggedInUserId } = req.body;
  if (!loggedInUserId || !req.userDetails?._id || loggedInUserId != req.userDetails._id) {
    return res.status(403).json({ error: "You are not authenticate" });
  }
  return next();
};

exports.isAdmin = async (req, res, next) => {
  try {
    let reqUser = await userModel.findById(req.body.loggedInUserId);
    // If user role 0 that's mean not admin it's customer
    if (reqUser && reqUser.userRole === 0) {
      return res.status(403).json({ error: "Access denied" });
    }
    return next();
  } catch {
    return res.status(404).end();
  }
};
