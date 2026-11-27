const Menu = require('../models/menu.model');
const httpError = require('../utils/httpError');

function parsePrice(value) {
  const price = Number(value);
  if (typeof value === 'boolean' || value === null || value === '' || !Number.isFinite(price) || price <= 0) {
    throw httpError(400, 'Price must be a number greater than 0.');
  }
  return Math.round(price * 100) / 100;
}

function parsePointsReward(value) {
  const p = Number(value);
  if (!Number.isInteger(p) || p < 0) {
    throw httpError(400, 'points_reward must be a whole number, 0 or higher.');
  }
  return p;
}

function parseName(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw httpError(400, 'Name is required.');
  }
  return value.trim();
}

async function requireCategory(id) {
  if (!Number.isInteger(id) || !(await Menu.findCategoryById(id))) {
    throw httpError(400, 'That category does not exist.');
  }
}

async function requireItem(id) {
  const item = await Menu.findItemById(id);
  if (!item) throw httpError(404, 'Menu item not found.');
  return item;
}

function getMenu() {
  return Menu.listCategoriesWithItems();
}

async function createCategory({ name, sort_order = 0 }) {
  const id = await Menu.createCategory({
    name: parseName(name),
    sort_order: Number(sort_order) || 0,
  });
  return Menu.findCategoryById(id);
}
async function createItem(body) {
  const name = parseName(body.name);
  const price = parsePrice(body.price);
  const points_reward =
    body.points_reward === undefined ? 0 : parsePointsReward(body.points_reward);
  await requireCategory(body.category_id);

  const id = await Menu.createItem({
    category_id: body.category_id,
    name,
    description: body.description || null,
    price,
    points_reward,
    image_url: body.image_url || null,
  });

  return Menu.findItemById(id);
}

async function updateItem(id, body) {
  await requireItem(id);

  const fields = {};
  if (body.name !== undefined) fields.name = parseName(body.name);
  if (body.price !== undefined) fields.price = parsePrice(body.price);
  if (body.category_id !== undefined) {
    await requireCategory(body.category_id);
    fields.category_id = body.category_id;
  }
  if (body.points_reward !== undefined) {
    fields.points_reward = parsePointsReward(body.points_reward);
  }
  if (body.description !== undefined) fields.description = body.description;
  if (body.image_url !== undefined) fields.image_url = body.image_url;

  await Menu.updateItem(id, fields);
  return Menu.findItemById(id);
}

async function setAvailability(id, isAvailable) {
  if (typeof isAvailable !== 'boolean') {
    throw httpError(400, 'is_available must be true or false.');
  }
  await requireItem(id);
  await Menu.setAvailability(id, isAvailable);
  return Menu.findItemById(id);
}

async function deleteItem(id) {
  await requireItem(id);
  await Menu.softDeleteItem(id);
}

module.exports = {
  getMenu,
  createCategory,
  createItem,
  updateItem,
  setAvailability,
  deleteItem,
};