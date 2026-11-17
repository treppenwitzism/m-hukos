const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/admin/menu', require('./admin.menu.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/staff', require('./staff.routes'));

// Only exists outside production
if (process.env.NODE_ENV !== 'production') {
  router.use('/dev', require('./dev.routes'));
}

module.exports = router;
