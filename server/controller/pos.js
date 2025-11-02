const mongoose = require("mongoose");
const orderModel = require("../models/orders");
const paymentModel = require("../models/payments");
const cashbookModel = require("../models/cashbook");
const warehouseModel = require("../models/warehouses");
const productModel = require("../models/products");
const customerModel = require("../models/customers");

class PosController {
  async createSale(req, res) {
    try {
      const userId = req.userDetails && req.userDetails._id;
      const { items, amount, customerId, customer, payment, paymentMethod } = req.body;
      if (!userId || !Array.isArray(items) || items.length === 0 || !amount) {
        return res.json({ message: "All filled must be required" });
      }
      if (!paymentMethod || !["Cash", "BankTransfer"].includes(paymentMethod)) {
        return res.json({ message: "Payment method is required (Cash or BankTransfer)" });
      }

      // Resolve/ensure customer (optional)
      let resolvedCustomerId = customerId || null;
      let resolvedCustomerData = null;
      if (!resolvedCustomerId && customer && (customer.fullName || customer.phoneNumber)) {
        const created = await new customerModel({
          user: customer.user || null,
          fullName: customer.fullName || "POS Customer",
          phoneNumber: customer.phoneNumber || 0,
          email: customer.email || null,
          address: customer.address || "POS",
          taxCode: customer.taxCode || null,
        }).save();
        resolvedCustomerId = created._id;
        resolvedCustomerData = created;
      }

      // Normalize products payload
      const allProduct = items.map((it) => ({
        id: it.id || it.product || it._id,
        quantitiy: Math.abs(it.quantitiy || it.quantity || 1),
      }));
      const addr = (customer && customer.address) || "POS";
      const phone = (customer && Number(customer.phoneNumber)) || 0;
      const transactionId = `POS-${Date.now()}`;

      const order = new orderModel({
        allProduct,
        user: userId,
        customer: resolvedCustomerId,
        amount,
        transactionId,
        address: addr,
        phone,
        status: "Delivered", // POS orders are delivered immediately
      });
      const saved = await order.save();

      // Adjust stock and product counters
      try {
        for (const item of allProduct) {
          if (item && item.id && item.quantitiy) {
            await warehouseModel.findOneAndUpdate(
              { product: item.id },
              { $inc: { quantity: -Math.abs(item.quantitiy) }, lastUpdated: Date.now() },
              { upsert: true }
            );
            await productModel.findByIdAndUpdate(item.id, {
              $inc: { pSold: Math.abs(item.quantitiy), pQuantity: -Math.abs(item.quantitiy) },
            });
          }
        }
      } catch (e) {
        // ignore stock errors to not block POS flow
      }

      let createdPayment = null;
      let paymentSummary = { totalPaid: 0, remaining: amount };

      // Immediate full payment for POS (Thu toàn bộ)
      const payDoc = await new paymentModel({
        order: saved._id,
        direction: "in",
        paymentMethod: paymentMethod,
        amount: amount,
        paymentDate: (payment && payment.paymentDate) || new Date(),
        note: (payment && payment.note) || null,
      }).save();
      createdPayment = payDoc;

      // Create cashbook entry (Thu)
      await new cashbookModel({
        payment: payDoc._id,
        direction: "in",
        source: "order",
        order: saved._id,
        amount: amount,
        paymentMethod: payDoc.paymentMethod,
        paymentDate: payDoc.paymentDate,
        note: payDoc.note || null,
        createdBy: userId || null,
      }).save();

      // Recalculate payment status on order
      const agg = await paymentModel.aggregate([
        { $match: { order: new mongoose.Types.ObjectId(saved._id) } },
        { $group: { _id: "$order", totalPaid: { $sum: "$amount" } } },
      ]);
      const totalPaid = agg && agg[0] ? agg[0].totalPaid : 0;
      const remaining = Math.max(amount - totalPaid, 0);
      const nextStatus = totalPaid >= amount ? "Paid" : totalPaid > 0 ? "Partial" : "Unpaid";
      if (saved.paymentStatus !== nextStatus) {
        saved.paymentStatus = nextStatus;
        await saved.save();
      }
      paymentSummary = { totalPaid, remaining };

      return res.json({
        success: "POS order created",
        order: saved,
        payment: createdPayment,
        paymentSummary,
        customer: resolvedCustomerData,
      });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new PosController();

