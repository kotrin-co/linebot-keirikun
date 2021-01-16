const express = require('express');

const router = express.Router();

router 
    .get('/',(req,res)=>{
        res.render('pages/index');
    });

router
    .get('/settlement',(req,res)=>{
        res.render('pages/settlement')
    })

module.exports = router;