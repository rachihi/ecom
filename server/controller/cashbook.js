const cashbookModel = require("../models/cashbook");

class CashbookController {
  async list(req, res) {
    try {
      const { from, to } = req.query;
      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit) || 10, 100);
      const q = (req.query.q || '').trim();

      const filter = {};
      if (from || to) {
        filter.paymentDate = {};
        if (from) filter.paymentDate.$gte = new Date(from);
        if (to) filter.paymentDate.$lte = new Date(to);
      }
      if (q) {
        filter.$or = [
          { note: { $regex: q, $options: 'i' } },
          { paymentMethod: { $regex: q, $options: 'i' } }
        ];
      }

      const total = await cashbookModel.countDocuments(filter);

      const entries = await cashbookModel
        .find(filter)
        .populate('order', 'transactionId amount')
        .populate('purchaseOrder', 'totalAmount status')
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Summary for the filtered set (not just the current page)
      const sum = await cashbookModel.aggregate([
        { $match: (function() {
          const m = {};
          if (filter.paymentDate) m.paymentDate = filter.paymentDate;
          if (filter.$or) m.$or = filter.$or;
          return m;
        })() },
        {
          $group: {
            _id: null,
            totalIn: {
              $sum: {
                $cond: [ { $eq: ['$direction', 'in'] }, '$amount', 0 ]
              }
            },
            totalOut: {
              $sum: {
                $cond: [ { $eq: ['$direction', 'out'] }, '$amount', 0 ]
              }
            }
          }
        }
      ]);
      const totalIn = sum && sum[0] ? sum[0].totalIn : 0;
      const totalOut = sum && sum[0] ? sum[0].totalOut : 0;
      const balance = totalIn - totalOut;

      return res.json({ entries, total, page, limit, summary: { totalIn, totalOut, balance } });
    } catch (err) {
      console.error('Cashbook list error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new CashbookController();

