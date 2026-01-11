const orderModel = require("../models/orders");
const orderDetailModel = require("../models/orderDetails");
const productModel = require("../models/products");
const warehouseModel = require("../models/warehouses");
const customerModel = require("../models/customers");
const paymentModel = require("../models/payments");
const cashbookModel = require("../models/cashbook");

class Order {
  async getAllOrders(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();

      let filter = {};
      if (q) {
        try {
          const customers = await customerModel
            .find({ fullName: { $regex: q, $options: 'i' } })
            .select('_id');
          const ids = customers.map((c) => c._id);
          filter = {
            $or: [
              { transactionId: { $regex: q, $options: 'i' } },
              { customer: { $in: ids } },
            ],
          };
        } catch (e) {
          filter = { transactionId: { $regex: q, $options: 'i' } };
        }
      }

      const total = await orderModel.countDocuments(filter);
      const list = await orderModel
        .find(filter)
        .populate("user", "name email")
        .populate("customer")
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const Orders = await Promise.all(list.map(async (order) => {
        const details = await orderDetailModel.find({ order: order._id });
        return { ...order.toObject(), details };
      }));

      return res.json({ Orders, total, page, limit });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async getOrderByUser(req, res) {
    let { uId } = req.body;
    if (!uId) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        const list = await orderModel
          .find({ user: uId })
          .populate("user", "name email")
          .populate("customer")
          .sort({ _id: -1 });

        const Order = await Promise.all(list.map(async (order) => {
          const details = await orderDetailModel.find({ order: order._id });
          return { ...order.toObject(), details };
        }));

        if (Order) {
          return res.json({ Order });
        }
      } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  async getOrdersByCustomer(req, res) {
    try {
      const customerId = req.customerDetails._id;
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);

      const total = await orderModel.countDocuments({ customer: customerId });
      const list = await orderModel
        .find({ customer: customerId })
        .populate("user", "name email")
        .populate("customer")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      console.log('Fetching orders for customer:', customerId, 'Page:', page, 'Count:', list.length);

      const Orders = await Promise.all(list.map(async (order) => {
        const details = await orderDetailModel.find({ order: order._id });
        return { ...order.toObject(), details };
      }));

      return res.json({
        Orders,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  async postCreateOrder(req, res) {
    let { allProduct, user, amount, transactionId, address, phone, customerId, customer, paymentStatus, paymentMethod } = req.body;
    if (
      !allProduct ||
      amount === undefined ||
      !transactionId ||
      !address ||
      phone === undefined
    ) {
      return res.json({ message: "All filled must be required" });
    } else {
      // Use authenticated user if available, otherwise use guest user
      const userId = user || (req.userDetails && req.userDetails._id) || null;
      try {
        // Resolve customer: use existing or create new on-the-fly
        let resolvedCustomerId = customerId;
        if (!resolvedCustomerId && customer) {
          const created = await new customerModel({
            user: userId,
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber,
            email: customer.email || 'guest@example.com',
            address: customer.address,
            taxCode: customer.taxCode || null,
          }).save();
          resolvedCustomerId = created && created._id;
        }

        // Generate Order Code
        const date = new Date();
        const orderCode = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Create Order
        let newOrder = new orderModel({
          orderCode,
          user: userId,
          customer: resolvedCustomerId || null,
          amount,
          transactionId,
          address,
          phone,
          paymentStatus: paymentStatus || 'Unpaid',
          paymentMethod: paymentMethod || 'Cash'
        });
        let save = await newOrder.save();

        if (save) {
          // Create Order Details and Adjust Stock
          for (const item of allProduct) {
            if (item && item.id && item.quantitiy) {
              const product = await productModel.findById(item.id);
              if (product) {
                // Calculate price with discount
                const finalPrice = product.pPrice - (product.pPrice * (product.pDiscount || 0) / 100);

                // Create Order Detail Snapshot
                await new orderDetailModel({
                  order: save._id,
                  productId: item.id,
                  productName: product.pName,
                  productImage: product.pImages && product.pImages.length > 0 ? product.pImages[0] : null,
                  productPrice: finalPrice,
                  quantity: item.quantitiy,
                  totalPrice: finalPrice * item.quantitiy
                }).save();
              }
            }
          }

          // Record Payment if Paid (e.g. PayPal)
          if (paymentStatus === 'Paid') {
            try {
              const payDoc = await new paymentModel({
                order: save._id,
                direction: "in",
                paymentMethod: paymentMethod || 'BankTransfer',
                amount: amount,
                paymentDate: new Date(),
                note: `Đã thanh toán online qua tài khoản ngân hàng`,
              }).save();

              await new cashbookModel({
                payment: payDoc._id,
                direction: "in",
                source: "order",
                order: save._id,
                amount: amount,
                paymentMethod: payDoc.paymentMethod,
                paymentDate: payDoc.paymentDate,
                note: payDoc.note,
                createdBy: userId // use user ID if available
              }).save();
            } catch (payErr) {
              console.error("Failed to record payment/cashbook", payErr);
            }
          }

          return res.json({ success: "Order created successfully", order: save });
        }
      } catch (err) {
        console.error(err);
        return res.json({ error: err?.message || "Failed to create order" });
      }
    }
  }

  async postUpdateOrder(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        // Check if order is already delivered (cannot update)
        const order = await orderModel.findById(oId);
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }
        if (order.status === "Delivered") {
          return res.status(400).json({ error: "Không thể cập nhật trạng thái đơn hàng đã giao" });
        }

        // If updating to Delivered, deduct stock
        if (status === "Delivered") {
          const orderDetails = await orderDetailModel.find({ order: oId });
          for (const detail of orderDetails) {
            try {
              await warehouseModel.findOneAndUpdate(
                { product: detail.productId },
                { $inc: { quantity: -Math.abs(detail.quantity), sold: +Math.abs(detail.quantity) }, lastUpdated: Date.now() },
                { upsert: true }
              );
            } catch (stockErr) {
              console.error(`Stock update failed for product ${detail.productId}`, stockErr);
            }
          }
        }

        await orderModel.findByIdAndUpdate(oId, {
          status: status,
          updatedAt: Date.now(),
        });
        return res.json({ success: "Order updated successfully" });
      } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  async postDeleteOrder(req, res) {
    let { oId } = req.body;
    if (!oId) {
      return res.json({ error: "All filled must be required" });
    } else {
      try {
        let deleteOrder = await orderModel.findByIdAndDelete(oId);
        if (deleteOrder) {
          // Also delete details
          await orderDetailModel.deleteMany({ order: oId });
          return res.json({ success: "Order deleted successfully" });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  async putCancelOrder(req, res) {
    let { oId } = req.body;
    let customerId = req.customerDetails._id;

    if (!oId) {
      return res.json({ error: "Order ID is required" });
    } else {
      try {
        const order = await orderModel.findOne({ _id: oId, customer: customerId });
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }
        if (order.paymentStatus !== "Unpaid") {
          return res.status(400).json({ error: "Cannot cancel paid order" });
        }
        if (order.status === "Delivered" || order.status === "Cancelled") {
          return res.status(400).json({ error: "Cannot cancel order in this status" });
        }

        // If order was Shipped, should we allow cancel? Probably strict "Unpaid" implies it hasn't gone far, 
        // but robust systems might check Shipping status too. Plan said "Not Delivered". 
        // Safest is to allow cancel if Unpaid + Not Delivered + Not Cancelled.

        await orderModel.findByIdAndUpdate(oId, {
          status: "Cancelled",
          updatedAt: Date.now(),
        });
        return res.json({ success: "Order cancelled successfully" });
      } catch (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }

  // ===========================
  // EXPORT ONLY
  // ===========================

  async getExportOrders(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");

      const q = (req.query.q || '').trim();
      const type = req.query.type || 'all';

      let filter = {};
      if (type === 'filtered' && q) {
        // Reuse search logic from getAllOrders
        try {
          const customers = await customerModel
            .find({ fullName: { $regex: q, $options: 'i' } })
            .select('_id');
          const ids = customers.map((c) => c._id);
          filter = {
            $or: [
              { transactionId: { $regex: q, $options: 'i' } },
              { customer: { $in: ids } },
            ],
          };
        } catch (e) {
          filter = { transactionId: { $regex: q, $options: 'i' } };
        }
      }

      const orders = await orderModel
        .find(filter)
        .populate("customer")
        .sort({ _id: -1 });

      const data = orders.map(o => ({
        orderCode: o.orderCode || o.transactionId,
        customerName: o.customer ? o.customer.fullName : 'Guest',
        amount: o.amount,
        paymentStatus: o.paymentStatus,
        status: o.status,
        createdAt: o.createdAt ? o.createdAt.toISOString().split('T')[0] : ''
      }));

      const columns = [
        { header: 'Order Code', key: 'orderCode', width: 20 },
        { header: 'Customer', key: 'customerName', width: 25 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Delivery Status', key: 'status', width: 15 },
        { header: 'Created At', key: 'createdAt', width: 15 },
      ];

      const buffer = await excelHandler.generateExcel(data, columns, 'Orders');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=orders_${type}_${Date.now()}.xlsx`);
      return res.send(buffer);

    } catch (err) {
      console.log(err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

const ordersController = new Order();
module.exports = ordersController;
