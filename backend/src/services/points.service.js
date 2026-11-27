const Points = require('../models/points.model');
const { withTransaction } = require('../config/db');
const httpError = require('../utils/httpError');

// Call INSIDE an existing transaction
async function awardForOrder(order, db) {
  if (await Points.orderAlreadyAwarded(order.id, db)) return 0;

  const pts = await Points.sumOrderPoints(order.id, db);
  if (pts <= 0) return 0;

  await Points.changeBalance(order.user_id, pts, db);
  await Points.addLedgerEntry(
    { user_id: order.user_id, order_id: order.id, amount: pts, reason: `Earned from order #${order.id}` },
    db
  );
  await Points.setOrderPointsEarned(order.id, pts, db);
  return pts;
}

async function getMyPoints(userId) {
  const user = await Points.getBalance(userId);
  if (!user) throw httpError(404, 'User not found.');
  const history = await Points.listForUser(userId);
  return { balance: user.points_balance, history };
}

// Admin manual correction
async function adjust(userId, amount, reason) {
  if (!Number.isInteger(amount) || amount === 0) {
    throw httpError(400, 'amount must be a non-zero whole number.');
  }
  if (!reason || !String(reason).trim()) {
    throw httpError(400, 'A reason is required.');
  }
  return withTransaction(async (db) => {
    const user = await Points.getBalance(userId, db);
    if (!user) throw httpError(404, 'User not found.');

    const ok = await Points.changeBalance(userId, amount, db);
    if (!ok) throw httpError(400, 'That would make the balance negative.');

    await Points.addLedgerEntry(
      { user_id: userId, amount, reason: `Admin adjustment: ${String(reason).trim()}` },
      db
    );
    return Points.getBalance(userId, db);
  });
}

module.exports = { awardForOrder, getMyPoints, adjust };