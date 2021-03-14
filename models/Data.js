const { Client } = require('pg');
const { google } = require('googleapis');
const privatekey = require('../client_secret.json');
const fetch = require('node-fetch');

const {
  ACCOUNTS,
  DEBITS,
  CREDITS,
  TRANSACTIONS,
  ADMIN,
  original_SSID_0,
  original_SSID_1,
  original_SID
} = require('../params/params');

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

//仕訳帳の更新処理
const updateJournal = (ssId) => {
  return new Promise(resolve=>{
    const sheets = authorize();

    //各月日数配列の生成
    const year = new Date().getFullYear();
    const daysEveryMonth = [];
    for(let i=0; i<12; i++){
      daysEveryMonth.push(new Date(year,i+1,0).getDate());
    }

    //行の数を計算
    const rows = ACCOUNTS.length*3;

    //入力用シートから全ての値を取得する
    const batchGet_request = {
      spreadsheetId: ssId,
      ranges: [
        `入力用シート!B2:NB${rows}`
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
                //ACCOUNTSのインデックス計算　雑収入のみ２項目のため、そのための処理を入れる
                const accountNumber = j<=82 ? Math.floor(j/3) : Math.round(j/3);
                //源泉所得税の場合だけ摘要に特別処理を行う
                const description = j === 2 ? '源泉所得税' : ACCOUNTS[accountNumber];
                while(days>daysEveryMonth[month-1]){
                  days -= daysEveryMonth[month-1];
                  month++;
                }
                journalValues.push([
                  `${month}/${days}`,
                  DEBITS[j],
                  value,
                  CREDITS[j],
                  value,
                  description
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

//gmailAccountAdd
const gmailAccountAdd = async (ssID,role,gmail) => {

  return new Promise(async (resolve,reject) => {
      const jwtClient = new google.auth.JWT(
          privatekey.client_email,
          null,
          privatekey.private_key,
          ['https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file']
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
  
      const drive = await google.drive({version: 'v3', auth: jwtClient});
  
      const fileId = ssID; //spreadsheetID
  
      const permission =
          {
              'type':'user',
              'role':role,
              'emailAddress':gmail
          };
  
      if(role==='owner'){
          await drive.permissions.create({
              resource:permission,
              fileId: fileId,
              fields: 'id',
          　  transferOwnership:true, //'writer'のときはfalse
              sendNotificationEmail: true//'writer'のときはfalse
          }, function (err, res) {
              if (err) {
              console.error(err);
              } else {
              console.log('Your Gmail Account Permission ID: ', res.data.id);
              resolve(ssID);
              }
          });
      }else{
          await drive.permissions.create({
              resource:permission,
              fileId: fileId,
              fields: 'id',
          }, function (err, res) {
              if (err) {
              console.error(err);
              } else {
              console.log('Your Gmail Account Permission ID: ', res.data.id);
              resolve(ssID);
              }
          });
      }
  })
}

//スプレッドシートの初期処理
const initialTreat = (ssID,line_uid) => {
  return new Promise((resolve,reject) => {

    const sheets = authorize();

    const title_SID = ['入力用シート','仕訳帳','月次集計','確定申告B 第一表','確定申告B 第一表（控）','確定申告B 第二表','確定申告B 第二表（控）'];

    //シートタイトル変更用メソッド
    const changeTitle = (sheetId,index) => {
      return new Promise(resolve=>{
        const title_change_request = {
          spreadsheetId: ssID,
          resource: {
            requests: [
              {
                'updateSheetProperties': {
                  'properties': {
                    'sheetId': sheetId,
                    'title': title_SID[index]
                  },
                  'fields': 'title'
                }
              }
            ]
          }
        };
        sheets.spreadsheets.batchUpdate(title_change_request)
          .then(res=>resolve())
          .catch(e=>console.log(e));
      });
    }

    //シートコピー用メソッド
    const copySheet = (index) => {
      return new Promise(resolve=>{
        
        //閏年判定
        let year;
        const thisMonth = new Date().getMonth()+1;
        const today = new Date().getDate();
        if(thisMonth<3 || (thisMonth === 3 && today<16)){
          year = new Date().getFullYear() - 1;
        }else{
          year = new Date().getFullYear();
        }

        const original_SSID = year%4===0 ? original_SSID_1 : original_SSID_0;

        const copy_request = {
          spreadsheetId: original_SSID,
          sheetId: original_SID[index],
          resource: {
            destinationSpreadsheetId: ssID
          }
        };
        sheets.spreadsheets.sheets.copyTo(copy_request)
          .then(response=>{
            console.log('index,sheetId',index,response.data.sheetId);
            // resolve(`${index} ok`);
            changeTitle(response.data.sheetId,index)
              .then(()=>resolve(`${index} ok`))
              .catch(e=>console.log(e));
          })
          .catch(e=>console.log(e));
      });
    }

    //最初に作った空白シートを削除する
    const deleteBlankSheet = () => {
      return new Promise(resolve=>{
        const delete_request = {
          spreadsheetId: ssID,
          resource: {
            requests: [
              {
                'deleteSheet': {
                  'sheetId': 0
                }
              }
            ]
          }
        };
        sheets.spreadsheets.batchUpdate(delete_request)
          .then(res=>{
            console.log('不要シート削除成功');
            resolve('不要シート削除');
          })
          .catch(e=>console.log(e));
      });
    }

    copySheet(0)
      .then(m=>{
        console.log(m);
        copySheet(1)
          .then(m=>{
            console.log(m);
            copySheet(2)
              .then(m=>{
                console.log(m);
                copySheet(3)
                  .then(m=>{
                    console.log(m);
                    copySheet(4)
                      .then(m=>{
                        console.log(m);
                        copySheet(5)
                          .then(m=>{
                            console.log(m);
                            copySheet(6)
                              .then(m=>{
                                console.log(m);
                                deleteBlankSheet()
                                  .then(m=>{
                                    console.log(m);
                                    resolve('スプレッドシート作成成功！！');
                                  })
                              })
                          })
                      })
                  })
              })
          })
      })
  });
}

module.exports = {

  //LINE IDによるユーザーデータの取得
  getUserDataByLineId: (line_uid) => {
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

  //idTokenによるユーザーデータの取得
  getUserData: (idToken) => {
    return new Promise(resolve=>{
      const bodyData = `id_token=${idToken}&client_id=${process.env.LOGIN_CHANNEL_ID}`;
      // console.log('bodydata in Data.js',bodyData);

      fetch('https://api.line.me/oauth2/v2.1/verify',{
        method: 'POST',
        headers: {
          'Content-Type':'application/x-www-form-urlencoded'
        },
        body: bodyData
      })
      .then(response=>{
        response.json()
          .then(json=>{
            console.log('json@@@',json);
            const lineId = json.sub;
            const select_query = {
              text: `SELECT * FROM users WHERE line_uid='${lineId}';`
            };
            connection.query(select_query)
              .then(res=>{
                if(res.rows.length){
                  console.log('res.rows[0]',res.rows[0]);
                  resolve(res.rows[0]);
                }else{
                  console.log('対象のユーザー情報がありません');
                  resolve(false);
                }
              })
              .catch(e=>console.log(e));
          })
          .catch(e=>console.log(e));
      })
      .catch(e=>console.log(e));
    });
    
  },

  //入力用シートへの入力
  inputSS: ({amountInput,selectedAccount,selectedTransaction,selectedMonth,selectedDay,line_uid}) => {
    return new Promise((resolve,reject)=>{

      console.log('各種値',amountInput,selectedAccount,selectedTransaction,selectedMonth,selectedDay,line_uid);
      //ユーザーデータの抜き出し
      const select_query = {
        text: `SELECT * FROM users WHERE line_uid='${line_uid}';`
      }
      connection.query(select_query)
        .then(async(res)=>{

          //採用するスプレッドシートID
          let ssId = '';
          //スプレッドシートidの決定
          const target_ss = res.rows[0].target_ss;
          switch(target_ss){
            case 0:
              ssId = res.rows[0].ssid;
              break;

            case 1:
              ssId = res.rows[0].ssid1;
              break;

            case 2:
              ssId = res.rows[0].ssid2;
              break;
            
            case 3:
              ssId = res.rows[0].ssid3;
              break;
            
            case 4:
              ssId = res.rows[0].ssid4;
              break;
          }

          console.log('ssid',ssId);

          const sheets = authorize();

          //行番号の取得
          let rowNumber = 3*parseInt(selectedAccount)+parseInt(selectedTransaction)+2;
          console.log('rowNum',rowNumber);

          //行番号が備品の場合、rowNumberを１減算する（雑収入が２行しかないため）
          if(parseInt(selectedAccount) === 28) rowNumber--;

          //列用アルファベット配列の生成
          const columns = createAlphabetsArray();
          
          //列番号の計算
          //各月日数配列の生成(3/16を新年スタートとする)
          let year;
          const thisMonth = new Date().getMonth()+1;
          const today = new Date().getDate();
          if(thisMonth<3 || (thisMonth === 3 && today<14)){
            year = new Date().getFullYear() - 1;
          }else{
            year = new Date().getFullYear();
          }
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

  //ユーザー情報更新（サブスク課金したらsubscription id をデータベースへ格納）
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

  //日付によるデータ抽出
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
                    const accountNumber = index<=82 ? Math.floor(index/3) : Math.round(index/3);
                    const transactionNumber = index<=82 ? index%3 : (index+1)%3;
                    const transaction = index === 2 ? '源泉所得税' : TRANSACTIONS[transactionNumber];
                    foundValues.push({
                      account: ACCOUNTS[accountNumber],
                      transaction,
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

  //科目によるデータ抽出
  findValuesByAccount: ({selectedAccount,selectedTransaction,line_uid}) => {
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
          let rowNumber = 3*selectedAccount+selectedTransaction+2;

          //行番号が備品の場合、rowNumberを１減算する（雑収入が２行しかないため）
          if(selectedAccount === 28) rowNumber--;

          //各月日数配列の生成
          const year = new Date().getFullYear();
          const daysEveryMonth = [];
          for(let i=0; i<12; i++){
            daysEveryMonth.push(new Date(year,i+1,0).getDate());
          }

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
              // console.log('res.data',res.data);
              if('values' in res.data.valueRanges[0]){
                const valuesArray = res.data.valueRanges[0].values[0];
                console.log('valuesArray',valuesArray);
                valuesArray.forEach((value,index)=>{
                  if(value){
                    let days = index+1;
                    let month = 1;
                    while(days>daysEveryMonth[month-1]){
                      days -= daysEveryMonth[month-1];
                      month++;
                    }
                    foundValues.push({
                      date: `${month}月${days}日`,
                      amount: value
                    });
                  }
                });
              }
              resolve(foundValues);
            })
            .catch(e=>console.log(e));
        })
        .catch(e=>console.log(e));
    });
  },

  //サブスクの解約
  cancellation: (lineId,subscription) => {
    return new Promise((resolve,reject)=> {
      const update_query = {
        text: `UPDATE users SET subscription='' WHERE line_uid='${lineId}';`
      }
      connection.query(update_query)
        .then(async ()=>{
          if(subscription && (subscription !== 'trial') && (subscription !=='guest')){
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            await stripe.subscriptions.update(subscription,{cancel_at_period_end: true});
          }
          console.log('subscription削除');
          resolve();
        })
        .catch(e=>console.log(e));
    })
  },

  createSheet: (gmail,userName,line_uid) => {

    return new Promise(async(resolve)=>{

      const sheets = authorize();

      const name = userName;

      //シートにつける年度計算
      const nowTimestamp = new Date().getTime();
      let year;
      const thisMonth = new Date(nowTimestamp+9*60*60*1000).getMonth()+1;
      const today = new Date(nowTimestamp+9*60*60*1000).getDate();
      if(thisMonth<3 || (thisMonth === 3 && today<14)){
        year = new Date(nowTimestamp+9*60*60*1000).getFullYear() - 1;
      }else{
        year = new Date(nowTimestamp+9*60*60*1000).getFullYear();
      }

      const request = {
        resource : {
          //spreadsheetId: '',
          properties: {
            title: `${name}さんの会計シート(${year})`,
            locale: 'ja_JP',
            timeZone:'Asia/Tokyo'
          },
          'sheets': [
            {
              'properties': {
                'sheetId': 0,
                'title': 'デフォルト',
                'index': 1,
                'sheetType': 'GRID',
                'gridProperties': {
                  'rowCount': 50,
                  'columnCount': 400
                }
              }
            }
          ],
        }
      };

      await sheets.spreadsheets.create(request, (err,response)=>{

        const spreadsheetId = response.data.spreadsheetId;
        gmailAccountAdd(spreadsheetId,'owner',ADMIN)
            .then((ssId)=>{
                gmailAccountAdd(spreadsheetId,'writer',gmail)
                    .then((ssID)=>{
                        //既存ssidの取得
                        const select_query = {
                          text: `SELECT * FROM users WHERE line_uid='${line_uid}';`
                        };
                        connection.query(select_query)
                          .then(res=>{
                            console.log('res.rows',res.rows[0]);
                            //usersテーブルに挿入するssidを配列化
                            const ssidArray = [ssID,res.rows[0].ssid,res.rows[0].ssid1,res.rows[0].ssid2,res.rows[0].ssid3];
                            console.log('ssidArray',ssidArray);

                            //updateクエリ
                            const nowTime = new Date().getTime();
                            const update_query = {
                                text:`UPDATE users SET (gmail,ssid,createdat,ssid1,ssid2,ssid3,ssid4) = ('${gmail}','${ssidArray[0]}',${nowTime},'${ssidArray[1]}','${ssidArray[2]}','${ssidArray[3]}','${ssidArray[4]}') WHERE line_uid='${line_uid}';`
                            };
                            connection.query(update_query)
                              .then(()=>{
                                  initialTreat(ssID,line_uid)
                                    .then(message=>{
                                      console.log('message',message);
                                      resolve(message);
                                    })
                                    .catch(e=>console.log(e));
                              })
                              .catch(e=>console.log(e.stack));
                          })
                          .catch(e=>console.log(e));
                    })
                    .catch(e=>console.log(e));
            })
      });
    })
  },
  
  //入力スプレッドシートの変更
  changeTargetSS: (line_uid,target) => {
    return new Promise (resolve=>{
      const update_query = {
        text: `UPDATE users SET target_ss=${target} WHERE line_uid='${line_uid}';`
      }
      connection.query(update_query)
        .then(()=>{
          resolve('update succeeded!');
        })
        .catch(e=>console.log(e));
    });
  }
}