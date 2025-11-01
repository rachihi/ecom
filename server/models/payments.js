const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const paymentSchema = new mongoose.Schema(
  {
    order: { type: ObjectId, ref: "orders", required: true },
    paymentMethod: { type: String, enum: ["Cash", "BankTransfer", "Card", "Other"], required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    note: { type: String, default: null },
  },
  { timestamps: true }
);

const paymentModel = mongoose.model("payments", paymentSchema);
module.exports = paymentModel;


