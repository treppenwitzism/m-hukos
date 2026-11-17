const express = require('express');
const controller = require('../controllers/order.controller');
const { requireAuth } = require('../middleware/auth');
const qrController = require('../controllers/qr.controller');

const router = express.Router();

router.use(requireAuth);

router.post('/', controller.create);
router.get('/', controller.listMine);
router.get('/:id', controller.getOne);
router.get('/:id/qr', qrController.getForOrder);
router.post('/:id/cancel', controller.cancel);

module.exports = router;