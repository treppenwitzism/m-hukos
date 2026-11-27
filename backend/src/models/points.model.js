const { pool } = require('../config/db');

async function getBalance(userId, db = pool) {
  const [rows] = await db.query(
    'SELECT id, points_balance FROM users WHERE id = ?', [userId]
  );
  return rows[0]; // undefined if the user doesn't exist
}

// Returns false if it would push the balance below zero.
async function changeBalance(userId, amount, db = pool) {
  if (amount >= 0) {
    const [r] = await db.query(
      'UPDATE users SET points_balance = points_balance + ? WHERE id = ?',
      [amount, userId]
    );
    return r.affectedRows === 1;
  }
  const [r] = await db.query(
    'UPDATE users SET points_balance = points_balance - ? WHERE id = ? AND points_balance >= ?',
    [-amount, userId, -amount]
  );
  return r.affectedRows === 1;
}

async function addLedgerEntry({ user_id, order_id = null, amount, reason }, db = pool) {
  await db.query(
    'INSERT INTO points_transactions (user_id, order_id, amount, reason) VALUES (?, ?, ?, ?)',
    [user_id, order_id, amount, reason]
  );
}

async function listForUser(userId, limit = 50, db = pool) {
  const [rows] = await db.query(
    `SELECT id, order_id, amount, reason, created_at
       FROM points_transactions
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

async function sumOrderPoints(orderId, db = pool) {
  const [rows] = await db.query(
    'SELECT COALESCE(SUM(quantity * points_each), 0) AS pts FROM order_items WHERE order_id = ?',
    [orderId]
  );
  return Number(rows[0].pts);
}

async function orderAlreadyAwarded(orderId, db = pool) {
  const [rows] = await db.query(
    'SELECT 1 FROM points_transactions WHERE order_id = ? AND amount > 0 LIMIT 1',
    [orderId]
  );
  return rows.length > 0;
}

async function setOrderPointsEarned(orderId, pts, db = pool) {
  await db.query('UPDATE orders SET points_earned = ? WHERE id = ?', [pts, orderId]);
}

module.exports = {
  getBalance, changeBalance, addLedgerEntry, listForUser,
  sumOrderPoints, orderAlreadyAwarded, setOrderPointsEarned,
};