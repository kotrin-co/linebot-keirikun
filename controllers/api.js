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
    const {amountInput,accountSelect,selectedMonth,selectedDay} = req.body;
    console.log('data',amountInput,accountSelect,selectedMonth,selectedDay)
  }
}