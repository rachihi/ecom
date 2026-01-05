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
        {
          $match: (function () {
            const m = {};
            if (filter.paymentDate) m.paymentDate = filter.paymentDate;
            if (filter.$or) m.$or = filter.$or;
            return m;
          })()
        },
        {
          $group: {
            _id: null,
            totalIn: {
              $sum: {
                $cond: [{ $eq: ['$direction', 'in'] }, '$amount', 0]
              }
            },
            totalOut: {
              $sum: {
                $cond: [{ $eq: ['$direction', 'out'] }, '$amount', 0]
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

  // ===========================
  // EXPORT ONLY
  // ===========================

  async getExportCashbook(req, res) {
    try {
      const excelHandler = require("../utils/excelHandler");

      const { from, to } = req.query;
      const q = (req.query.q || '').trim();
      const type = req.query.type || 'all';

      let filter = {};

      // Apply filters if 'filtered' type is requested OR if standard logic implies export should respect current view settings
      if (type === 'filtered') {
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
      }

      const entries = await cashbookModel
        .find(filter)
        .populate('order', 'transactionId')
        .populate('purchaseOrder', 'orderCode')
        .sort({ paymentDate: -1, createdAt: -1 });

      const data = entries.map(entry => ({
        paymentDate: entry.paymentDate ? entry.paymentDate.toISOString().split('T')[0] : '',
        direction: entry.direction === 'in' ? 'Thu' : 'Chi',
        source: entry.source,
        amount: entry.amount,
        paymentMethod: entry.paymentMethod,
        ref: entry.order ? entry.order.transactionId : (entry.purchaseOrder ? entry.purchaseOrder.orderCode : ''),
        note: entry.note || ''
      }));

      const columns = [
        { header: 'Date', key: 'paymentDate', width: 15 },
        { header: 'Type', key: 'direction', width: 10 },
        { header: 'Source', key: 'source', width: 15 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Method', key: 'paymentMethod', width: 15 },
        { header: 'Ref', key: 'ref', width: 20 },
        { header: 'Note', key: 'note', width: 30 },
      ];

      const buffer = await excelHandler.generateExcel(data, columns, 'Cashbook');

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=cashbook_${type}_${Date.now()}.xlsx`);
      return res.send(buffer);

    } catch (err) {
      console.error('Cashbook export error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new CashbookController();

