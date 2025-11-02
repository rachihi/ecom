const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const paymentSchema = new mongoose.Schema(
  {
    // For 'Thu' (inflow) link to sales order; for 'Chi' (outflow) link to purchase order
    order: { type: ObjectId, ref: "orders", required: false },
    purchaseOrder: { type: ObjectId, ref: "purchaseorders", required: false },
    direction: { type: String, enum: ["in", "out"], required: true },

    paymentMethod: { type: String, enum: ["Cash", "BankTransfer"], required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    note: { type: String, default: null },
  },
  { timestamps: true }
);

const paymentModel = mongoose.model("payments", paymentSchema);
module.exports = paymentModel;
