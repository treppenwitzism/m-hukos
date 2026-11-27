const { withTransaction } = require('../config/db');
const Order = require('../models/order.model');
const httpError = require('../utils/httpError');
const crypto = require('crypto');
const QrToken = require('../models/qrToken.model');
const Points = require('./points.service');
const Schedule = require('./schedule.service');

const MAX_LINES = 30;
const MAX_QUANTITY = 20;
const QR_TTL_HOURS = Number(process.env.QR_TOKEN_TTL_HOURS) || 24;

// For advanced orders: clock starts at the pickup time
function tokenExpiry(scheduledFor) {
  const start = scheduledFor
    ? Math.max(Date.now(), new Date(scheduledFor).getTime())
    : Date.now();
  return new Date(start + QR_TTL_HOURS * 60 * 60 * 1000);
}

const PAYMENT_METHODS = ['counter', 'paymongo'];

function parsePaymentMethod(value, scheduledFor) {
  // Default: counter for pickup-now orders, online for scheduled ones
  const method = value === undefined ? (scheduledFor ? 'paymongo' : 'counter') : value;
  if (!PAYMENT_METHODS.includes(method)) {
    throw httpError(400, "payment_method must be 'counter' or 'paymongo'.");
  }
  if (method === 'counter' && scheduledFor) {
    throw httpError(400, 'Scheduled orders must be paid online.');
  }
  return method;
}

// Checks the request shape and merges repeated items into one line each,
// so [{id 1, qty 1}, {id 1, qty 2}] becomes id 1 with qty 3
function parseLines(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'Your order has no items.');
  }
  if (items.length > MAX_LINES) {
    throw httpError(400, `An order can have at most ${MAX_LINES} different items.`);
  }

  const quantities = new Map();
  for (const line of items) {
    const id = line && line.menu_item_id;
    const quantity = line && line.quantity;

    if (!Number.isInteger(id) || id < 1) {
      throw httpError(400, 'Each item needs a valid menu_item_id.');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw httpError(400, 'Each quantity must be a whole number of at least 1.');
    }
    quantities.set(id, (quantities.get(id) || 0) + quantity);
  }

  for (const quantity of quantities.values()) {
    if (quantity > MAX_QUANTITY) {
      throw httpError(400, `You can order at most ${MAX_QUANTITY} of one item.`);
    }
  }
  return quantities;
}

async function createOrder(user, body) {
  const quantities = parseLines(body.items);
  const scheduledFor = body.scheduled_for ? Schedule.parsePickupTime(body.scheduled_for) : null;
  const paymentMethod = parsePaymentMethod(body.payment_method, scheduledFor);

  // Any error undones the whole transaction
  const orderId = await withTransaction(async (db) => {
    const menuItems = await Order.findMenuItemsByIds([...quantities.keys()], db);

    if (menuItems.length !== quantities.size) {
      throw httpError(400, 'Some items on your order no longer exist.');
    }

    const unavailable = menuItems.filter((item) => !item.is_available);
    if (unavailable.length > 0) {
      const names = unavailable.map((item) => item.name).join(', ');
      throw httpError(409, `Currently unavailable: ${names}.`);
    }

    // Prices come from the database
    const lines = menuItems.map((item) => ({
      menu_item_id: item.id,
      quantity: quantities.get(item.id),
      unit_price: item.price,
      points_each: item.points_reward,
    }));

    // Add up in whole cents
    const totalCents = lines.reduce(
      (sum, line) => sum + Math.round(line.unit_price * 100) * line.quantity,
      0
    );

    const id = await Order.createOrder(
      { user_id: user.id, total: totalCents / 100, scheduled_for: scheduledFor },
      db
    );
    await Order.createOrderItems(id, lines, db);
    await Order.setPaymentMethod(id, paymentMethod, db);

    // Counter orders get their QR straight away so staff can scan it at the counter.
    if (paymentMethod === 'counter') {
      await QrToken.create(
        {
          order_id: id,
          token: crypto.randomBytes(24).toString('hex'),
          expires_at: tokenExpiry(null),
        },
        db
      );
    }
    return id;
  });

  return Order.findOrderById(orderId);
}

function listMyOrders(user) {
  return Order.listOrdersByUser(user.id);
}

async function getOrder(user, id) {
  const order = await Order.findOrderById(id);
  const canView = order && (order.user_id === user.id || ['staff', 'admin'].includes(user.role));

  // 404 instead of 403 for other people's orders, so nobody can probe which order numbers exist
  if (!canView) throw httpError(404, 'Order not found.');
  return order;
}

async function cancelOrder(user, id) {
  const order = await Order.findOrderById(id);
  if (!order || order.user_id !== user.id) throw httpError(404, 'Order not found.');

  if (order.status !== 'pending') {
    throw httpError(409, 'Only unpaid orders can be cancelled.');
  }

  // The UPDATE re-checks "pending", in case the order got paid
  const cancelled = await Order.cancelIfPending(id);
  if (!cancelled) throw httpError(409, 'Only unpaid orders can be cancelled.');

  return Order.findOrderById(id);
}

// Called when payment is confirmed by PayMongo webhook
async function markPaid(orderId) {
  const order = await Order.findOrderById(orderId);
  if (!order) throw httpError(404, 'Order not found.');
  if (order.payment_method === 'counter') {
    throw httpError(409, 'Counter orders are paid by staff at the counter.');
  }

  await withTransaction(async (db) => {
    const changed = await Order.markPaidIfPending(orderId, db);
    if (!changed) return;

    await QrToken.create(
      {
        order_id: orderId,
        token: crypto.randomBytes(24).toString('hex'),
        expires_at: tokenExpiry(order.scheduled_for),
      },
      db
    );
    await Points.awardForOrder(order, db);
  });

  const updated = await Order.findOrderById(orderId);
  if (!['paid', 'fulfilled'].includes(updated.status)) {
    throw httpError(409, 'Only pending orders can be marked as paid.');
  }
  return updated;
}

module.exports = { createOrder, listMyOrders, getOrder, cancelOrder, markPaid };