const express = require('express');

const router = express.Router();

router.use('/health', require('./health.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/admin/menu', require('./admin.menu.routes'));


module.exports = router;
