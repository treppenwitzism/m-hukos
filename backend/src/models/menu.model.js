const { pool } = require('../config/db');

const toItem = (row) => ({ ...row, is_available: Boolean(row.is_available) });

// The only columns an admin may edit.
const EDITABLE = ['category_id', 'name', 'description', 'price', 'image_url', 'points_reward'];

async function listCategoriesWithItems() {
  const [categories] = await pool.query(
    'SELECT id, name, sort_order FROM categories ORDER BY sort_order, id'
  );
  const [items] = await pool.query(
    `SELECT id, category_id, name, description, price, image_url, is_available, points_reward
     FROM menu_items WHERE is_deleted = 0 ORDER BY name`
  );
  return categories.map((category) => ({
    ...category,
    items: items.filter((item) => item.category_id === category.id).map(toItem),
  }));
}

async function findItemById(id) {
  const [rows] = await pool.query(
    `SELECT id, category_id, name, description, price, image_url, is_available, points_reward
     FROM menu_items WHERE id = ? AND is_deleted = 0`,
    [id]
  );
  return rows[0] ? toItem(rows[0]) : null;
}

async function findCategoryById(id) {
  const [rows] = await pool.query(
    'SELECT id, name, sort_order FROM categories WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function createCategory({ name, sort_order }) {
  const [result] = await pool.query(
    'INSERT INTO categories (name, sort_order) VALUES (?, ?)',
    [name, sort_order]
  );
  return result.insertId;
}

async function createItem({ category_id, name, description, price, image_url, points_reward }) {
  const [result] = await pool.query(
    'INSERT INTO menu_items (category_id, name, description, price, image_url, points_reward) VALUES (?, ?, ?, ?, ?, ?)',
    [category_id, name, description, price, image_url, points_reward]
  );
  return result.insertId;
}

async function updateItem(id, fields) {
  const sets = [];
  const values = [];
  for (const column of EDITABLE) {
    if (fields[column] !== undefined) {
      sets.push(`${column} = ?`);
      values.push(fields[column]);
    }
  }
  if (sets.length === 0) return;
  await pool.query(`UPDATE menu_items SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
}

async function setAvailability(id, isAvailable) {
  await pool.query('UPDATE menu_items SET is_available = ? WHERE id = ?', [isAvailable ? 1 : 0, id]);
}

// Soft delete as past orders still point to this row.
async function softDeleteItem(id) {
  await pool.query('UPDATE menu_items SET is_deleted = 1 WHERE id = ?', [id]);
}

module.exports = {
  listCategoriesWithItems,
  findItemById,
  findCategoryById,
  createCategory,
  createItem,
  updateItem,
  setAvailability,
  softDeleteItem,
};