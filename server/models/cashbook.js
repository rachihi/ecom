const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;

const cashbookSchema = new mongoose.Schema(
  {
    payment: { type: ObjectId, ref: "payments", index: true, unique: true },
    direction: { type: String, enum: ["in", "out"], required: true }, // in: Thu, out: Chi
    source: { type: String, enum: ["order", "purchase"], required: true },

    order: { type: ObjectId, ref: "orders", required: false },
    purchaseOrder: { type: ObjectId, ref: "purchaseorders", required: false },

    amount: { type: Number, required: true }, // always positive number; direction determines sign in summary
    paymentMethod: { type: String, enum: ["Cash", "BankTransfer"], required: true },
    paymentDate: { type: Date, required: true },
    note: { type: String, default: null },

    createdBy: { type: ObjectId, ref: "users", default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("cashbookEntries", cashbookSchema);

