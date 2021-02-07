const express = require('express');
const router = express.Router();
const controller = require('../controllers/api');

router
  .route('/')
  .get(controller.getUser);

router
  .route('/')
  .post(controller.postData);

router
  .route('/')
  .put(controller.updateUser);

router
  .route('/cancel/:lineId')
  .get(controller.cancelSubscription);

router
  .route('/mail')
  .post(controller.createSheet);

router
  .route('/idToken')
  .post(controller.getUserInfo);

module.exports = router;