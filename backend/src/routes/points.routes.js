const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/points.controller');

router.get('/points', requireAuth, ctrl.getMine);
router.post('/admin/users/:id/points', requireAuth, requireRole('admin'), ctrl.adjust);

module.exports = router;