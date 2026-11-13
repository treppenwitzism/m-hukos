// GET /api/health: tells you (and later, the hosting service) if the API and database are up.
const express = require('express');
const { pingDatabase } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await pingDatabase();
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    // The API itself is running, but MySQL is not reachable.
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

module.exports = router;
