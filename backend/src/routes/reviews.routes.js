const router = require('express').Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/review.controller');

router.get('/menu/:id/reviews', ctrl.listForItem);
router.get('/menu/:id/reviews/mine', requireAuth, ctrl.myStatus);
router.post('/menu/:id/reviews', requireAuth, ctrl.create);


router.patch('/reviews/:id', requireAuth, ctrl.update);
router.delete('/reviews/:id', requireAuth, ctrl.remove);
router.patch('/admin/reviews/:id/status', requireAuth, requireRole('admin'), ctrl.setStatus);
router.get('/admin/reviews', requireAuth, requireRole('admin'), ctrl.listAll);

module.exports = router;