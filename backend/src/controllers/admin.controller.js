const Admin = require('../services/admin.service');
const parseId = require('../utils/parseId');

async function listUsers(req, res) {
  res.json(await Admin.listUsers(req.query));
}

async function setRole(req, res) {
  const { role } = req.body || {};
  res.json(await Admin.setRole(req.user, parseId(req.params.id), role));
}

async function listOrders(req, res) {
  res.json(await Admin.listOrders(req.query));
}

async function dashboard(req, res) {
  res.json(await Admin.dashboard());
}

async function getOrder(req, res) {
  res.json(await Admin.getOrder(parseId(req.params.id)));
}

module.exports = { listUsers, setRole, listOrders, dashboard, getOrder };