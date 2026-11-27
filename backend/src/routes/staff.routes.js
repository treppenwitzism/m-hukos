const express = require('express');
const controller = require('../controllers/qr.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const orderCtrl = require('../controllers/order.controller');

const router = express.Router();

router.use(requireAuth, requireRole('staff', 'admin'));
router.get('/scheduled', orderCtrl.listScheduled);
router.get('/qr/:token', controller.lookup);
router.post('/qr/:token/redeem', controller.redeem);

module.exports = router;