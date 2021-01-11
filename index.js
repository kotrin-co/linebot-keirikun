const express = require('express');
const line = require('@line/bot-sdk');
const { Client } = require('pg');
const { google } = require('googleapis');
const privatekey = require('./client_secret.json');

const original_SSID = '1ywCoA14h_Ei3Wkicln75beM25I5kLOKFVOVWALvwNgY';
const original_SID = [0,1785812525];

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
    .post('/hook',line.middleware(config),(req,res)=> lineBot(req,res))
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
            if( text === '消す'){
              const update_query = {
                text:`UPDATE users SET (gmail,ssid) = ('','') WHERE line_uid='${ev.source.userId}';`
              };
              connection.query(update_query)
                .then(()=>console.log('消した！！'))
                .catch(e=>console.log(e));
            }else{
              if(!res.rows[0].gmail){
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
              else{
                  return client.replyMessage(ev.replyToken,{
                      "type":"text",
                      "text":"メルアドとシート作成ができましたので、これからサービスの中身を実装していきます^^"
                  });
              }
            }
        })
        .catch(e=>console.log(e));
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
                'title': '入力用シート',
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
                          .then(async ()=>{
                              await initialTreat(jwtClient,ssID,ev.source.userId);
                              console.log('user情報更新成功');
                              return client.replyMessage(ev.replyToken,{
                                  "type":"text",
                                  "text":`${userName}さん、会計シートが正しく作れました\uDBC0\uDC04`
                              });
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

const initialTreat = async (auth,ssID,line_uid) => {
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

  const copied_SID = [];
  const title_SID = ['入力用シート','確定申告B 第一表']

  for(let i=0;i<original_SID.length;i++){
    const copy_request = {
      spreadsheetId: original_SSID,
      sheetId: original_SID[i],
      resource: {
        destinationSpreadsheetId: ssID
      }
    }
    const res = await sheets.spreadsheets.sheets.copyTo(copy_request);
    console.log('res.data.sheetId',res.data.sheetId);
  }


  // copied_SID.forEach(async (id,index) =>{
  //   const title_change_request = {
  //     spreadsheetId: SSID,
  //     resource: {
  //       requests: [
  //         {
  //           'updateSheetProperties': {
  //             'properties': {
  //               'sheetId': id,
  //               'title': title_SID[index]
  //             },
  //             'fields': 'title'
  //           }
  //         }
  //       ]
  //     }
  //   }
  //   await sheets.spreadsheets.batchUpdate(title_change_request);

  //   const update_query = {
  //     text:`UPDATE users SET sid${index+1} = ${id} WHERE line_uid='${line_uid}';`
  //   };
  //   connection.query(update_query)
  //     .then(()=>{
  //       console.log('usersテーブル更新成功')
  //     })
  //     .catch(e=>console.log(e));
  // });

  //空白シートの削除
  // const delete_request = {
  //   spreadsheetId: ssID,
  //   resource: {
  //     requests: [
  //       {
  //         'deleteSheet': {
  //           'sheetId': 0
  //         }
  //       }
  //     ]
  //   }
  // }
  // await sheets.spreadsheets.batchUpdate(delete_request);
  // await sheets.spreadsheets.values.update(request_column);
  // await sheets.spreadsheets.values.update(request_row);
}