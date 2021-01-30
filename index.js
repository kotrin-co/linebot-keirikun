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
const { copy } = require('./routers/index');

const {
  ACCOUNTS,
  original_SSID,
  original_SID,
  TRANSACTIONS,
  FREE_TRIAL_PERIOD
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
    text:'CREATE TABLE IF NOT EXISTS users (id SERIAL NOT NULL, line_uid VARCHAR(50), display_name VARCHAR(50), timestamp BIGINT, gmail VARCHAR(100), ssid VARCHAR(100), subscription VARCHAR(50));'
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
  .get('/checkout-session',async (req,res)=>{
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
  })
  // .post('/create-checkout-session',async(req,res)=>{
    // const domainURL = 'https://lienbot-keiri.herokuapp.com';
    // const { priceId } = req.body;

    // try{
    //   const session = await stripe.checkout.sessions.create({
    //     mode: 'subscription',
    //     payment_method_types: ['card'],
    //     line_items: [
    //       {
    //         price: priceId,
    //         quantity: 1
    //       }
    //     ],
    //     // success_url: 'https://linebot-keiri.herokuapp.com/success?session_id={CHECKOUT_SESSION_ID}',
    //     success_url: 'https://liff.line.me/1655219547-2EG4LMYx?session_id={CHECKOUT_SESSION_ID}',
    //     cancel_url: `${domainURL}/canceled`
    //   });
    //   res.send({
    //     sessionId: session.id
    //   });

    // }catch(e){
    //   res.status(400);
    //   return res.send({
    //     error: {
    //       message: e.message
    //     }
    //   });
    // }
  // })
  // .get('/setup',(req,res)=>{
  //   res.send({
  //     publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  //     monthlyPrice: process.env.MONTHLY_PRICE_ID,
  //     yearlyPrice: process.env.YEARLY_PRICE_ID
  //   });
  // })
  .post('/customer-portal',async(req,res)=>{
    const { sessionId } = req.body;
    const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);
    const returnUrl = 'https://liff.line.me/1655219547-eobVGLdB';
    const portalsession = await stripe.billingPortal.sessions.create({
      customer: checkoutsession.customer,
      return_url: returnUrl
    });
    res.send({
      url: portalsession.url
    });
  })
  .post('/webhook',async(req,res)=>{
    let eventType;
    if (process.env.STRIPE_WEBHOOK_SECRET){
      let event;
      let signature = req.headers['stripe-signature'];

      try{
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      }catch(err){
        console.log(`⚠️  Webhook signature verification failed.`);
        return res.sendStatus(400);
      }
      data = req.body.data;
      eventType = req.body.type;
    }
    if(eventType === 'checkout.session.completed'){
      console.log(`🔔  Payment received!`);
    }
    res.sendStatus(200);
  })
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
            text:'INSERT INTO users (line_uid,display_name,timestamp,subscription) VALUES($1,$2,$3);',
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
                    "text":'Gmailアドレスを教えてください！（半角英数字、メールアドレス以外の文字は返信しないでください）'
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

  const available = await availableCheck(ev);

  if(available){
    const text = (ev.message.type === 'text') ? ev.message.text : '';
    const profile = await client.getProfile(ev.source.userId);

    const select_query = {
        text:'SELECT * FROM users WHERE line_uid=$1;',
        values: [`${ev.source.userId}`]
    };

    connection.query(select_query)
      .then(res=>{
        console.log('res.rows[0]:',res.rows[0]);
        if(res.rows[0].gmail){
          if( text === '消す'){
            const update_query = {
              text:`UPDATE users SET (gmail,ssid) = ('','') WHERE line_uid='${ev.source.userId}';`
            };
            connection.query(update_query)
              .then(()=>console.log('消した！！'))
              .catch(e=>console.log(e));
          }

          else if( text === 'けーり君サポートお願い！'){
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
          else if(text.match(/^[+\-]?([1-9]\d*|0)$/)){
            const flexMessage = Flex.makeAccountSelector(text);
            return client.replyMessage(ev.replyToken,flexMessage);

          }
          else if(text === '日付からデータ確認！'){
            const flexMessage = Flex.makeDateSelector('confirmation','','','');
            return client.replyMessage(ev.replyToken,flexMessage);
          }
          else if(text === '科目からデータ確認！'){
            const flexMessage = Flex.makeAccountSelector('');
            return client.replyMessage(ev.replyToken,flexMessage);
          }
          else if(text === 'データ削除'){
            const flexMessage = Flex.makeDateSelector('delete','','','');
            return client.replyMessage(ev.replyToken,flexMessage);
          }
          else{
            return client.replyMessage(ev.replyToken,{
              "type":"text",
              "text":"半角数字をメッセージで送ると、会計データを入力できますよ^^"
            });
          }
        }else{
          const reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@gmail.com/;
          if(reg.test(text)){
            console.log('メアドOK');
            const userName = profile.displayName;
            createSheet(text,userName,ev);
          }else{
            console.log('間違っている');
            return client.replyMessage(ev.replyToken,{
                "type":"text",
                "text":"まずはメールアドレスを登録しましょう。（Gmailアドレスのみを送ってください。）"
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
      const flexMessage = Flex.makeDateSelector('input',amount,selectedAccount,selectedTransaction);
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
        .then(newValue=>{
          const account = (selectedAccount===0 && selectedTransaction===2) ? '源泉所得税' : `${ACCOUNTS[selectedAccount]}(${TRANSACTIONS[selectedTransaction]})`;
          return client.replyMessage(ev.replyToken,{
            "type":"text",
            "text":`${selectedMonth}月${selectedDay}日の「${account}」を"${newValue}"へ更新しました！`
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

const createSheet = async (address,userName,ev) => {

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

    const name = userName;
    const year = new Date().getFullYear();

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
      gmailAccountAdd(spreadsheetId,'owner','kentaro523@gmail.com')
          .then((ssId)=>{
              gmailAccountAdd(spreadsheetId,'writer',address)
                  .then((ssID)=>{
                      const update_query = {
                          text:`UPDATE users SET (gmail,ssid) = ('${address}','${ssID}') WHERE line_uid='${ev.source.userId}';`
                      };
          
                      connection.query(update_query)
                          .then(()=>{
                              initialTreat(jwtClient,ssID,ev.source.userId)
                                .then(message=>{
                                  console.log('message',message);
                                  return client.replyMessage(ev.replyToken,{
                                    "type":"text",
                                    "text":`${userName}さん、会計シートが正しく作れました\uDBC0\uDC04`
                                  });
                                })
                                .catch(e=>console.log(e));
                          })
                          .catch(e=>console.log(e.stack));
                  })
                  .catch(e=>console.log(e));
          })
    });
}

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

const initialTreat = (auth,ssID,line_uid) => {

  return new Promise((resolve,reject) => {

    const sheets = google.sheets({version: 'v4', auth});

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
                                    resolve('initial treat success!');
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