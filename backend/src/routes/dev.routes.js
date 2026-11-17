// TEMPORARY
// Literally only here because PayMongo is under maintenance for some fucking reason
// Replaced by the PayMongo webhook later
const express = require('express');
const orderService = require('../services/order.service');
const parseId = require('../utils/parseId');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.post('/orders/:id/mark-paid', async (req, res) => {
  const order = await orderService.markPaid(parseId(req.params.id));
  res.json({ order });
});

module.exports = router;