const toMin = (s) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
};

module.exports = {
    // UTC+8 
    utcOffsetMin: Number(process.env.RESTAURANT_UTC_OFFSET_MIN ?? 480),
    openMin: toMin(process.env.OPEN_TIME || '10:00'),
    closeMin: toMin(process.env.CLOSE_TIME || '21:00'),
    slotMinutes: Number(process.env.SLOT_MINUTES || 15),
    minLeadMinutes: Number(process.env.MIN_LEAD_MINUTES || 60),
    maxDaysAhead: Number(process.env.MAX_DAYS_AHEAD || 7),
    pendingOnlineMinutes: Number(process.env.PENDING_ONLINE_MINUTES || 60),
    pendingCounterHours: Number(process.env.PENDING_COUNTER_HOURS || 24),
};