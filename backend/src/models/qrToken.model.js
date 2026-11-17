const { pool } = require('../config/db');

async function create({ order_id, token, expires_at }, db = pool) {
  await db.query(
    'INSERT INTO qr_tokens (order_id, token, expires_at) VALUES (?, ?, ?)',
    [order_id, token, expires_at]
  );
}

async function findByToken(token) {
  const [rows] = await pool.query(
    'SELECT id, order_id, token, expires_at, redeemed_at FROM qr_tokens WHERE token = ?',
    [token]
  );
  return rows[0] || null;
}

async function findByOrderId(orderId) {
  const [rows] = await pool.query(
    'SELECT id, order_id, token, expires_at, redeemed_at FROM qr_tokens WHERE order_id = ?',
    [orderId]
  );
  return rows[0] || null;
}

// "AND redeemed_at IS NULL" makes this safe if two staff scan at the same moment:
// only one UPDATE can change the row, and only that one returns true.
async function markRedeemed(id, when, db = pool) {
  const [result] = await db.query(
    'UPDATE qr_tokens SET redeemed_at = ? WHERE id = ? AND redeemed_at IS NULL',
    [when, id]
  );
  return result.affectedRows === 1;
}

async function deleteExpired(now) {
  const [result] = await pool.query('DELETE FROM qr_tokens WHERE expires_at < ?', [now]);
  return result.affectedRows;
}

module.exports = { create, findByToken, findByOrderId, markRedeemed, deleteExpired };