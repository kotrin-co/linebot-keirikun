const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings');

router
  .route('/setup')
  .get(controller.setup);

module.exports = router;