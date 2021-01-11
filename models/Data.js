const { Client } = require('pg');
const { google } = require('googleapis');
const privatekey = require('../client_secret.json');

const ACCOUNTS = ['収入','売上','支出','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他'];

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
    return new Promise((resolve,reject)=>{

      //ユーザーデータの抜き出し
      const select_query = {
        text: `SELECT * FROM users WHERE line_uid='${line_uid}';`
      }
      connection.query(select_query)
        .then(async(res)=>{
          //スプレッドシートidとシートidの抜き出し
          const ssId = res.rows[0].ssid;
          const inputSheetId = res.rows[0].sid1;
          console.log('ssid sid',ssId,inputSheetId);

          //authの設定
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
    
          const sheets = google.sheets({version: 'v4', auth: jwtClient});

          //行番号の取得
          const rowNumber = ACCOUNTS.indexOf(accountSelect)+2;
          console.log('rowNum',rowNumber);

          //列用アルファベット配列の生成
          const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
          const columns = [];
          for(let i=0; i<15; i++){
            for(let j=0; j<26; j++){
              if(i===0){
                columns.push(alphabets[j]);
              }else{
                columns.push(alphabets[i-1]+alphabets[j]);
              }
            }
          }
          
          //列番号の計算
          //各月日数配列の生成
          const year = new Date().getFullYear();
          const daysEveryMonth = [];
          for(let i=0; i<12; i++){
            daysEveryMonth.push(new Date(year,i+1,0).getDate());
          }
          const m = parseInt(selectedMonth);
          const d = parseInt(selectedDay);

          let column = '';
          if(m === 1){
            column = columns[d];
          }else{
            let counts = d;
            for(let i=1; i<m; i++){
              counts += daysEveryMonth[i-1];
            }
            column = columns[counts];
          }

          const target = column + rowNumber;
          console.log('target',target);

          //対象のセルの値を取得
          const get_request = {
            spreadsheetId: ssId,
            range: `入力用シート!${target}`
          }
          const response = await sheets.spreadsheets.values.get(get_request);
          const oldValue = parseInt(response.data.values[0][0]);
          const newValue = !oldValue ? parseInt(amountInput) : oldValue+parseInt(amountInput);
          console.log('newValue',newValue);

          //対象のセルの値を更新
          const update_request = {
            spreadsheetId: ssId,
            range: `入力用シート!${target}`,
            valueInputOption: 'RAW',
            resource: {
              values: [[newValue]]
            }
          }
          await sheets.spreadsheets.values.update(update_request);
          resolve(newValue);
        })
        .catch(e=>console.log(e));
    });
  }
}