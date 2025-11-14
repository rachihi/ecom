const orderModel = require("../models/orders");

class Order {
  async getAllOrders(req, res) {
    try {
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();

      let filter = {};
      if (q) {
        try {
          const customerModel = require("../models/customers");
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
      const Orders = await orderModel
        .find(filter)
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .populate("customer")
        .sort({ _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

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
        let Order = await orderModel
          .find({ user: uId })
          .populate("allProduct.id", "pName pImages pPrice")
          .populate("user", "name email")
          .populate("customer")
          .sort({ _id: -1 });
        if (Order) {
          return res.json({ Order });
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  async postCreateOrder(req, res) {
    let { allProduct, user, amount, transactionId, address, phone, customerId, customer } = req.body;
    if (
      !allProduct ||
      !amount ||
      !transactionId ||
      !address ||
      !phone
    ) {
      return res.json({ message: "All filled must be required" });
    } else {
      // Use authenticated user if available, otherwise use guest user
      const userId = user || (req.userDetails && req.userDetails._id) || null;
      try {
        // Resolve customer: use existing or create new on-the-fly
        let resolvedCustomerId = customerId;
        if (!resolvedCustomerId && customer) {
          const customerModel = require("../models/customers");
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

        // Allow guest orders without customer
        // if (!resolvedCustomerId) {
        //   return res.json({ message: "Customer is required" });
        // }

        let newOrder = new orderModel({
          allProduct,
          user: userId,
          customer: resolvedCustomerId || null,
          amount,
          transactionId,
          address,
          phone,
        });
        let save = await newOrder.save();
        if (save) {
          // Adjust stock for each product (decrement) and update product counters
          try {
            const warehouseModel = require("../models/warehouses");
            const productModel = require("../models/products");
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
            // continue even if stock update fails
          }
          return res.json({ success: "Order created successfully" });
        }
      } catch (err) {
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

        let currentOrder = orderModel.findByIdAndUpdate(oId, {
          status: status,
          updatedAt: Date.now(),
        });
        currentOrder.exec((err, result) => {
          if (err) console.log(err);
          return res.json({ success: "Order updated successfully" });
        });
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
          return res.json({ success: "Order deleted successfully" });
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}

const ordersController = new Order();
module.exports = ordersController;
