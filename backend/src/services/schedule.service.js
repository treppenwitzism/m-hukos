const cfg = require('../config/ordering');
const httpError = require('../utils/httpError');
const Order = require('../models/order.model');

const MIN = 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');
const fmt = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

function localMinutes(date) {
  const shifted = new Date(date.getTime() + cfg.utcOffsetMin * MIN);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

function todayLocal(now = new Date()) {
  return new Date(now.getTime() + cfg.utcOffsetMin * MIN).toISOString().slice(0, 10);
}

function dayBounds(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) throw httpError(400, 'date must look like 2026-12-05.');
  const start = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - cfg.utcOffsetMin * MIN;
  return [new Date(start), new Date(start + 24 * 60 * MIN)];
}

function orderWindow(now) {
  return {
    earliest: new Date(now.getTime() + cfg.minLeadMinutes * MIN),
    latest: new Date(now.getTime() + cfg.maxDaysAhead * 24 * 60 * MIN),
  };
}

function parsePickupTime(value, now = new Date()) {
  const when = typeof value === 'string' ? new Date(value) : null;
  if (!when || Number.isNaN(when.getTime())) {
    throw httpError(400, 'scheduled_for must be a valid date and time (ISO 8601).');
  }

  const min = localMinutes(when);
  if (min < cfg.openMin || min >= cfg.closeMin) {
    throw httpError(400, `Pickups are only available from ${fmt(cfg.openMin)} to ${fmt(cfg.closeMin)}.`);
  }
  if ((min - cfg.openMin) % cfg.slotMinutes !== 0 || when.getUTCSeconds() !== 0) {
    throw httpError(400, `Pickup times must be every ${cfg.slotMinutes} minutes.`);
  }

  const { earliest, latest } = orderWindow(now);
  if (when < earliest) {
    throw httpError(400, `Scheduled orders need at least ${cfg.minLeadMinutes} minutes notice.`);
  }
  if (when > latest) {
    throw httpError(400, `Orders can only be scheduled up to ${cfg.maxDaysAhead} days ahead.`);
  }
  return when;
}

function slotsForDate(dateStr, now = new Date()) {
  const date = dateStr || todayLocal(now);
  const [dayStart] = dayBounds(date);
  const { earliest, latest } = orderWindow(now);

  const slots = [];
  for (let t = cfg.openMin; t < cfg.closeMin; t += cfg.slotMinutes) {
    const when = new Date(dayStart.getTime() + t * MIN);
    if (when >= earliest && when <= latest) slots.push(when.toISOString());
  }
  return { date, slots };
}

async function listScheduled(dateStr) {
  const date = dateStr || todayLocal();
  const [from, to] = dayBounds(date);
  return { date, orders: await Order.listScheduled(from, to) };
}

module.exports = { parsePickupTime, slotsForDate, listScheduled };