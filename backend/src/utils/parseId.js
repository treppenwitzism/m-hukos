const httpError = require('./httpError');

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw httpError(400, 'Invalid id.');
  return id;
}

module.exports = parseId;