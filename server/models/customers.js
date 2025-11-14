const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const customerSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: "users", default: null }, // DEPRECATED: Keep for backward compatibility
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Make email unique for login
    address: { type: String, default: null }, // Make optional for registration
    taxCode: { type: String, default: null },

    // Auth fields for customer login
    password: { type: String, default: null }, // Hashed password (null for guest customers)
    isRegistered: { type: Boolean, default: false }, // true if customer has account, false if guest
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

const customerModel = mongoose.model("customers", customerSchema);
module.exports = customerModel;


