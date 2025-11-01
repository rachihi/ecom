const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    taxCode: { type: String, default: null },
  },
  { timestamps: true }
);

const supplierModel = mongoose.model("suppliers", supplierSchema);
module.exports = supplierModel;


