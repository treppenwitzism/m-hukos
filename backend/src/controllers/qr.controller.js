const qrService = require('../services/qr.service');
const parseId = require('../utils/parseId');

async function getForOrder(req, res) {
  res.json({ qr: await qrService.getOrderQr(req.user, parseId(req.params.id)) });
}

async function lookup(req, res) {
  res.json(await qrService.lookup(req.params.token));
}

async function redeem(req, res) {
  res.json({ order: await qrService.redeem(req.params.token) });
}

module.exports = { getForOrder, lookup, redeem };