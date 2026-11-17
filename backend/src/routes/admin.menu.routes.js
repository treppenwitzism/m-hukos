const express = require('express');
const controller = require('../controllers/menu.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.post('/categories', controller.createCategory);
router.post('/items', controller.createItem);
router.patch('/items/:id', controller.updateItem);
router.patch('/items/:id/availability', controller.setAvailability);
router.delete('/items/:id', controller.deleteItem);

module.exports = router;