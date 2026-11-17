const orderService = require('../services/order.service');
const parseId = require('../utils/parseId');

async function create(req, res) {
  const order = await orderService.createOrder(req.user, req.body || {});
  res.status(201).json({ order });
}

async function listMine(req, res) {
  res.json({ orders: await orderService.listMyOrders(req.user) });
}

async function getOne(req, res) {
  res.json({ order: await orderService.getOrder(req.user, parseId(req.params.id)) });
}

async function cancel(req, res) {
  res.json({ order: await orderService.cancelOrder(req.user, parseId(req.params.id)) });
}

module.exports = { create, listMine, getOne, cancel };