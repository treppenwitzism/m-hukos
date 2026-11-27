const { pool } = require('../config/db');

async function hasCollected(userId, menuItemId, db = pool) {
    const [rows] = await db.query(
        `SELECT 1
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.menu_item_id = ? AND o.status = 'fulfilled'
      LIMIT 1`,
        [userId, menuItemId]
    );
    return rows.length > 0;
}

async function summaryForItem(menuItemId, db = pool) {
    const [rows] = await db.query(
        'SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS average FROM reviews WHERE menu_item_id = ? AND status = \'visible\'', [menuItemId]
    );
    return { count: Number(rows[0].count), average: rows[0].average };
}

async function listForItem(menuItemId, db = pool) {
    const [rows] = await db.query(
        `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS author
       FROM reviews r
       JOIN users u ON u.id = r.user_id
      WHERE r.menu_item_id = ? AND r.status = 'visible'
      ORDER BY r.id DESC`,
        [menuItemId]
    );
    return rows;
}

async function listAll(limit = 100, db = pool) {
    const [rows] = await db.query(
        `SELECT r.id, r.rating, r.comment, r.created_at, r.status,
            u.name AS author, m.id AS menu_item_id, m.name AS item_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN menu_items m ON m.id = r.menu_item_id
      ORDER BY r.id DESC
      LIMIT ?`,
        [limit]
    );
    return rows;
}

async function findById(id, db = pool) {
    const [rows] = await db.query(
        'SELECT id, user_id, menu_item_id, rating, comment, created_at, status FROM reviews WHERE id = ?',
        [id]
    );
    return rows[0];
}

async function findByUserAndItem(userId, menuItemId, db = pool) {
    const [rows] = await db.query(
        'SELECT id, rating, comment, created_at, status FROM reviews WHERE user_id = ? AND menu_item_id = ?',
        [userId, menuItemId]
    );
    return rows[0];
}

async function create({ user_id, menu_item_id, rating, comment }, db = pool) {
    const [r] = await db.query(
        'INSERT INTO reviews (user_id, menu_item_id, rating, comment, status) VALUES (?, ?, ?, ?, \'visible\')', [user_id, menu_item_id, rating, comment]
    );
    return r.insertId;
}

async function update(id, { rating, comment }, db = pool) {
    await db.query('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?', [rating, comment, id]);
}

async function remove(id, db = pool) {
    await db.query('DELETE FROM reviews WHERE id = ?', [id]);
}

async function setStatus(id, status, db = pool) {
  await db.query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
}

module.exports = {
    hasCollected, summaryForItem, listForItem, listAll,
    findById, findByUserAndItem, create, update, remove, setStatus
};