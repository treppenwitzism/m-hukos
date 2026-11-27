const Admin = require('../models/admin.model');
const Order = require('../models/order.model');
const Schedule = require('./schedule.service');
const httpError = require('../utils/httpError');

const ROLES = ['customer', 'staff', 'admin'];
const ORDER_STATUSES = ['pending', 'paid', 'fulfilled', 'expired', 'cancelled'];

function clampInt(value, fallback, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n < 0) return fallback;
  return Math.min(n, max);
}

async function listUsers(query) {
  if (query.role && !ROLES.includes(query.role)) {
    throw httpError(400, `role must be one of: ${ROLES.join(', ')}.`);
  }
  return Admin.listUsers({
    q: query.q ? String(query.q).trim() : undefined,
    role: query.role,
  });
}

async function setRole(actor, userId, role) {
  if (!ROLES.includes(role)) {
    throw httpError(400, `role must be one of: ${ROLES.join(', ')}.`);
  }
  const user = await Admin.findUser(userId);
  if (!user) throw httpError(404, 'User not found.');
  if (user.id === actor.id) {
    throw httpError(400, 'You cannot change your own role.');
  }
  await Admin.setRole(userId, role);
  return Admin.findUser(userId);
}

async function listOrders(query) {
  if (query.status && !ORDER_STATUSES.includes(query.status)) {
    throw httpError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}.`);
  }
  const limit = clampInt(query.limit, 50, 100);
  const offset = clampInt(query.offset, 0, 100000);
  return Admin.listOrders({ status: query.status, limit, offset });
}

async function dashboard() {
  const [from, to] = Schedule.dayBounds(Schedule.todayLocal());
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [stats, awaiting, recent, upcoming] = await Promise.all([
    Admin.todayStats(from, to),
    Admin.countAwaitingPickup(),
    Admin.listOrders({ limit: 5 }),
    Order.listScheduled(now, weekAhead),
  ]);

  return {
    ...stats,
    awaiting_pickup: awaiting,
    recent_orders: recent,
    upcoming_scheduled: upcoming.slice(0, 5),
  };
}

module.exports = { listUsers, setRole, listOrders, dashboard };