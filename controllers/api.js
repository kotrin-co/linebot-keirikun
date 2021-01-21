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
    const {amountInput,accountSelect,selectedMonth,selectedDay,line_uid} = req.body;
    try{
      Data.inputSS({amountInput,accountSelect,selectedMonth,selectedDay,line_uid})
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
  }
}