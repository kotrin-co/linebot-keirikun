
const {
  ACCOUNTS,
  NUMBER_OF_ROWS,
  NUMBER_OF_COLUMNS,
  BUTTON_COLOR,
  BUTTON_COLOR_D,
  TRANSACTIONS
} = require('../params/params');

const Data = require('./Data');

module.exports = {

  makeAccountSelector: (number) => {

    //カルーセルの枚数
    const carousels = Math.ceil(ACCOUNTS.length/(NUMBER_OF_ROWS*NUMBER_OF_COLUMNS));

    //フレックスメッセージの原型
    const flexMessage = {
      type:'flex',
      altText:'勘定科目選択',
      contents:
      {
        type:'carousel',
        contents: null
      }
    }

    //バブルコンテンツ
    const bubbleContents = [];

    for(let i=0; i<carousels; i++){

      //バブル雛形
      const bubble = {
        type:'bubble',
        header:{
          type:'box',
          layout:'vertical',
          contents:[
            {
              type:'text',
              text:'科目を選択してください',
              align:'center'
            }
          ]
        },
        body:{
          type:'box',
          layout:'vertical',
          contents:null
        }
      };
      //bodyコンテンツ
      const bodyContents = [];

      for(let j=0; j<NUMBER_OF_ROWS; j++){
        const horizontalContents = [];
        for(let k=0; k<NUMBER_OF_COLUMNS; k++){

          //ACCOUNTSに値があるかの判定
          if((8*i+2*j+k)<=ACCOUNTS.length-1){

            //ポストバックデータの生成
            const postbackData = number ? `account&${number}&${8*i+2*j+k}` : `confirmationByAccount&${8*i+2*j+k}`;
            
            horizontalContents.push({
              type:'button',
              action: {
                type:'postback',
                label:ACCOUNTS[8*i+2*j+k],
                data:postbackData
              },
              color:BUTTON_COLOR,
              style:'primary',
              adjustMode:'shrink-to-fit',
              margin:'md'
            });
          }else{
            horizontalContents.push({
              type:'text',
              text:'　',
              margin:'md'
            });
          }
        }

        bodyContents.push({
          type:'box',
          layout:'horizontal',
          contents:horizontalContents,
          margin:'md'
        });
      }

      bubble.body.contents = bodyContents;
      bubbleContents.push(bubble);
    }

    flexMessage.contents.contents = bubbleContents;

    return flexMessage;
  },

  makeTransactionSelector: (amount,selectedAccount) => {

    //ボタン数を取得(雑収入の場合だけ２個のため)
    const numberOfButtons = ACCOUNTS[selectedAccount]==='雑収入' ? 2:3;
    
    //ボタンの表示ラベル生成
    const buttonLabels = [];
    for(let i=0;i<numberOfButtons;i++){
      buttonLabels.push(`${ACCOUNTS[selectedAccount]}（${TRANSACTIONS[i]}）`);
    }
    //売上の場合だけ３つ目のボタンを源泉所得税に変える
    if(ACCOUNTS[selectedAccount]==='売上') buttonLabels[2] = '源泉所得税';

    const flexMessage = {
      type:'flex',
      altText:'取引方法選択',
      contents:{
        type:'bubble',
        header:{
          type:'box',
          layout:'vertical',
          contents:[
            {
              type:'text',
              text:'取引方法を選択してください',
              size:'lg',
              align:'center'
            }
          ]
        },
        body:{
          type:'box',
          layout:'vertical',
          contents:null
        }
      }
    };

    const bodyContents = [];

    for(let i=0; i<numberOfButtons; i++){
      const postbackData = amount ? `transaction&${amount}&${selectedAccount}&${i}` : `confirmationByTransaction&${selectedAccount}&${i}`;
      bodyContents.push({
        type:'button',
        action:{
          type:'postback',
          label:buttonLabels[i],
          data:postbackData
        },
        color:BUTTON_COLOR,
        style:'primary',
        margin:'md',
        adjustMode:'shrink-to-fit'
      })
    }

    flexMessage.contents.body.contents = bodyContents;

    return flexMessage;
  },

  makeDateSelector: (mode,amount,selectedAccount,selectedTransaction) => {
    let postbackData;
    if(mode === 'input'){
      postbackData = `date&${amount}&${selectedAccount}&${selectedTransaction}`;
    }else if(mode === 'confirmation'){
      postbackData = 'confirmationByDate';
    }else if(mode === 'delete'){
      postbackData = 'delete';
    }

    const flexMessage = {
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
              "text": "対象日を選んでください",
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
                "data": postbackData,
                "mode": "date"
              }
            }
          ]
        }
      }
    };
    return flexMessage;
  },

  // makeDateChoiceForConfirmation: (mode) => {
  //   const flexMessage = {
  //     "type":"flex",
  //     "altText":"日付選択",
  //     "contents":
  //     {
  //       "type": "bubble",
  //       "body": {
  //         "type": "box",
  //         "layout": "vertical",
  //         "contents": [
  //           {
  //             "type": "text",
  //             "text": "対象日を選んでください",
  //             "size": "md",
  //             "align": "center"
  //           }
  //         ]
  //       },
  //       "footer": {
  //         "type": "box",
  //         "layout": "vertical",
  //         "contents": [
  //           {
  //             "type": "button",
  //             "action": {
  //               "type": "datetimepicker",
  //               "label": "日付を選択する",
  //               "data": mode,
  //               "mode": "date"
  //             }
  //           }
  //         ]
  //       }
  //     }
  //   };
  //   return flexMessage;
  // },

  //削除用の科目選択カルーセルを動的に生成
  makeAccountChoiceForDelete: (selectedDate,foundValues) => {
    console.log('foundValues',foundValues);
    const NUMBER_OF_BUTTONS =5; //カルーセルの中の段数

    // const accountsExist = [];
    // foundValues.forEach((obj,index)=>{
    //   accountsExist.push([ACCOUNTS.indexOf(obj.account),obj.value])
    // })
    const numberOfSlides = Math.ceil(foundValues.length/NUMBER_OF_BUTTONS); //カルーセルの中のスライド枚数

    const mainMessage = {
      type:'flex',
      altText:'勘定科目選択',
      contents:
      {
        type:'carousel',
        contents: null
      }
    }

    const bubbleContents = [];

    for(let i=0;i<numberOfSlides;i++){

      //カルーセルの中のコンテンツ生成
      const contentsOfCarousel = {
        type:'bubble',
        header:{
          type:'box',
          layout:'vertical',
          contents:[
            {
              type:'text',
              text:'削除する項目を選んでください',
              align:'center'
            }
          ]
        }
      };

      const bodyContents = [];
      const l = i===numberOfSlides-1 ? foundValues.length-NUMBER_OF_BUTTONS*i : NUMBER_OF_BUTTONS;
      for(let j=0;j<l;j++){
        bodyContents.push({
          type: 'button',
          action: {
            type: 'postback',
            label: `${foundValues[NUMBER_OF_BUTTONS*i+j].account}(${foundValues[NUMBER_OF_BUTTONS*i+j].transaction}) ￥${foundValues[NUMBER_OF_BUTTONS*i+j].value}`,
            data: `deleteAccount&${selectedDate}&${ACCOUNTS.indexOf(foundValues[NUMBER_OF_BUTTONS*i+j].account)}&${TRANSACTIONS.indexOf(foundValues[NUMBER_OF_BUTTONS*i+j].transaction)}`
          },
          color:BUTTON_COLOR_D,
          style:'primary',
          adjustMode:'shrink-to-fit',
          margin:'md'
        });
      }
      contentsOfCarousel.body = {
        type:'box',
        layout:'vertical',
        contents:bodyContents
      };
      bubbleContents.push(contentsOfCarousel);
    }

    mainMessage.contents.contents = bubbleContents;
    console.log('main',mainMessage);
    console.log('bubble',bubbleContents[0].body.contents);

    return mainMessage;
  },

  sheetSelector: async (line_uid) => {
    const userInfo = await Data.getUserDataByLineId(line_uid);
    console.log('userInfo in selector',userInfo);
    const ssidArray = [];

    //ssが存在したらidをssidArrayへ格納する
    if(userInfo.ssid　&& userInfo.ssid !== 'null') ssidArray.push(userInfo.ssid);
    if(userInfo.ssid1　&& userInfo.ssid1 !== 'null') ssidArray.push(userInfo.ssid1);
    if(userInfo.ssid2　&& userInfo.ssid2 !== 'null') ssidArray.push(userInfo.ssid2);
    if(userInfo.ssid3　&& userInfo.ssid3 !== 'null') ssidArray.push(userInfo.ssid3);
    if(userInfo.ssid4　&& userInfo.ssid4 !== 'null') ssidArray.push(userInfo.ssid4);
    console.log('ssidArray',ssidArray);

    //現状の入力対象のスプレッドシート
    const target = userInfo.target_ss;
    if(ssidArray[target]){

      //年度の計算
      const nowTimestamp = new Date().getTime();
      let year;
      const thisMonth = new Date(nowTimestamp+9*60*60*1000).getMonth()+1;
      const today = new Date(nowTimestamp+9*60*60*1000).getDate();
      if(thisMonth<3 || (thisMonth === 3 && today<14)){
        year = new Date(nowTimestamp+9*60*60*1000).getFullYear() - 1;
      }else{
        year = new Date(nowTimestamp+9*60*60*1000).getFullYear();
      }

      //ボタン要素の自動生成
      const bodyContents = [];
      ssidArray.forEach((value,index) => {
        const buttonColor = index == target ? 'primary' : 'secondary';
        const buttonObject = {
          type: "button",
          action: {
            type: "postback",
            label: `${year-index}年度`,
            data: `change_ss&${index}`
          },
          style: buttonColor,
          margin: "md"
        }
        bodyContents.push(buttonObject);
      });

      //flexMessageの生成
      const flexMessage = {
        type:"flex",
        altText:"入力スプレッドシート切替",
        contents:
        {
          type: "bubble",
          header: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "入力したいシートの年度をお選びください",
                wrap: true,
                size: "lg"
              }
            ]
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: bodyContents
          }
        }
      }

      return flexMessage;

    }else{
      return {
        type: 'text',
        text: '対象のスプレッドシートが存在していません。'
      }
    }
  }

  // makeAccountChoiceForConfirmation: () => {
  //   const flexMessage = {
  //     "type":"flex",
  //     "altText":"勘定科目選択",
  //     "contents":
  //     {
  //       "type": "carousel",
  //       "contents": [
  //         {
  //           "type": "bubble",
  //           "header": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "text",
  //                 "text": "科目を選んでください",
  //                 "align": "center"
  //               }
  //             ]
  //           },
  //           "body": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "売上",
  //                   "data": "confirmationByAccount&0"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "源泉所得税",
  //                   "data": "confirmationByAccount&1"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "交通費",
  //                   "data": "confirmationByAccount&2"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "会議費",
  //                   "data": "confirmationByAccount&3"
  //                 }
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           "type": "bubble",
  //           "header": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "text",
  //                 "text": "科目を選んでください",
  //                 "align": "center"
  //               }
  //             ]
  //           },
  //           "body": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "接待交際費",
  //                   "data": "confirmationByAccount&4"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "通信費",
  //                   "data": "confirmationByAccount&5"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "衣装費",
  //                   "data": "confirmationByAccount&6"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "郵便代",
  //                   "data": "confirmationByAccount&7"
  //                 }
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           "type": "bubble",
  //           "header": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "text",
  //                 "text": "科目を選んでください",
  //                 "align": "center"
  //               }
  //             ]
  //           },
  //           "body": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "保険料",
  //                   "data": "confirmationByAccount&8"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "年金",
  //                   "data": "confirmationByAccount&9"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "家賃",
  //                   "data": "confirmationByAccount&10"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "従業員報酬",
  //                   "data": "confirmationByAccount&11"
  //                 }
  //               }
  //             ]
  //           }
  //         },
  //         {
  //           "type": "bubble",
  //           "header": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "text",
  //                 "text": "科目を選んでください",
  //                 "align": "center"
  //               }
  //             ]
  //           },
  //           "body": {
  //             "type": "box",
  //             "layout": "vertical",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "その他",
  //                   "data": "confirmationByAccount&12"
  //                 }
  //               },
  //               {
  //                 "type": "separator"
  //               }
  //             ]
  //           }
  //         }
  //       ]
  //     }
  //   }
  //   return flexMessage;
  // },

}