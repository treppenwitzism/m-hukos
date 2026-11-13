// All API routes are registered here. Each feature gets its own file and one line below.
const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));

// Added in later steps:
// router.use('/auth', require('./auth.routes'));
// router.use('/menu', require('./menu.routes'));
// router.use('/orders', require('./orders.routes'));

module.exports = router;
