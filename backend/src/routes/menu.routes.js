const express = require('express');
const controller = require('../controllers/menu.controller');

const router = express.Router();

router.get('/', controller.getMenu);

module.exports = router;