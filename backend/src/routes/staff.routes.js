const express = require('express');
const controller = require('../controllers/qr.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('staff', 'admin'));

router.get('/qr/:token', controller.lookup);
router.post('/qr/:token/redeem', controller.redeem);

module.exports = router;