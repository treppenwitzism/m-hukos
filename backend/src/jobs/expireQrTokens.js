const cron = require('node-cron');
const QrToken = require('../models/qrToken.model');

async function run() {
  try {
    const deleted = await QrToken.deleteExpired(new Date());
    if (deleted > 0) console.log(`Deleted ${deleted} expired QR token(s)`);
  } catch (err) {
    console.error('QR cleanup failed:', err);
  }
}

function start() {
  cron.schedule('0 * * * *', run);
}

module.exports = { start, run };