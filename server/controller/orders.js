const orderModel = require("../models/orders");

class Order {
  async getAllOrders(req, res) {
    try {
      let Orders = await orderModel
        .find({})
        .populate("allProduct.id", "pName pImages pPrice")
        .populate("user", "name email")
        .populate("customer")
        .sort({ _id: -1 });
      if (Orders) {
        return res.json({ Orders });
      }
    } catch (err) {
      console.log(err);
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
      !user ||
      !amount ||
      !transactionId ||
      !address ||
      !phone
    ) {
      return res.json({ message: "All filled must be required" });
    } else {
      try {
        // Resolve customer: use existing or create new on-the-fly
        let resolvedCustomerId = customerId;
        if (!resolvedCustomerId && customer) {
          const customerModel = require("../models/customers");
          const created = await new customerModel({
            user: customer.user || null,
            fullName: customer.fullName,
            phoneNumber: customer.phoneNumber,
            email: customer.email,
            address: customer.address,
            taxCode: customer.taxCode || null,
          }).save();
          resolvedCustomerId = created && created._id;
        }
        if (!resolvedCustomerId) {
          return res.json({ message: "Customer is required" });
        }

        let newOrder = new orderModel({
          allProduct,
          user,
          customer: resolvedCustomerId,
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
        return res.json({ error: error });
      }
    }
  }

  async postUpdateOrder(req, res) {
    let { oId, status } = req.body;
    if (!oId || !status) {
      return res.json({ message: "All filled must be required" });
    } else {
      let currentOrder = orderModel.findByIdAndUpdate(oId, {
        status: status,
        updatedAt: Date.now(),
      });
      currentOrder.exec((err, result) => {
        if (err) console.log(err);
        return res.json({ success: "Order updated successfully" });
      });
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
