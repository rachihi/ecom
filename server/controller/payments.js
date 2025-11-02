const mongoose = require("mongoose");
const paymentModel = require("../models/payments");
const orderModel = require("../models/orders");
const purchaseOrderModel = require("../models/purchaseOrders");
const cashbookModel = require("../models/cashbook");

async function recalcOrderPayment(orderId) {
  try {
    const oid = typeof orderId === "string" ? new mongoose.Types.ObjectId(orderId) : orderId;
    const payments = await paymentModel.aggregate([
      { $match: { order: oid } },
      { $group: { _id: "$order", totalPaid: { $sum: "$amount" } } },
    ]);
    const totalPaid = payments && payments[0] ? payments[0].totalPaid : 0;
    const order = await orderModel.findById(orderId);
    if (!order) return { totalPaid, remaining: 0 };
    const remaining = Math.max(order.amount - totalPaid, 0);
    const nextStatus = totalPaid >= order.amount ? "Paid" : totalPaid > 0 ? "Partial" : "Unpaid";
    if (order.paymentStatus !== nextStatus) {
      order.paymentStatus = nextStatus;
      await order.save();
    }
    return { totalPaid, remaining };
  } catch (e) {
    return { totalPaid: 0, remaining: 0 };
  }
}

async function recalcPurchasePayment(purchaseOrderId) {
  try {
    const pid = typeof purchaseOrderId === "string" ? new mongoose.Types.ObjectId(purchaseOrderId) : purchaseOrderId;
    const payments = await paymentModel.aggregate([
      { $match: { purchaseOrder: pid } },
      { $group: { _id: "$purchaseOrder", totalPaid: { $sum: "$amount" } } },
    ]);
    const totalPaid = payments && payments[0] ? payments[0].totalPaid : 0;
    const po = await purchaseOrderModel.findById(purchaseOrderId);
    if (!po) return { totalPaid, remaining: 0 };
    const remaining = Math.max(po.totalAmount - totalPaid, 0);
    return { totalPaid, remaining };
  } catch (e) {
    return { totalPaid: 0, remaining: 0 };
  }
}

class PaymentsController {
  async listByOrder(req, res) {
    const { orderId } = req.params;
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();
      const base = { order: orderId };
      const filter = q ? { ...base, $or: [ { note: { $regex: q, $options: 'i' } }, { paymentMethod: { $regex: q, $options: 'i' } } ] } : base;
      const total = await paymentModel.countDocuments(filter);
      const payments = await paymentModel
        .find(filter)
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const summary = await recalcOrderPayment(orderId);
      return res.json({ payments, total, page, limit, summary });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async listByPurchaseOrder(req, res) {
    const { purchaseOrderId } = req.params;
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();
      const base = { purchaseOrder: purchaseOrderId };
      const filter = q ? { ...base, $or: [ { note: { $regex: q, $options: 'i' } }, { paymentMethod: { $regex: q, $options: 'i' } } ] } : base;
      const total = await paymentModel.countDocuments(filter);
      const payments = await paymentModel
        .find(filter)
        .sort({ paymentDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      const summary = await recalcPurchasePayment(purchaseOrderId);
      return res.json({ payments, total, page, limit, summary });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req, res) {
    const { order, purchaseOrder, paymentMethod, amount, paymentDate, note } = req.body;
    if ((!order && !purchaseOrder) || (order && purchaseOrder) || !paymentMethod || !amount || !paymentDate) {
      return res.json({ message: "All filled must be required" });
    }
    try {
      // Business rules: cannot overpay; if fully paid, reject
      if (order) {
        const summary = await recalcOrderPayment(order);
        if (summary.remaining <= 0) return res.status(400).json({ error: "Đơn hàng đã thanh toán đủ" });
        if (Number(amount) > summary.remaining) return res.status(400).json({ error: "Số tiền vượt quá số còn lại" });
      } else if (purchaseOrder) {
        const summary = await recalcPurchasePayment(purchaseOrder);
        if (summary.remaining <= 0) return res.status(400).json({ error: "Đơn nhập đã thanh toán đủ" });
        if (Number(amount) > summary.remaining) return res.status(400).json({ error: "Số tiền vượt quá số còn lại" });
      }

      const doc = {
        order: order || undefined,
        purchaseOrder: purchaseOrder || undefined,
        direction: order ? "in" : "out",
        paymentMethod,
        amount,
        paymentDate,
        note: note || null,
      };
      const created = await new paymentModel(doc).save();

      // Create cashbook entry
      const cashbookDoc = {
        payment: created._id,
        direction: created.direction,
        source: created.order ? "order" : "purchase",
        amount: created.amount,
        paymentMethod: created.paymentMethod,
        paymentDate: created.paymentDate,
        note: created.note || null,
        createdBy: (req.userDetails && req.userDetails._id) || null,
      };
      if (created.order) cashbookDoc.order = created.order;
      if (created.purchaseOrder) cashbookDoc.purchaseOrder = created.purchaseOrder;
      await new cashbookModel(cashbookDoc).save();

      const summary = order ? await recalcOrderPayment(order) : await recalcPurchasePayment(purchaseOrder);

      // Update purchase order payment status and auto-complete if both paid and received
      if (purchaseOrder) {
        const po = await purchaseOrderModel.findById(purchaseOrder);
        if (po) {
          const newPaymentStatus = summary.remaining <= 0 ? "Paid" : summary.totalPaid > 0 ? "Partial" : "Unpaid";
          po.paymentStatus = newPaymentStatus;

          // Auto-complete if both received and paid
          if (po.warehouseStatus === "Received" && newPaymentStatus === "Paid") {
            po.status = "Completed";
          }

          await po.save();
        }
      }

      return res.json({ success: "Payment recorded", payment: created, summary });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { paymentMethod, amount, paymentDate, note } = req.body;
    if (!id) return res.json({ message: "All filled must be required" });
    try {
      const existing = await paymentModel.findById(id);
      if (!existing) return res.status(404).json({ error: "Payment not found" });

      // Overpay protection on update
      if (existing.order) {
        const agg = await paymentModel.aggregate([
          { $match: { order: new mongoose.Types.ObjectId(existing.order), _id: { $ne: new mongoose.Types.ObjectId(id) } } },
          { $group: { _id: "$order", totalPaid: { $sum: "$amount" } } },
        ]);
        const paidOthers = agg && agg[0] ? agg[0].totalPaid : 0;
        const orderDoc = await orderModel.findById(existing.order);
        const remainingCap = Math.max(orderDoc.amount - paidOthers, 0);
        if (Number(amount) > remainingCap) return res.status(400).json({ error: "Số tiền vượt quá số còn lại" });
      } else if (existing.purchaseOrder) {
        const agg = await paymentModel.aggregate([
          { $match: { purchaseOrder: new mongoose.Types.ObjectId(existing.purchaseOrder), _id: { $ne: new mongoose.Types.ObjectId(id) } } },
          { $group: { _id: "$purchaseOrder", totalPaid: { $sum: "$amount" } } },
        ]);
        const paidOthers = agg && agg[0] ? agg[0].totalPaid : 0;
        const poDoc = await purchaseOrderModel.findById(existing.purchaseOrder);
        const remainingCap = Math.max(poDoc.totalAmount - paidOthers, 0);
        if (Number(amount) > remainingCap) return res.status(400).json({ error: "Số tiền vượt quá số còn lại" });
      }

      const updated = await paymentModel.findByIdAndUpdate(
        id,
        { paymentMethod, amount, paymentDate, note: note || null, updatedAt: Date.now() },
        { new: true }
      );

      // Update cashbook entry
      await cashbookModel.findOneAndUpdate(
        { payment: updated._id },
        { paymentMethod: updated.paymentMethod, amount: updated.amount, paymentDate: updated.paymentDate, note: updated.note || null }
      );

      const summary = updated.order ? await recalcOrderPayment(updated.order) : await recalcPurchasePayment(updated.purchaseOrder);
      return res.json({ success: "Payment updated", payment: updated, summary });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async remove(req, res) {
    const { id } = req.params;
    try {
      const existing = await paymentModel.findById(id);
      if (!existing) return res.status(404).json({ error: "Payment not found" });
      await paymentModel.findByIdAndDelete(id);
      await cashbookModel.findOneAndDelete({ payment: id });
      const summary = existing.order ? await recalcOrderPayment(existing.order) : await recalcPurchasePayment(existing.purchaseOrder);
      return res.json({ success: "Payment deleted", summary });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new PaymentsController();


