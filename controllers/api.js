const Data = require('../models/Data');

module.exports = {

  getUser: (req,res) => {
    const line_uid = req.query.line_uid;
    Data.getUserData(line_uid)
      .then(data=>{
        console.log('data in controller',data);
        res.status(200).json(data);
      })
      .catch(e=>console.log(e));
  },

  postData: (req,res) => {
    const {amountInput,selectedAccount,selectedTransaction,selectedMonth,selectedDay,line_uid} = req.body;
    try{
      Data.inputSS({amountInput,selectedAccount,selectedTransaction,selectedMonth,selectedDay,line_uid})
        .then(value=>{
          console.log(`${value}へ更新しました!`);
          res.status(200).send(`${value}へ更新しました`);
        })
    }catch(error){
      res.status(400).json({message:error.message});
    }
  },

  updateUser: (req,res) => {
    const { subscription, lineId } = req.body;
    try{
      Data.updateUser({subscription,lineId})
        .then(message=>res.status(200).send(message))
        .catch(e=>console.log(e));
    }catch(error){
      res.status(400).json({message:error.message});
    }
  },

  cancelSubscription: (req,res) => {
    const lineId = req.params.lineId;
    const subscription = req.query.sub;
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('line sub',lineId,subscription);
    try{
      Data.cancellation(lineId,subscription)
        .then(()=>{
          // stripe.subscriptions.update(subscription,{cancel_at_period_end: true});
          res.status(200).send('解約しました');
        })
        .catch(e=>console.log(e));
    }catch(error){
      res.status(400).json({message:error.message});
    }
  },

  createSheet: (req,res) => {
    let { gmail,userName,line_uid } = req.body;
    gmail += '@gmail.com';
    Data.createSheet(gmail,userName,line_uid)
      .then(text=>{
        res.status(200).send(text);
      })
      .catch(e=>console.log(e));
  },

  getUserInfo: (req,res) => {
    const data = req.body;
    console.log('idtoken',data);
    Data.getUserData(data.id_token)
      .then(userInfo=>{
        if(!userInfo){
          console.log('ユーザー情報なし');
        }else{
          res.status(200).send(userInfo);
        }
      })
      .catch(e=>console.log(e));
  }
}