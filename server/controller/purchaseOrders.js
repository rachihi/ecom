const purchaseOrderModel = require("../models/purchaseOrders");
const purchaseOrderDetailModel = require("../models/purchaseOrderDetails");
const warehouseModel = require("../models/warehouses");
const productModel = require("../models/products");
const paymentModel = require("../models/payments");
const cashbookModel = require("../models/cashbook");


class PurchaseOrdersController {
  async list(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();

      let filter = {};
      if (q) {
        const supplierModel = require("../models/suppliers");
        const sups = await supplierModel.find({ name: { $regex: q, $options: 'i' } }).select('_id');
        const ids = sups.map((s) => s._id);
        filter.supplier = { $in: ids.length ? ids : [null] };
      }

      const total = await purchaseOrderModel.countDocuments(filter);
      const list = await purchaseOrderModel
        .find(filter)
        .populate("supplier")
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Calculate totalPaid and get details for each purchase order
      const mongoose = require("mongoose");
      const listWithPayments = await Promise.all(
        list.map(async (po) => {
          const payments = await paymentModel.aggregate([
            { $match: { purchaseOrder: new mongoose.Types.ObjectId(po._id) } },
            { $group: { _id: "$purchaseOrder", totalPaid: { $sum: "$amount" } } },
          ]);
          const totalPaid = payments && payments[0] ? payments[0].totalPaid : 0;

          // Get details from purchaseorderdetails table
          const details = await purchaseOrderDetailModel.find({ purchaseOrder: po._id });

          return { ...po.toObject(), totalPaid, details };
        })
      );

      return res.json({ purchaseOrders: listWithPayments, total, page, limit });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getById(req, res) {
    const { id } = req.params;
    try {
      const po = await purchaseOrderModel
        .findById(id)
        .populate("supplier");
      if (!po) return res.status(404).json({ error: "Not found" });

      // Get details from purchaseorderdetails table
      const details = await purchaseOrderDetailModel.find({ purchaseOrder: id });

      return res.json({ purchaseOrder: { ...po.toObject(), details } });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async create(req, res) {
    const { supplier, items, totalAmount, payment } = req.body;
    if (!supplier || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
      return res.json({ message: "All filled must be required" });
    }
    try {
      // Generate order code: PO-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const count = await purchaseOrderModel.countDocuments({
        createdAt: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      });
      const orderCode = `PO-${dateStr}-${String(count + 1).padStart(4, '0')}`;

      const created = await new purchaseOrderModel({
        orderCode,
        supplier,
        items: [], // Keep empty, use purchaseorderdetails table
        totalAmount,
        status: "Pending",
        warehouseStatus: "NotReceived",
        paymentStatus: "Unpaid"
      }).save();

      // Create purchase order details (snapshot of products)
      for (const item of items) {
        const product = await productModel.findById(item.product);
        if (!product) continue;

        await new purchaseOrderDetailModel({
          purchaseOrder: created._id,
          productId: item.product,
          productName: product.pName,
          productImage: product.pImages && product.pImages.length > 0 ? product.pImages[0] : null,
          productPrice: item.price,
          quantity: item.quantity,
          totalPrice: item.quantity * item.price,
        }).save();
      }

      // Create payment if provided
      if (payment && payment.amount && payment.paymentMethod) {
        const paymentAmount = Number(payment.amount);
        if (paymentAmount > 0 && paymentAmount <= totalAmount) {
          const payDoc = await new paymentModel({
            purchaseOrder: created._id,
            direction: "out",
            paymentMethod: payment.paymentMethod,
            amount: paymentAmount,
            paymentDate: payment.paymentDate || new Date(),
            note: payment.note || null,
          }).save();

          // Create cashbook entry
          const cashbookDoc = {
            payment: payDoc._id,
            direction: "out",
            source: "purchase",
            purchaseOrder: created._id,
            amount: paymentAmount,
            paymentMethod: payDoc.paymentMethod,
            paymentDate: payDoc.paymentDate,
            note: payDoc.note || null,
            createdBy: (req.userDetails && req.userDetails._id) || null,
          };
          await new cashbookModel(cashbookDoc).save();

          // Update payment status
          const totalPaid = paymentAmount;
          const remaining = totalAmount - totalPaid;
          created.paymentStatus = remaining <= 0 ? "Paid" : "Partial";
          await created.save();
        }
      }

      return res.json({ success: "Purchase order created", purchaseOrder: created });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { supplier, items, totalAmount } = req.body;
    try {
      const po = await purchaseOrderModel.findById(id);
      if (!po) return res.status(404).json({ error: "Not found" });

      if (supplier !== undefined) po.supplier = supplier;
      if (totalAmount !== undefined) po.totalAmount = totalAmount;

      // Update details if items provided
      if (items !== undefined && Array.isArray(items)) {
        // Delete old details
        await purchaseOrderDetailModel.deleteMany({ purchaseOrder: id });

        // Create new details
        for (const item of items) {
          const product = await productModel.findById(item.product);
          if (!product) continue;

          await new purchaseOrderDetailModel({
            purchaseOrder: id,
            productId: item.product,
            productName: product.pName,
            productImage: product.pImages && product.pImages.length > 0 ? product.pImages[0] : null,
            productPrice: item.price,
            quantity: item.quantity,
            totalPrice: item.quantity * item.price,
          }).save();
        }
      }

      await po.save();
      return res.json({ success: "Purchase order updated", purchaseOrder: po });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }


  // Mark as received (nhập kho)
  async markReceived(req, res) {
    const { id } = req.params;
    try {
      const po = await purchaseOrderModel.findById(id);
      if (!po) return res.status(404).json({ error: "Not found" });

      if (po.warehouseStatus === "Received") {
        return res.status(400).json({ error: "Đơn hàng đã được nhập kho" });
      }

      // Get details from purchaseorderdetails table
      const details = await purchaseOrderDetailModel.find({ purchaseOrder: id });

      // Increment stock
      for (const detail of details) {
        if (!detail.productId) continue; // Skip if product was deleted

        await warehouseModel.findOneAndUpdate(
          { product: detail.productId },
          { $inc: { quantity: detail.quantity }, lastUpdated: Date.now() },
          { upsert: true }
        );
        await productModel.findByIdAndUpdate(detail.productId, { $inc: { pQuantity: detail.quantity } });
      }

      po.warehouseStatus = "Received";

      // Auto-complete if both received and paid
      if (po.paymentStatus === "Paid") {
        po.status = "Completed";
      }

      await po.save();
      return res.json({ success: "Đã nhập kho", purchaseOrder: po });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async remove(req, res) {
    const { id } = req.params;
    try {
      const deleted = await purchaseOrderModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      return res.json({ success: "Purchase order deleted" });
    } catch (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new PurchaseOrdersController();


