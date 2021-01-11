const { Client } = require('pg');

const connection = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
connection.connect();

module.exports = {

  getUserData: (line_uid) => {
    return new Promise((resolve,reject) => {
      const pickup_query = {
        text:`SELECT * FROM users WHERE line_uid='${line_uid}';`
      }
      connection.query(pickup_query)
        .then(userData=>{
          if(userData.rows.length){
            resolve(usersData.rows[0])
          }else{
            resolve('');
          }
        })
        .catch(e=>console.log(e));
    })
  }
}