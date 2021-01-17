const express = require('express');

const router = express.Router();

router
    .get('/settlement',(req,res)=>{
        res.render('pages/settlement')
    })

router
    .get('/success',(req,res)=>{
      res.render('pages/success')
    })

module.exports = router;