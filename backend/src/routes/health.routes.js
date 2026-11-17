// GET /api/health to see if API is running and database is reachable.
const express = require('express');
const { pingDatabase } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

module.exports = router;
