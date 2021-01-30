const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings');

router
  .route('/setup')
  .get(controller.setup);

router
  .route('/create-checkout-session')
  .post(controller.createCheckoutSession);

router
  .route('/checkout-session')
  .get(controller.checkoutSession);

router
  .route('/customer-portal')
  .post(controller.customerPortal);

router
  .route('/webhook')
  .post(controller.webhook);

router
  .route('/success')
  .get(controller.successPage);

module.exports = router;