const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const customerSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: "users", default: null },
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    taxCode: { type: String, default: null },
  },
  { timestamps: true }
);

const customerModel = mongoose.model("customers", customerSchema);
module.exports = customerModel;


