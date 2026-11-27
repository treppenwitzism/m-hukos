const Points = require('../services/points.service');
const parseId = require('../utils/parseId');

async function getMine(req, res) {
  res.json(await Points.getMyPoints(req.user.id));
}

async function adjust(req, res) {
  const { amount, reason } = req.body || {};
  const balance = await Points.adjust(parseId(req.params.id), Number(amount), reason);
  res.json(balance);
}

module.exports = { getMine, adjust };