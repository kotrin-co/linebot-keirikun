const express = require('express');

const router = express.Router();

router 
    .get('/',(req,res)=>{
        res.render('pages/index');
    });

router
    .get('/payment',(req,res)=>{
        res.render('pages/payment');
    });

module.exports = router;