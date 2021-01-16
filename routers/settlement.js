const express = require('express');

const router = express.Router();

router
    .get('/settlement',(req,res)=>{
        res.render('pages/settlement')
    })

module.exports = router;