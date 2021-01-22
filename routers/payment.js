const express = require('express');
const router = express.Router();
// const controller = require('../controllers/api');

router
  .route('/success',(req,res)=>{
    res.render('pages/success');
  });

module.exports = router;