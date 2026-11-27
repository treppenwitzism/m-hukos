const { pool } = require('../config/db');

async function findMenuItemsByIds(ids, db = pool) {
  const [rows] = await db.query(
    'SELECT id, name, price, is_available, points_reward FROM menu_items WHERE id IN (?) AND is_deleted = 0',
    [ids]
  );
  return rows;
}

async function createOrder({ user_id, total, scheduled_for }, db = pool) {
  const [result] = await db.query(
    'INSERT INTO orders (user_id, total, scheduled_for) VALUES (?, ?, ?)',
    [user_id, total, scheduled_for]
  );
  return result.insertId;
}

// One INSERT for all lines
async function createOrderItems(orderId, lines, db = pool) {
  const values = lines.map((line) => [orderId, line.menu_item_id, line.quantity, line.unit_price, line.points_each]);
  await db.query(
    'INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, points_each) VALUES ?',
    [values]
  );
}

// Adds an "items" list to each order, using one query for all of them
async function attachItems(orders) {
  if (orders.length === 0) return [];

  const [items] = await pool.query(
    `SELECT oi.order_id, oi.id, oi.menu_item_id, mi.name, oi.quantity, oi.unit_price, oi.points_each
     FROM order_items oi
     JOIN menu_items mi ON mi.id = oi.menu_item_id
     WHERE oi.order_id IN (?)
     ORDER BY oi.id`,
    [orders.map((order) => order.id)]
  );

  return orders.map((order) => ({
    ...order,
    items: items
      .filter((item) => item.order_id === order.id)
      .map(({ order_id, ...item }) => ({
        ...item,
        line_total: Math.round(item.unit_price * 100 * item.quantity) / 100,
      })),
  }));
}

async function findOrderById(id) {
  const [rows] = await pool.query(
    'SELECT id, user_id, status, total, scheduled_for, created_at FROM orders WHERE id = ?',
    [id]
  );
  if (!rows[0]) return null;
  const [order] = await attachItems([rows[0]]);
  return order;
}

async function listOrdersByUser(userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT id, user_id, status, total, scheduled_for, created_at
     FROM orders WHERE user_id = ?
     ORDER BY created_at DESC, id DESC LIMIT ?`,
    [userId, limit]
  );
  return attachItems(rows);
}

// Changes only if still pending
async function cancelIfPending(id) {
  const [result] = await pool.query(
    "UPDATE orders SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
    [id]
  );
  return result.affectedRows === 1;
}

// Also only changes if still pending
async function markPaidIfPending(id, db = pool) {
  const [result] = await db.query(
    "UPDATE orders SET status = 'paid' WHERE id = ? AND status = 'pending'",
    [id]
  );
  return result.affectedRows === 1;
}

async function markFulfilled(id, db = pool) {
  const [result] = await db.query(
    "UPDATE orders SET status = 'fulfilled' WHERE id = ? AND status = 'paid'",
    [id]
  );
  return result.affectedRows === 1;
}

module.exports = {
  findMenuItemsByIds,
  createOrder,
  createOrderItems,
  findOrderById,
  listOrdersByUser,
  cancelIfPending,
  markPaidIfPending,
  markFulfilled
};