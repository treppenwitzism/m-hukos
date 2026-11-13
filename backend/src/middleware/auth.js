const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const httpError = require('../utils/httpError');

async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw httpError(401, 'Please log in.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Your session is invalid or has expired. Please log in again.');
  }

  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, 'That account no longer exists.');

  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw httpError(403, 'You do not have permission to do that.');
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };