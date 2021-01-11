const express = require('express');
const router = express.Router();
const controller = require('../controllers/api');

router
  .route('/')
  .get(controller.getUser);

router
  .route('/')
  .post(controller.postData);

module.exports = router;