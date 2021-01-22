const express = require('express');
const router = express.Router();

router
    .get('/settlement',(req,res)=>{
        res.render('pages/settlement')
    })

router
    .get('/success',(req,res)=>{
      res.render('pages/success')
    });

router
  .get('/canceled',(req,res)=>{
    res.render('pages/canceled')
  });

module.exports = router;
