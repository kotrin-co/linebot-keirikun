const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings');

router
  .route('/setup')
  .get(controller.setup);

router
  .route('/create-checkout-session')
  .post(controller.createCheckoutSession);

module.exports = router;