const { pool } = require('../config/db');

const USER_COLUMNS = 'id, name, email, role, points_balance, created_at';

async function listUsers({ q, role, limit = 100 }, db = pool) {
  const where = [];
  const params = [];
  if (q) {
    where.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  params.push(limit);
  const [rows] = await db.query(
    `SELECT ${USER_COLUMNS} FROM users
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY id LIMIT ?`,
    params
  );
  return rows;
}

async function findUser(id, db = pool) {
  const [rows] = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0];
}

async function setRole(id, role, db = pool) {
  await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
}

async function listOrders({ status, limit = 50, offset = 0 }, db = pool) {
  const where = status ? 'WHERE o.status = ?' : '';
  const params = status ? [status, limit, offset] : [limit, offset];
  const [rows] = await db.query(
    `SELECT o.id, o.status, o.total, o.scheduled_for, o.created_at,
            u.name AS customer_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ${where}
      ORDER BY o.id DESC
      LIMIT ? OFFSET ?`,
    params
  );
  return rows;
}

async function todayStats(from, to, db = pool) {
  const [rows] = await db.query(
    `SELECT
       COUNT(CASE WHEN status NOT IN ('cancelled', 'expired') THEN 1 END) AS orders_today,
       COALESCE(SUM(CASE WHEN status IN ('paid', 'fulfilled') THEN total ELSE 0 END), 0) AS sales_today
       FROM orders
      WHERE created_at >= ? AND created_at < ?`,
    [from, to]
  );
  return {
    orders_today: Number(rows[0].orders_today),
    sales_today: Number(rows[0].sales_today),
  };
}

async function countAwaitingPickup(db = pool) {
  const [rows] = await db.query("SELECT COUNT(*) AS n FROM orders WHERE status = 'paid'");
  return Number(rows[0].n);
}

module.exports = {
  listUsers, findUser, setRole, listOrders, todayStats, countAwaitingPickup,
};