const { withTransaction } = require('../config/db');
const Order = require('../models/order.model');
const httpError = require('../utils/httpError');

const MAX_LINES = 30;
const MAX_QUANTITY = 20;

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
    }));

    // Add up in whole cents
    const totalCents = lines.reduce(
      (sum, line) => sum + Math.round(line.unit_price * 100) * line.quantity,
      0
    );

    const id = await Order.createOrder(
      { user_id: user.id, total: totalCents / 100, scheduled_for: null },
      db
    );
    await Order.createOrderItems(id, lines, db);
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

module.exports = { createOrder, listMyOrders, getOrder, cancelOrder };