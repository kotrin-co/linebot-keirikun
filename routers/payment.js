const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment');

router
  .route('/success')
  .get(controller.displaySuccess);

module.exports = router;