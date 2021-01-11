const User = require('../models/User');

module.exports = {

  getUser: (req,res) => {
    const line_uid = req.query.line_uid;
    User.getUserData(line_uid)
      .then(data=>{
        res.status(200).json(data);
      })
      .catch(e=>console.log(e));
  }
}