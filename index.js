const express = require('express');
const line = require('@line/bot-sdk');
const { Client } = require('pg');
const { google } = require('googleapis');
const privatekey = require('./client_secret.json');

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
            title: `${name}の会計シート`,
            locale: 'ja_JP',
            timeZone:'Asia/Tokyo'
          },
         'sheets': [
                {
        'properties': {
          'sheetId': 0,
          'title': 'シート1',
          //'index': 0,
          //'sheetType': 'GRID',
          //'gridProperties': {
            //'rowCount': 1000,
            //'columnCount': 26
          //}
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
                .catch(e=>console.log(e))
            
            // const res = JSON.stringify(response,null,2);
            // console.log('response:',response);
            // console.log('config:',response.config);
            // console.log('data:',response.data);
            
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



//sheet名を取得する
// const getSpreadsheetTitleByKey = async (spreadsheetKey) => {

//     const doc = new GoogleSpreadsheet(spreadsheetKey);

//     await doc.useServiceAccountAuth({
//         client_email: CREDIT.client_email,
//         private_key: CREDIT.private_key
//     });

//     await doc.loadInfo();
//     console.log(doc.title);
// }

// getSpreadsheetTitleByKey(SPREADSHEET_KEY);

// const setHeaderToSpreadsheet = async (spreadsheetKey,sheetIndex,headerValues) => {
//     const doc = new GoogleSpreadsheet(spreadsheetKey);
//     await doc.useServiceAccountAuth({
//         client_email: CREDIT.client_email,
//         private_key: CREDIT.private_key
//     });

//     await doc.loadInfo();
//     const sheet = doc.sheetsByIndex[sheetIndex];

//     await sheet.setHeaderRow(headerValues);
// }

// setHeaderToSpreadsheet(SPREADSHEET_KEY,0,['id','name','age']);

//データを挿入する
// const insertItems = async () => {
//     await spreadSheetService.insert({id:1,name:'nakagawa',age:39});
//     await spreadSheetService.insert({id:2,name:'hikaru',age:33});
//     await spreadSheetService.insert({id:3,name:'sakurako',age:35});
//     await spreadSheetService.insert({id:4,name:'gal',age:18});
// }

// insertItems();

// spreadSheetService.select(row => parseInt(row.age) === 33)
//     .then(data=>console.log(data));


// spreadSheetService.updateById('2',{name:'utada'});

// //delete
// spreadSheetService.deleteById('3');
