const express = require('express');
const line = require('@line/bot-sdk');
const path = require('path');
const { Client } = require('pg');
const { google } = require('googleapis');
const multipart = require('connect-multiparty');
const privatekey = require('./client_secret.json');
const router = require('./routers/index');
const apiRouter = require('./routers/api');
const settingsRouter = require('./routers/settings');
const Data = require('./models/Data');
const Flex = require('./models/Flex');
// const { copy } = require('./routers/index');

const {
  ACCOUNTS,
  TRANSACTIONS,
  FREE_TRIAL_PERIOD,
  CORRECTED_YEAR,
  START_TS,
  END_TS
} = require('./params/params');

//stripeの設定
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PORT = process.env.PORT || 5000;

const config = {
    channelAccessToken:process.env.ACCESS_TOKEN,
    channelSecret:process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

const connection = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
connection.connect();

const create_userTable = {
    text:'CREATE TABLE IF NOT EXISTS users (id SERIAL NOT NULL, line_uid VARCHAR(50), display_name VARCHAR(50), timestamp BIGINT, gmail VARCHAR(100), ssid VARCHAR(100), subscription VARCHAR(50), createdat BIGINT);'
};
    
connection.query(create_userTable)
    .then(()=>{
        console.log('table users created successfully!!');
    })
    .catch(e=>console.log(e));

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .use(multipart())
  .post('/hook',line.middleware(config),(req,res)=> lineBot(req,res))
  .use(express.json()) //これが/apiルーティングの前にこないと、ダメ
  .use(express.urlencoded({extended:true}))　//これが/apiルーティングの前にこないと、ダメ
  .use('/',router)
  .use('/api',apiRouter)
  .use(
    express.json({
      verify: (req,res,buf)=>{
        if(req.originalUrl.startsWith('/webhook')){
          req.rawBody = buf.toString();
        }
      }
    })
  )
  .use('/settings',settingsRouter)
  .listen(PORT,()=>console.log(`Listening on ${PORT}`));

const lineBot = (req,res) => {
    res.status(200).end();
    const events = req.body.events;
    const promises = [];

    for(let i=0;i<events.length;i++){
        const ev = events[i];
        console.log("ev:",ev);

        switch(ev.type){
            case 'follow':
                promises.push(greeting_follow(ev));
                break;
            
            case 'unfollow':
                promises.push(delete_user(ev));
                break;
            
            case 'message':
                promises.push(handleMessageEvent(ev));
                break;
            
            case 'postback':
                promises.push(handlePostbackEvent(ev));
                break;
        }
    }

    Promise
        .all(promises)
        .then(console.log('all promises passed'))
        .catch(e=>console.error(e.stack));
}

const greeting_follow = async (ev) => {
    const profile = await client.getProfile(ev.source.userId);

    const select_query = {
      text:`SELECT * FROM users WHERE line_uid='${ev.source.userId}';`
    };

    connection.query(select_query)
      .then(res=>{
        if(res.rows.length){
          console.log('過去に登録されたユーザーです');
          return client.replyMessage(ev.replyToken,{
            "type":"text",
            "text":`${profile.displayName}さん、おかえりなさい\uDBC0\uDC04`
          });
        }else{
          const table_insert = {
            text:'INSERT INTO users (line_uid,display_name,timestamp,subscription) VALUES($1,$2,$3,$4);',
            values:[ev.source.userId,profile.displayName,ev.timestamp,'trial']
          };
          connection.query(table_insert)
            .then(()=>{
                console.log('insert successfully!!')
                return client.replyMessage(ev.replyToken,[{
                    "type":"text",
                    "text":`${profile.displayName}さん、フォローありがとうございます\uDBC0\uDC04`
                },
                {
                    "type":"text",
                    "text":`無料トライアル期間は${FREE_TRIAL_PERIOD}日間です。まずは設定画面でGmailアドレスを登録して、会計スプレッドシートを作成しましょう！！`
                }
                ]);
            })
            .catch(e=>console.log(e));
        }
      })
}

const delete_user = (ev) => {
  const select_query = {
    text:`SELECT * FROM users WHERE line_uid='${ev.source.userId}';`
  }
  connection.query(select_query)
    .then(res=>{
      Data.cancellation(ev.source.userId,res.rows[0].subscription)
        .then(()=>{
          console.log('サブスクを解除しました');
        })
        .catch(e=>console.log(e));
    })
    .catch(e=>console.log(e));
}

const handleMessageEvent = async (ev) => {

  //課金チェック
  const available = await availableCheck(ev);

  if(available){
    const text = (ev.message.type === 'text') ? ev.message.text : '';
    const profile = await client.getProfile(ev.source.userId);

    const select_query = {
        text:'SELECT * FROM users WHERE line_uid=$1;',
        values: [`${ev.source.userId}`]
    };

    connection.query(select_query)
      .then(async(res)=>{
        //ssidの抜き出し
        const ssidArray = [];
        if(res.rows.length){
          ssidArray[0] = res.rows[0].ssid ? res.rows[0].ssid : null;
          ssidArray[1] = res.rows[0].ssid1 ? res.rows[0].ssid1 : null;
          ssidArray[2] = res.rows[0].ssid2 ? res.rows[0].ssid2 : null;
          ssidArray[3] = res.rows[0].ssid3 ? res.rows[0].ssid3 : null;
          ssidArray[4] = res.rows[0].ssid4 ? res.rows[0].ssid4 : null;
        }
        console.log('ssidArray:',ssidArray);
        if(ssidArray[0]){
          
          //シート作成日時を比較する
          let year = CORRECTED_YEAR;

          //シート更新可能日
          const startPoint = START_TS;
          const endPoint = END_TS;

          const createdAt = parseInt(res.rows[0].createdat);

          if((createdAt>=startPoint) && (createdAt<endPoint)){
            if( text === 'けーり君サポートお願い！'){
              return client.replyMessage(ev.replyToken,[
                {
                  "type":"text",
                  "text":"金額を半角数値で入力してください！"
                },
                {
                  "type":"text",
                  "text":"マイナスの数値を入力すると元の数値から減算されるよ!"
                }
              ]);
            }

            else if(text === '入力するスプレッドシートを切り替える'){
              console.log('corrected year',CORRECTED_YEAR);
              const flexMessage = await Flex.sheetSelector(ev.source.userId);
              return client.replyMessage(ev.replyToken,flexMessage);
            }

            else if(text.match(/^[+\-]?([1-9]\d*|0)$/)){
              const flexMessage = Flex.makeAccountSelector(text);
              return client.replyMessage(ev.replyToken,flexMessage);
            }
            else if(text === '日付からデータ確認！'){
              const flexMessage = await Flex.makeDateSelector('confirmation','','','',ev.source.userId);
              return client.replyMessage(ev.replyToken,flexMessage);
            }
            else if(text === '科目からデータ確認！'){
              const flexMessage = Flex.makeAccountSelector('');
              return client.replyMessage(ev.replyToken,flexMessage);
            }
            else if(text === 'データ削除'){
              const flexMessage = await Flex.makeDateSelector('delete','','','',ev.source.userId);
              return client.replyMessage(ev.replyToken,flexMessage);
            }

            else if(text === 'テスト'){
              //テスト用シフト（ここだけ変えれば良い）
              const testShift = -1;

              //年度計算
              const nowTimestamp = new Date().getTime(); 
              let year;
              const thisMonth = new Date(nowTimestamp+9*60*60*1000).getMonth()+1;
              const today = new Date(nowTimestamp+9*60*60*1000).getDate();
              if(thisMonth<3 || (thisMonth === 3 && today< (16 + testShift))){
                year = new Date(nowTimestamp+9*60*60*1000).getFullYear() - 1;
              }else{
                year = new Date(nowTimestamp+9*60*60*1000).getFullYear();
              }
            }
            
            else{
              return client.replyMessage(ev.replyToken,{
                "type":"text",
                "text":"半角数字をメッセージで送ると、会計データを入力できますよ^^"
              });
            }
          }else{
            return client.replyMessage(ev.replyToken,{
              "type":"text",
              "text":"新しい年となりました。設定から新しいシートを作成してください"
            });
          }
        }else{
          if(text === '吾輩はゲストユーザーである'){
            console.log('ゲストユーザー');
            const update_query = {
              text: `UPDATE users SET subscription='guest' WHERE line_uid='${ev.source.userId}';`
            };
            connection.query(update_query)
              .then(()=>{
                console.log('ゲストユーザー登録完了');
                return client.replyMessage(ev.replyToken,{
                  "type":"text",
                  "text":"あなたをゲストユーザーとして登録しました^^"
                });
              })
              .catch(e=>console.log(e));
          }else{
            console.log('間違っている');
            return client.replyMessage(ev.replyToken,{
                "type":"text",
                "text":"まずは設定画面でメールアドレスを登録してスプレッドシートを作りましょう！"
            });
          }
        }
      })
      .catch(e=>console.log(e));
  }else{
    return client.replyMessage(ev.replyToken,{
      "type":"text",
      "text":`けーり君の無料試用期間が切れてしました\uDBC0\uDC1C ぜひご購入をお願いします\uDBC0\uDC04`
    });
  }
}

const handlePostbackEvent = async (ev) => {

  const available = await availableCheck(ev);

  if(available){
    const postbackData = ev.postback.data.split('&');

    if(postbackData[0] === 'account'){
      const amount = parseInt(postbackData[1]);
      const selectedAccount = parseInt(postbackData[2]);
      const flexMessage = Flex.makeTransactionSelector(amount,selectedAccount);
      return client.replyMessage(ev.replyToken,flexMessage);
    }

    else if(postbackData[0] === 'transaction'){
      const amount = parseInt(postbackData[1]);
      const selectedAccount = parseInt(postbackData[2]);
      const selectedTransaction = parseInt(postbackData[3]);
      const flexMessage = await Flex.makeDateSelector('input',amount,selectedAccount,selectedTransaction,ev.source.userId);
      console.log('flex',flexMessage);
      return client.replyMessage(ev.replyToken,flexMessage);
    }

    else if(postbackData[0] === 'date'){
      const amountInput = postbackData[1]
      const selectedAccount = parseInt(postbackData[2]);
      const selectedTransaction = parseInt(postbackData[3]);
      const selectedDate = ev.postback.params.date;
      const selectedMonth = parseInt(selectedDate.split('-')[1]);
      const selectedDay = parseInt(selectedDate.split('-')[2]);
      const line_uid = ev.source.userId;
      Data.inputSS({amountInput,selectedAccount,selectedTransaction,selectedMonth,selectedDay,line_uid})
        .then(array=>{
          const account = (selectedAccount===0 && selectedTransaction===2) ? '源泉所得税' : `${ACCOUNTS[selectedAccount]}(${TRANSACTIONS[selectedTransaction]})`;
          return client.replyMessage(ev.replyToken,{
            "type":"text",
            "text":`${array[0]}年度シートの${selectedMonth}月${selectedDay}日の「${account}」を"${array[1]}"へ更新しました！`
          });
        })
        .catch(e=>console.log(e));
    }

    else if(postbackData[0] === 'confirmationByDate'){
      const selectedDate = ev.postback.params.date;
      const selectedMonth = parseInt(selectedDate.split('-')[1]);
      const selectedDay = parseInt(selectedDate.split('-')[2]);
      const line_uid = ev.source.userId;
      Data.findValuesByDate({selectedMonth,selectedDay,line_uid})
        .then(foundValues=>{
          console.log('foundValues in index',foundValues);
          let message = ''
          if(foundValues.length){
            foundValues.forEach((object,index)=>{
              if(index === 0){
                message += `「${selectedMonth}月${selectedDay}日」データ\n■■■■■■■■■\n\n`+object.account + '('+object.transaction+'):' + object.value+'円';
              }
              else{
                message += '\n'+object.account + '('+object.transaction+'):' + object.value+'円';
              }
            });
            message += '\n\n■■■■■■■■■';
          }else{
            message = 'その日時のデータはありません';
          }
          return client.replyMessage(ev.replyToken,{
            "type":"text",
            "text":message
          });
        })
        .catch(e=>console.log(e));
    }

    else if(postbackData[0] === 'confirmationByAccount'){
      const selectedAccount = parseInt(postbackData[1]);
      const flexMessage = Flex.makeTransactionSelector('',selectedAccount);
      return client.replyMessage(ev.replyToken,flexMessage);
    }

    else if(postbackData[0] === 'confirmationByTransaction'){
      const selectedAccount = parseInt(postbackData[1]);
      const selectedTransaction = parseInt(postbackData[2]);
      const line_uid = ev.source.userId;
      Data.findValuesByAccount({selectedAccount,selectedTransaction,line_uid})
        .then(foundValues=>{
          let message = '';
          if(foundValues.length){
            foundValues.forEach((object,index)=>{
              const title = (selectedAccount === 0 && selectedTransaction === 2) ? '源泉所得税' : `${ACCOUNTS[selectedAccount]}(${TRANSACTIONS[selectedTransaction]})`;
              if(index === 0){
                message += `${title}\n■■■■■■■■■\n\n`+object.date + ':' + object.amount+'円';
              }
              else{
                message += '\n'+object.date + ':' + object.amount+'円';
              }
            });
            message += '\n\n■■■■■■■■■';
          }else{
            message = 'その科目・取引のデータはありません';
          }
          return client.replyMessage(ev.replyToken,{
            "type":"text",
            "text":message
          });
        })
        .catch(e=>console.log(e));
    }

    else if(postbackData[0] === 'delete'){
      const selectedDate = ev.postback.params.date;

      //ここから追加
      const selectedMonth = parseInt(selectedDate.split('-')[1]);
      const selectedDay = parseInt(selectedDate.split('-')[2]);
      const line_uid = ev.source.userId;
      Data.findValuesByDate({selectedMonth,selectedDay,line_uid})
        .then(foundValues=>{
          const flexMessage = Flex.makeAccountChoiceForDelete(selectedDate,foundValues);
          return client.replyMessage(ev.replyToken,flexMessage);
        })
    }

    else if(postbackData[0] === 'deleteAccount'){
      const amountInput = null;
      const selectedDate = postbackData[1];
      const selectedAccount = parseInt(postbackData[2]);
      const selectedTransaction = parseInt(postbackData[3]);
      // const accountSelect = ACCOUNTS[parseInt(postbackData[2])];
      const selectedMonth = parseInt(selectedDate.split('-')[1]);
      const selectedDay = parseInt(selectedDate.split('-')[2]);
      const line_uid = ev.source.userId;
      Data.inputSS({amountInput,selectedAccount,selectedTransaction,selectedMonth,selectedDay,line_uid})
        .then(newValue=>{
          return client.replyMessage(ev.replyToken,{
            "type":"text",
            "text":`${selectedMonth}月${selectedDay}日の「${ACCOUNTS[selectedAccount]}(${TRANSACTIONS[selectedTransaction]})」を削除しました！`
          });
        })
        .catch(e=>console.log(e));
    }

    else if(postbackData[0] === 'change_ss'){
      const changeTo = parseInt(postbackData[1]);
      Data.changeTargetSS(ev.source.userId,changeTo)
        .then(res=>{
          console.log(res);

          //シート年度
          let year = CORRECTED_YEAR;
          // let year;
          // const correctedNowTime = new Date().getTime() + 9*60*60*1000;
          // const thisMonth = new Date(correctedNowTime).getMonth()+1;
          // const today = new Date(correctedNowTime).getDate();
          // if(thisMonth<3 || (thisMonth === 3 && today<14)){
          //   year = new Date(correctedNowTime).getFullYear() - 1;
          // }else{
          //   year = new Date(correctedNowTime).getFullYear();
          // }

          return client.replyMessage(ev.replyToken,{
            type: 'text',
            text: `入力シートの対象を${year-changeTo}年度に変更しました`
          });
        })
        .catch(e=>console.log(e));
    }
  }else{
    return client.replyMessage(ev.replyToken,{
      "type":"text",
      "text":`けーり君の無料試用期間が切れてしました\uDBC0\uDC1C ぜひご購入をお願いします\uDBC0\uDC04`
    });
  }
}

//課金状態をチェックし、利用可能か判断するメソッド
const availableCheck = (ev) => {
  return new Promise(resolve=>{
    const select_query = {
      text:`SELECT * FROM users WHERE line_uid='${ev.source.userId}';`
    }
    connection.query(select_query)
      .then(res=>{
        if(res.rows.length){
          const userInfo = res.rows[0];
          
          switch(userInfo.subscription){
            case '':
              resolve(false);
              break;
            
            case 'trial':
              const today = new Date().getTime();
              const registeredDate = userInfo.timestamp;
              console.log('today registered',today,registeredDate);
              if((today-registeredDate)<FREE_TRIAL_PERIOD*24*60*60*1000){
                console.log('無料試用期間中');
                resolve(true);
              }else{
                console.log('無料試用期間終了');
                const update_query = {
                  text: `UPDATE users SET subscription='' WHERE line_uid='${ev.source.userId}';`
                }
                connection.query(update_query)
                  .then(()=>{
                    console.log('usersテーブルからtrial削除');
                    resolve(false);
                  })
                  .catch(e=>console.log(e));
              }
              break;

            case 'guest':
              resolve(true);
              break;
            
            default:
              resolve(true);
              break;
          }
        }else{
          console.log('そのLINE IDのユーザーは登録されていません');
        }
      })
      .catch(e=>console.log(e));
  });
}