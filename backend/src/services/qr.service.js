const { withTransaction } = require('../config/db');
const Order = require('../models/order.model');
const QrToken = require('../models/qrToken.model');
const User = require('../models/user.model');
const httpError = require('../utils/httpError');

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

  if (!['paid', 'fulfilled'].includes(order.status)) {
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
  };
}

// Staff: look at a scanned order without changing anything
async function lookup(token) {
  const row = await findToken(token);
  const order = await Order.findOrderById(row.order_id);
  const customer = await User.findById(order.user_id);

  let state = 'ready';
  if (row.redeemed_at) state = 'redeemed';
  else if (row.expires_at < new Date()) state = 'expired';

  return {
    state,
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

    const fulfilled = await Order.markFulfilled(row.order_id, db);
    if (!fulfilled) throw httpError(409, 'This order is not in a paid state.');
  });

  return Order.findOrderById(row.order_id);
}

module.exports = { getOrderQr, lookup, redeem };