const cron = require('node-cron');
const Order = require('../models/order.model');
const cfg = require('../config/ordering');

async function run() {
  try {
    const now = Date.now();
    const expired = await Order.expireStalePending({
      onlineBefore: new Date(now - cfg.pendingOnlineMinutes * 60 * 1000),
      counterBefore: new Date(now - cfg.pendingCounterHours * 60 * 60 * 1000),
    });
    if (expired > 0) console.log(`Expired ${expired} unpaid order(s)`);
  } catch (err) {
    console.error('Order expiry failed:', err);
  }
}

function start() {
  cron.schedule('*/10 * * * *', run); // every 10 minutes
}

module.exports = { start, run };