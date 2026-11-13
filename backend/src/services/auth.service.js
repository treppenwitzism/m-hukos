const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const httpError = require('../utils/httpError');

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw httpError(400, 'Name, email and password are required.');
  }
  if (password.length < 8) {
    throw httpError(400, 'Password must be at least 8 characters.');
  }

  email = email.trim().toLowerCase();
  if (await User.findByEmail(email)) {
    throw httpError(409, 'That email is already registered.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = await User.create({ name: name.trim(), email, passwordHash });
  const user = await User.findById(id);
  return { user, token: signToken(user) };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw httpError(400, 'Email and password are required.');
  }

  const row = await User.findByEmail(email.trim().toLowerCase());
  const passwordOk = row && (await bcrypt.compare(password, row.password_hash));

  if (!passwordOk) throw httpError(401, 'Invalid email or password.');

  const user = await User.findById(row.id);
  return { user, token: signToken(user) };
}

module.exports = { register, login };