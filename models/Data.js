const { Client } = require('pg');
const { google } = require('googleapis');
const privatekey = require('../client_secret.json');

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
        .then(user=>{
          if(user.rows.length){
            resolve(user.rows[0]);
          }else{
            resolve('');
          }
        })
        .catch(e=>console.log(e));
    })
  },

  inputSS: ({amountInput,accountSelect,selectedMonth,selectedDay,line_uid}) => {
    return new Promise(async(resolve,reject)=>{

      const jwtClient = new google.auth.JWT(
        privatekey.client_email,
        null,
        privatekey.private_key,
        ['https://www.googleapis.com/auth/spreadsheets']
        );

      //リクエストの承認をチェックする
      jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            return;
        } else {
            console.log('OK!!');
        }
      });

      const sheets = await google.sheets({version: 'v4', auth: jwtClient});

      //ユーザーデータの抜き出し
      const select_query = {
        text: `SELECT * FROM users WHERE line_uid='${line_uid}';`
      }
      connection.query(select_query)
        .then(res=>{
          console.log('res.rows',res.rows[0]);
          const ssId = res.rows[0].ssid;
          const inputSheetId = res.rows[0].sid1;
        })
        .catch(e=>console.log(e));
    });
  }
}