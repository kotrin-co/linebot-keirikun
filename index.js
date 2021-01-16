const express = require('express');
const line = require('@line/bot-sdk');
const path = require('path');
const { Client } = require('pg');
const { google } = require('googleapis');
const multipart = require('connect-multiparty');
const privatekey = require('./client_secret.json');
const router = require('./routers/index');
const apiRouter = require('./routers/api');
const settlementRouter = require('./routers/settlement');
const Data = require('./models/Data');
const original_SSID = '13Y2AZYNHWnQNKdSzK5Vxna_YPdf4YnT61imptdiM_MU';
const original_SID = [0,1686142823];
const ACCOUNTS = ['収入','売上','支出','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他'];

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
    text:'CREATE TABLE IF NOT EXISTS users (id SERIAL NOT NULL, line_uid VARCHAR(50), display_name VARCHAR(50), timestamp BIGINT, gmail VARCHAR(100), ssid VARCHAR(100));'
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
  .get('/settlement',settlementRouter)
  .get('/checkout-session',async (req,res)=>{
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
  })
  .get('/success',(req,res)=>{
    res.render('pages/success');
  })
  .post('/create-checkout-session',async(req,res)=>{
    const domainURL = 'https://lienbot-keiri.herokuapp.com';
    const { priceId } = req.body;

    try{
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        success_url: `${domainURL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/canceled`
      });
      res.send({
        sessionId: session.id
      });

    }catch(e){
      res.status(400);
      return res.send({
        error: {
          message: e.message
        }
      });
    }
  })
  .get('/setup',(req,res)=>{
    res.send({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      basicPrice: process.env.BASIC_PRICE_ID,
      proPrice: process.env.PRO_PRICE_ID
    });
  })
  .post('/customer-portal',async(req,res)=>{
    const { sessionId } = req.body;
    const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);
    const returnUrl = 'https://linebot-keiri.herokuapp.com';
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

    const table_insert = {
        text:'INSERT INTO users (line_uid,display_name,timestamp) VALUES($1,$2,$3);',
        values:[ev.source.userId,profile.displayName,ev.timestamp]
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

const delete_user = (ev) => {
    const delete_query = {
        text:'DELETE FROM users WHERE line_uid=$1;',
        values: [`${ev.source.userId}`]
    };

    connection.query(delete_query)
        .then(()=>{
            console.log('ユーザーデータをテーブルから削除');
        })
        .catch(e=>console.log(e));
}

const handleMessageEvent = async (ev) => {

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
  
              else if( text === 'けーり君と話して会計入力したい！'){
                return client.replyMessage(ev.replyToken,{
                  "type":"text",
                  "text":"金額を半角数値で入力してください！"
                });
              }
              else if(text.match(/^([1-9]\d*|0)$/)){
              // else if(/^([1-9]\d*|0)$/.test(text)){
                return client.replyMessage(ev.replyToken,{
                  "type":"flex",
                  "altText":"勘定科目選択",
                  "contents":
                  {
                    "type": "carousel",
                    "contents": [
                      {
                        "type": "bubble",
                        "header": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "text",
                              "text": "勘定科目を選んでください",
                              "size": "md",
                              "align": "center"
                            }
                          ]
                        },
                        "body": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "収入",
                                "data": `account&${text}&0`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "売上",
                                "data": `account&${text}&1`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "支出",
                                "data": `account&${text}&2`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "源泉所得税",
                                "data": `account&${text}&3`
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "bubble",
                        "header": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "text",
                              "text": "勘定科目を選んでください",
                              "align": "center"
                            }
                          ]
                        },
                        "body": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "交通費",
                                "data": `account&${text}&4`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "会議費",
                                "data": `account&${text}&5`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "接待交際費",
                                "data": `account&${text}&6`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "通信費",
                                "data": `account&${text}&7`
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "bubble",
                        "header": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "text",
                              "text": "勘定科目を選んでください",
                              "align": "center"
                            }
                          ]
                        },
                        "body": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "data": `account&${text}&8`,
                                "label": "衣装費"
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "郵便代",
                                "data": `account&${text}&9`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "保険料",
                                "data": `account&${text}&10`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "年金",
                                "data": `account&${text}&11`
                              }
                            }
                          ]
                        }
                      },
                      {
                        "type": "bubble",
                        "header": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "text",
                              "text": "勘定科目を選んでください",
                              "align": "center"
                            }
                          ]
                        },
                        "body": {
                          "type": "box",
                          "layout": "vertical",
                          "contents": [
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "家賃",
                                "data": `account&${text}&12`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "従業員報酬",
                                "data": `account&${text}&13`
                              }
                            },
                            {
                              "type": "separator"
                            },
                            {
                              "type": "button",
                              "action": {
                                "type": "postback",
                                "label": "その他",
                                "data": `account&${text}&14`
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                });
              }else{
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
}

const handlePostbackEvent = (ev) => {
  const postbackData = ev.postback.data.split('&');

  if(postbackData[0] === 'account'){
    const amount = parseInt(postbackData[1]);
    const selectedAccount = parseInt(postbackData[2]);
    return client.replyMessage(ev.replyToken,{
      "type":"flex",
      "altText":"日付選択",
      "contents":
      {
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "来店希望日を選んでください。",
              "size": "md",
              "align": "center"
            }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "datetimepicker",
                "label": "日付を選択する",
                "data": `date&${amount}&${selectedAccount}`,
                "mode": "date"
              }
            }
          ]
        }
      }
    })
  }

  else if(postbackData[0] === 'date'){
    const amountInput = postbackData[1]
    const accountSelect = ACCOUNTS[parseInt(postbackData[2])];
    const selectedDate = ev.postback.params.date;
    const selectedMonth = parseInt(selectedDate.split('-')[1]);
    const selectedDay = parseInt(selectedDate.split('-')[2]);
    const line_uid = ev.source.userId;
    Data.inputSS({amountInput,accountSelect,selectedMonth,selectedDay,line_uid})
      .then(newValue=>{
        return client.replyMessage(ev.replyToken,{
          "type":"text",
          "text":`会計表を${newValue}へ更新しました！`
        });
      })
      .catch(e=>console.log(e));
  }
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

    const request = {
        resource : {
          //spreadsheetId: '',
          properties: {
            title: `${name}さんの会計シート`,
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
    // const auth = await google.auth.getClient({
    //   scopes: ['https://www.googleapis.com/auth/spreadsheets']
    // });
    const sheets = google.sheets({version: 'v4', auth});

    //列データの生成
    // const datesArray = [];
    // const thisYear = new Date().getFullYear();
    // const oneDay = 24*60*60*1000;
    // const start = new Date(`${thisYear}/1/1 00:00`).getTime();
    // console.log('start=',start);
    // for(let i=0;i<365;i++){
    //   const date = (new Date(start+i*oneDay).getMonth()+1) + '/' + new Date(start+i*oneDay).getDate();
    //   datesArray.push(date);
    // }

    //行データの生成
    // const account = ['収入','売上','支出','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他']
    // const request_column = {
    //   spreadsheetId: ssID,
    //   range: '入力用シート!B1',
    //   valueInputOption: 'RAW',
    //   resource: {
    //     values: [datesArray]
    //   }
    // };

    // const request_row = {
    //   spreadsheetId: ssID,
    //   range: '入力用シート!A2',
    //   valueInputOption: 'RAW',

    //   resource: {
    //     values: [[account[0]],[account[1]],[account[2]]]
    //   }
    // };
    const title_SID = ['入力用シート','確定申告B 第一表']

    original_SID.forEach((id,index)=>{
      const copy_request = {
        spreadsheetId: original_SSID,
        sheetId: id,
        resource: {
          destinationSpreadsheetId: ssID
        }
      }
      sheets.spreadsheets.sheets.copyTo(copy_request)
        .then(response=>{
          console.log('sheetId',response.data.sheetId);
          const title_change_request = {
            spreadsheetId: ssID,
            resource: {
              requests: [
                {
                  'updateSheetProperties': {
                    'properties': {
                      'sheetId': response.data.sheetId,
                      'title': title_SID[index]
                    },
                    'fields': 'title'
                  }
                }
              ]
            }
          }
          sheets.spreadsheets.batchUpdate(title_change_request)
            .then(res=>{
              const update_query = {
                text:`UPDATE users SET sid${index+1} = ${response.data.sheetId} WHERE line_uid='${line_uid}';`
              };
              connection.query(update_query)
                .then(()=>{
                  console.log('usersテーブル更新成功')
                  if(index === original_SID.length-1){
                    // 空白シートの削除
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
                    }
                    sheets.spreadsheets.batchUpdate(delete_request)
                      .then(res=>{
                        console.log('不要シート削除成功');
                        resolve('initial treat successfully');
                      })
                      .catch(e=>console.log(e));
                  }
                })
                .catch(e=>console.log(e));
            })
            .catch(e=>console.log(e));
        })
        .catch(e=>console.log(e));
    });
  });
}