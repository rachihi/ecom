const paymentModel = require("../models/payments");
const orderModel = require("../models/orders");

async function recalcPaymentStatus(orderId) {
  const payments = await paymentModel.aggregate([
    { $match: { order: orderModel.Types.ObjectId ? orderModel.Types.ObjectId(orderId) : orderId } },
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
}

class PaymentsController {
  async listByOrder(req, res) {
    const { orderId } = req.params;
    try {
      const payments = await paymentModel.find({ order: orderId }).sort({ paymentDate: -1 });
      const summary = await recalcPaymentStatus(orderId);
      return res.json({ payments, summary });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req, res) {
    const { order, paymentMethod, amount, paymentDate, note } = req.body;
    if (!order || !paymentMethod || !amount || !paymentDate) return res.json({ message: "All filled must be required" });
    try {
      const created = await new paymentModel({ order, paymentMethod, amount, paymentDate, note: note || null }).save();
      const summary = await recalcPaymentStatus(order);
      return res.json({ success: "Payment recorded", payment: created, summary });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new PaymentsController();


