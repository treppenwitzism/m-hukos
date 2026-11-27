const { withTransaction } = require('../config/db');
const Order = require('../models/order.model');
const QrToken = require('../models/qrToken.model');
const User = require('../models/user.model');
const httpError = require('../utils/httpError');
const Points = require('./points.service');

// Tokens are 48 hex characters
const TOKEN_PATTERN = /^[a-f0-9]{48}$/;

async function findToken(token) {
  const row = TOKEN_PATTERN.test(token) ? await QrToken.findByToken(token) : null;
  if (!row) throw httpError(404, 'This QR code is invalid or has expired.');
  return row;
}

// Customer: get the link to turn into a QR image
async function getOrderQr(user, orderId) {
  const order = await Order.findOrderById(orderId);
  if (!order || order.user_id !== user.id) throw httpError(404, 'Order not found.');

  const awaitingCounter = order.status === 'pending' && order.payment_method === 'counter';
  if (!awaitingCounter && !['paid', 'fulfilled'].includes(order.status)) {
    throw httpError(409, 'This order has not been paid yet.');
  }

  const row = await QrToken.findByOrderId(orderId);
  if (!row || row.expires_at < new Date()) {
    throw httpError(410, 'This QR code has expired.');
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
  return {
    token: row.token,
    url: `${clientUrl}/staff/verify/${row.token}`,
    expires_at: row.expires_at,
    redeemed: Boolean(row.redeemed_at),
    order_status: order.status,
    payment_due: awaitingCounter,
  };
}

// Staff: look at a scanned order without changing anything
async function lookup(token) {
  const row = await findToken(token);
  const order = await Order.findOrderById(row.order_id);
  const customer = await User.findById(order.user_id);

  let state = 'ready';
  if (row.redeemed_at) state = 'redeemed';
  else if (order.status === 'cancelled') state = 'cancelled';
  else if (order.status === 'expired' || row.expires_at < new Date()) state = 'expired';

  const paymentDue = order.status === 'pending' && order.payment_method === 'counter';

  return {
    state,
    payment_due: paymentDue,
    amount_due: paymentDue ? order.total : 0,
    expires_at: row.expires_at,
    redeemed_at: row.redeemed_at,
    customer: { name: customer.name },
    order,
  };
}

// Staff: confirm the handover. Works once per order
async function redeem(token) {
  const row = await findToken(token);

  if (row.redeemed_at) throw httpError(409, 'This order was already handed over.');
  if (row.expires_at < new Date()) throw httpError(410, 'This QR code has expired.');

  await withTransaction(async (db) => {
    const claimed = await QrToken.markRedeemed(row.id, new Date(), db);
    if (!claimed) throw httpError(409, 'This order was already handed over.');

    const order = await Order.findOrderById(row.order_id);

    // Counter order: staff collect the payment as part of the handover.
    if (order.status === 'pending') {
      if (order.payment_method !== 'counter') {
        throw httpError(409, 'This order has not been paid online yet.');
      }
      const paid = await Order.markPaidIfPending(order.id, db);
      if (!paid) throw httpError(409, 'This order can no longer be paid.');
      await Points.awardForOrder(order, db);
    }

    const fulfilled = await Order.markFulfilled(row.order_id, db);
    if (!fulfilled) throw httpError(409, 'This order cannot be handed over.');
  });

  return Order.findOrderById(row.order_id);
}

module.exports = { getOrderQr, lookup, redeem };