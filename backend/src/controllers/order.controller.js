const orderService = require('../services/order.service');
const parseId = require('../utils/parseId');
const Schedule = require('../services/schedule.service');

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

async function pickupSlots(req, res) {
  res.json(Schedule.slotsForDate(req.query.date));
}

async function listScheduled(req, res) {
  res.json(await Schedule.listScheduled(req.query.date));
}

module.exports = { create, listMine, getOne, cancel, pickupSlots, listScheduled };