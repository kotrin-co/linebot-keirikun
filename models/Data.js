const { Client } = require('pg');
const { google } = require('googleapis');
const privatekey = require('../client_secret.json');

const ACCOUNTS = ['売上','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他'];

const connection = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
connection.connect();

//列用アルファベット配列の生成
const createAlphabetsArray = () => {
  const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const array = [];
  for(let i=0; i<15; i++){
    for(let j=0; j<26; j++){
      if(i===0){
        array.push(alphabets[j]);
      }else{
        array.push(alphabets[i-1]+alphabets[j]);
      }
    }
  }
  return array;
}

const authorize = () => {
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

  return google.sheets({version: 'v4', auth: jwtClient});
}

const updateJournal = (ssID,selectedMonth,selectedDay,accountSelect,newValue) => {
  return new Promise(resolve=>{

    const sheets = authorize();

    const update_request = {
      spreadsheetId: ssID,
      range: 'A5',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [
          [`${selectedMonth}/${selectedDay}`,'',newValue,'',newValue,accountSelect]
        ]
      }
    }

    sheets.spreadsheets.value.append(update_request)
      .then(()=>{
        console.log('追加！！');
        resolve();
      })
      .catch(e=>console.log(e));

    // const column = createAlphabetsArray();
    // const year = new Date().getFullYear();
    // let daysOfYear;
    // if(year%4 === 0){
    //   daysOfYear = 366;
    // }else{
    //   daysOfYear = 365;
    // }
    // const startRow = 5;
    // const foundValues = [];
    // const promises = [];

    // const getValue = (index) => {
    //   return new Promise(resolve=>{
    //     // console.log('cell',targetCell);
    //     const get_request = {
    //       spreadsheetId: ssID,
    //       range: `仕訳帳!A${startRow+index}:F${startRow+index}`
    //     }
    //     sheets.spreadsheets.values.get(get_request)
    //       .then(response=>{
    //         if('values' in response.data){
    //           foundValues.push({
    //             date:response.data.values[0][0],
    //             amount:response.data.values[0][2],
    //             account:response.data.values[0][5]
    //           });
    //         }
    //         resolve();
    //       })
    //       .catch(e=>console.log(e));
    //   });
    // }

    // for(let i=0;i<daysOfYear;i++){
    //   for(let j=0;j<ACCOUNTS.length;j++){
    //     const targetCell = column[i+1]+j;
    //     promises.push(getValue(targetCell,j));
    //   }
    // }

    // Promise.all(promises)
    //   .then(()=>{
    //     console.log('all promises passed',foundValues);
    //     resolve(foundValues);
    //   })
    //   .catch(e=>console.log(e));
  })
}

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

      console.log('各種値',amountInput,accountSelect,selectedMonth,selectedDay,line_uid);
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
          const columns = createAlphabetsArray();
          
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
          //セルの値がからの時は何も戻ってこない(dataの中に何もない)
          const get_request = {
            spreadsheetId: ssId,
            range: `入力用シート!${target}`
          }
          const response = await sheets.spreadsheets.values.get(get_request);
          let newValue;
          // console.log('response.data',response.data);
          if(amountInput){
            if('values' in response.data){
              const oldValue = parseInt(response.data.values[0][0]);
              newValue = oldValue+parseInt(amountInput);
              console.log('newValue',newValue);
            }else{
              newValue = parseInt(amountInput);
            }
          }else{
            if('values' in response.data){
              newValue = ''
              console.log('削除！');
            }
          }
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
          await updateJournal(ssId,selectedMonth,selectedDay,accountSelect,newValue)
          resolve(newValue);
        })
        .catch(e=>console.log(e));
    });
  },

  updateUser: ({subscription,lineId}) => {
    return new Promise((resolve,reject) => {
      console.log('subscription',subscription);
      const update_query = {
        text: `UPDATE users SET subscription='${subscription}' WHERE line_uid='${lineId}';`
      };
      connection.query(update_query)
        .then(()=>{
          console.log('users更新しました！');
          resolve('subscription更新成功');
        })
        .catch(e=>console.log(e))
    });
  },

  findValues: ({selectedMonth,selectedDay,line_uid}) => {
    return new Promise((resolve,reject) => {
      // console.log('hikisuu',selectedMonth,selectedDay,line_uid);

      const select_query = {
        text: `SELECT * FROM users WHERE line_uid='${line_uid}';`
      }

      connection.query(select_query)
        .then(async(res)=>{
          //スプレッドシートidとシートidの抜き出し
          const ssId = res.rows[0].ssid;
          const inputSheetId = res.rows[0].sid1;
          console.log('ssid sid',ssId,inputSheetId);

          //auth
          const sheets = authorize();

          //列用アルファベット配列の生成
          const columns = createAlphabetsArray();
          
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

          //科目ごとにセルの値を取得する
          const foundValues = [];
          const promises = [];

          const getValue = (index) => {
            return new Promise(async(resolve)=>{
              console.log('index',index);
              const get_request = {
                spreadsheetId: ssId,
                range: `入力用シート!${column}${index+2}`
              }
              sheets.spreadsheets.values.get(get_request)
                .then(response=>{
                  if('values' in response.data){
                    foundValues.push({
                      account:ACCOUNTS[index],
                      value:response.data.values[0][0]
                    });
                  }
                  resolve();
                })
                .catch(e=>console.log(e));
            });
          }

          for(let i=0;i<ACCOUNTS.length;i++){
            promises.push(getValue(i));
          }

          Promise.all(promises)
            .then(()=>{
              console.log('all promises passed')
              resolve(foundValues);
            })
            .catch(e=>console.log(e));
        })
        .catch(e=>console.log(e));
    })
  },

  cancellation: (lineId,subscription) => {
    return new Promise((resolve,reject)=> {
      const update_query = {
        text: `UPDATE users SET subscription=null WHERE line_uid='${lineId}';`
      }
      connection.query(update_query)
        .then(()=>{
          console.log('subscription削除');
          resolve();
        })
        .catch(e=>console.log(e));
    })
  }
}