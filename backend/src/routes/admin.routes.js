const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

const adminOnly = [requireAuth, requireRole('admin')];

router.get('/admin/dashboard', ...adminOnly, ctrl.dashboard);
router.get('/admin/orders', ...adminOnly, ctrl.listOrders);
router.get('/admin/users', ...adminOnly, ctrl.listUsers);
router.patch('/admin/users/:id/role', ...adminOnly, ctrl.setRole);

module.exports = router;