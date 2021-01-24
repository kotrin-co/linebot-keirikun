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

// const appendJournal = (ssID,selectedMonth,selectedDay,accountSelect,newValue) => {
//   return new Promise(resolve=>{

//     const sheets = authorize();

//     //最終行に値を追加
//     const append_request = {
//       spreadsheetId: ssID,
//       range: '仕訳帳!A5',
//       valueInputOption: 'USER_ENTERED',
//       insertDataOption: 'OVERWRITE',
//       resource: {
//         values: [
//           [`${selectedMonth}/${selectedDay}`,null,newValue,null,newValue,accountSelect]
//         ]
//       }
//     }

//     sheets.spreadsheets.values.append(append_request)
//       .then(res=>{
//         console.log('追加！！');
//         //昇順ソート
//         const sort_request = {
//           spreadsheetId: ssID,
//           resource:{
//             requests:[
//               {
//                 sortRange: {
//                   range: {
//                     sheetId: 976007655,
//                     startRowIndex: 4,
//                     endRowIndex: 10000,
//                     startColumnIndex: 0,
//                     endColumnIndex: 6
//                   },
//                   sortSpecs: [
//                     {
//                       dimensionIndex: 0,
//                       sortOrder: "ASCENDING"
//                     }
//                   ]
//                 }
//               }
//             ]
//           }
//         }
//         sheets.spreadsheets.batchUpdate(sort_request)
//           .then(res=>{
//             console.log('sort res',res.data);
//             resolve();
//           })
//       })
//       .catch(e=>console.log(e));
//   })
// }

const updateJournal = (ssId) => {
  return new Promise(resolve=>{
    const sheets = authorize();

    //各月日数配列の生成
    const year = new Date().getFullYear();
    const daysEveryMonth = [];
    for(let i=0; i<12; i++){
      daysEveryMonth.push(new Date(year,i+1,0).getDate());
    }

    //入力用シートから全ての値を取得する
    const batchGet_request = {
      spreadsheetId: ssId,
      ranges: [
        '入力用シート!B2:NB14'
      ],
      majorDimension: 'COLUMNS'
    }
    sheets.spreadsheets.values.batchGet(batchGet_request)
      .then(res=>{
        
        //仕訳帳更新用配列の生成
        const valuesArray = res.data.valueRanges[0].values;
        const journalValues = [];
        valuesArray.forEach((array,i)=>{
          if(array.length){
            array.forEach((value,j)=>{
              if(value){
                let days = i+1;
                let month = 1;
                while(days>daysEveryMonth[month-1]){
                  days -= daysEveryMonth[month-1];
                  month++;
                }
                journalValues.push([
                  `${month}/${days}`,
                  null,
                  value,
                  null,
                  value,
                  ACCOUNTS[j]
                ]);
              }
            })
          }
        });
        console.log('journalValues',journalValues);

        //仕訳帳を一旦全クリアする
        const clear_request = {
          spreadsheetId: ssId,
          resource: {
            ranges:[
              '仕訳帳!A5:F'
            ]
          }
        }
        sheets.spreadsheets.values.batchClear(clear_request)
          .then(res=>{
            console.log('仕訳帳全クリ！');

            //仕訳帳をアップデート
            const batchUpdate_request = {
              spreadsheetId: ssId,
              resource: {
                valueInputOption: 'USER_ENTERED',
                data:[
                  {
                    majorDimension: 'ROWS',
                    range: '仕訳帳!A5',
                    values: journalValues
                  }
                ]
              }
            };
            sheets.spreadsheets.values.batchUpdate(batchUpdate_request)
              .then(res=>{
                console.log('updated');
                resolve();
              })
              .catch(e=>console.log(e));
          })
          .catch(e=>console.log(e));
      })
      .catch(e=>console.log(e));
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

          const sheets = authorize();
          // const sheets = google.sheets({version: 'v4', auth: jwtClient});

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
          await updateJournal(ssId);
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

  findValuesByDate: ({selectedMonth,selectedDay,line_uid}) => {
    return new Promise(resolve => {

      const select_query = {
        text: `SELECT * FROM users WHERE line_uid='${line_uid}';`
      }

      connection.query(select_query)
        .then(async(res)=>{
          //スプレッドシートidとシートidの抜き出し
          const ssId = res.rows[0].ssid;

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

          //batchGetにより列単位で値を取得する
          const batchGet_request = {
            spreadsheetId: ssId,
            ranges: [
              `入力用シート!${column}2:${column}`
            ],
            majorDimension: 'COLUMNS'
          }
          sheets.spreadsheets.values.batchGet(batchGet_request)
            .then(res=>{
              const foundValues = [];
              if('values' in res.data.valueRanges[0]){
                const valuesArray = res.data.valueRanges[0].values[0];
                console.log('valuesArray',valuesArray);
                valuesArray.forEach((value,index)=>{
                  if(value){
                    foundValues.push({
                      account: ACCOUNTS[index],
                      value
                    });
                  }
                });
              }
              resolve(foundValues);
            })
            .catch(e=>console.log(e));
        })
        .catch(e=>console.log(e));
    })
  },

  findValuesByAccount: ({selectedAccount,line_uid}) => {
    return new Promise(resolve=>{
      const select_query = {
        text: `SELECT * FROM users WHERE line_uid='${line_uid}';`
      }

      connection.query(select_query)
        .then(res=>{
          //スプレッドシートidとシートidの抜き出し
          const ssId = res.rows[0].ssid;

          //auth
          const sheets = authorize();

          //行番号
          const rowNumber = parseInt(selectedAccount)+2;

          //batchGetにより列単位で値を取得する
          const batchGet_request = {
            spreadsheetId: ssId,
            ranges: [
              `入力用シート!B${rowNumber}:${rowNumber}`
            ],
            majorDimension: 'ROWS'
          }
          sheets.spreadsheets.values.batchGet(batchGet_request)
            .then(res=>{
              const foundValues = [];
              console.log('res.data',res.data);
              if('values' in res.data.valueRanges[0]){

              }
            })
        })
        .catch(e=>console.log(e));
    });
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