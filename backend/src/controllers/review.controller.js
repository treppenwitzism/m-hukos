const Reviews = require('../services/review.service');
const parseId = require('../utils/parseId');

async function listForItem(req, res) {
  res.json(await Reviews.listForItem(parseId(req.params.id)));
}

async function myStatus(req, res) {
  res.json(await Reviews.myStatus(req.user.id, parseId(req.params.id)));
}

async function create(req, res) {
  const review = await Reviews.create(req.user.id, parseId(req.params.id), req.body || {});
  res.status(201).json(review);
}

async function update(req, res) {
  res.json(await Reviews.update(req.user, parseId(req.params.id), req.body || {}));
}

async function remove(req, res) {
  await Reviews.remove(req.user, parseId(req.params.id));
  res.status(204).end();
}

async function listAll(req, res) {
  res.json(await Reviews.listAll());
}

async function setStatus(req, res) {
  const { status } = req.body || {};
  res.json(await Reviews.setStatus(parseId(req.params.id), status));
}

module.exports = { listForItem, myStatus, create, update, remove, listAll, setStatus };