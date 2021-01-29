const { Client } = require('pg');
const { google } = require('googleapis');
const privatekey = require('../client_secret.json');

// const ACCOUNTS = ['売上','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他'];
// const DEBIT = ['現金','事業主貸','旅費交通費','会議費','接待交際費','通信費','消耗品費','通信費','事業主貸','事業主貸','地代家賃','給料','その他'];
// const CREDIT = ['売上高','売上高','現金','現金','現金','現金','現金','現金','現金','現金','現金','現金','その他'];

const {
  ACCOUNTS,
  DEBITS,
  CREDITS,
  TRANSACTIONS
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
                  ACCOUNTS[accountNumber]
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

  //ユーザーデータの取得
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
          //スプレッドシートidとシートidの抜き出し
          const ssId = res.rows[0].ssid;
          const inputSheetId = res.rows[0].sid1;
          console.log('ssid sid',ssId,inputSheetId);

          const sheets = authorize();

          //行番号の取得
          let rowNumber = 3*selectedAccount+selectedTransaction+2;
          console.log('rowNum',rowNumber);

          //行番号が備品の場合、rowNumberを１減算する（雑収入が２行しかないため）
          if(selectedAccount === 28) rowNumber--;

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
          const rowNumber = 3*selectedAccount+selectedTransaction+2;
          console.log('rowNumber=',rowNumber);

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