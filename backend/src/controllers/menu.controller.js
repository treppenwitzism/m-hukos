const menuService = require('../services/menu.service');
const parseId = require('../utils/parseId');

async function getMenu(req, res) {
  res.json({ categories: await menuService.getMenu() });
}

async function createCategory(req, res) {
  const category = await menuService.createCategory(req.body || {});
  res.status(201).json({ category });
}

async function createItem(req, res) {
  const item = await menuService.createItem(req.body || {});
  res.status(201).json({ item });
}

async function updateItem(req, res) {
  const item = await menuService.updateItem(parseId(req.params.id), req.body || {});
  res.json({ item });
}

async function setAvailability(req, res) {
  const { is_available } = req.body || {};
  const item = await menuService.setAvailability(parseId(req.params.id), is_available);
  res.json({ item });
}

async function deleteItem(req, res) {
  await menuService.deleteItem(parseId(req.params.id));
  res.status(204).end();
}

module.exports = {
  getMenu,
  createCategory,
  createItem,
  updateItem,
  setAvailability,
  deleteItem,
};