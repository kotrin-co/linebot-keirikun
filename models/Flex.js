// const ACCOUNTS = ['売上','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他'];
const NUMBER_OF_BUTTONS =4; //カルーセルの中の段数

const {
  ACCOUNTS,
  NUMBER_OF_ROWS,
  NUMBER_OF_COLUMNS,
  BUTTON_COLOR
} = require('../params/params');

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
          const buttonLabel = ((8*i+2*j+k)<=ACCOUNTS.length-1) ? ACCOUNTS[8*i+2*j+k] : '1';
          horizontalContents.push({
            type:'button',
            action: {
              type:'postback',
              label:buttonLabel,
              data:`account&${number}&${8*i+2*j+k}`
            },
            color:BUTTON_COLOR,
            style:'primary',
            adjustMode:'shrink-to-fit',
            margin:'md'
          });
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
  // {
  //   "type": "carousel",
  //   "contents": [
  //     {
  //       "type": "bubble",
  //       "header": {
  //         "type": "box",
  //         "layout": "vertical",
  //         "contents": [
  //           {
  //             "type": "text",
  //             "text": "科目を選択してください",
  //             "align": "center"
  //           }
  //         ]
  //       },
  //       "body": {
  //         "type": "box",
  //         "layout": "vertical",
  //         "contents": [
  //           {
  //             "type": "box",
  //             "layout": "horizontal",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "売上",
  //                   "data": "account"
  //                 },
  //                 "color": "#434DFF",
  //                 "style": "primary",
  //                 "adjustMode": "shrink-to-fit"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "仕入れ",
  //                   "data": "account"
  //                 },
  //                 "style": "primary",
  //                 "color": "#434DFF",
  //                 "margin": "md",
  //                 "adjustMode": "shrink-to-fit"
  //               }
  //             ]
  //           },
  //           {
  //             "type": "box",
  //             "layout": "horizontal",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "交通費",
  //                   "data": "account"
  //                 },
  //                 "color": "#434DFF",
  //                 "style": "primary",
  //                 "adjustMode": "shrink-to-fit"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "会議費",
  //                   "data": "account"
  //                 },
  //                 "style": "primary",
  //                 "color": "#434DFF",
  //                 "margin": "md",
  //                 "adjustMode": "shrink-to-fit"
  //               }
  //             ],
  //             "margin": "md"
  //           },
  //           {
  //             "type": "box",
  //             "layout": "horizontal",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "接待交際費",
  //                   "data": "account"
  //                 },
  //                 "color": "#434DFF",
  //                 "style": "primary",
  //                 "adjustMode": "shrink-to-fit"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "通信費",
  //                   "data": "account"
  //                 },
  //                 "style": "primary",
  //                 "color": "#434DFF",
  //                 "margin": "md",
  //                 "adjustMode": "shrink-to-fit"
  //               }
  //             ],
  //             "margin": "md"
  //           },
  //           {
  //             "type": "box",
  //             "layout": "horizontal",
  //             "contents": [
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "label": "衣装費",
  //                   "data": "account"
  //                 },
  //                 "color": "#434DFF",
  //                 "style": "primary",
  //                 "adjustMode": "shrink-to-fit"
  //               },
  //               {
  //                 "type": "button",
  //                 "action": {
  //                   "type": "postback",
  //                   "data": "account",
  //                   "label": "消耗品費"
  //                 },
  //                 "style": "primary",
  //                 "color": "#434DFF",
  //                 "margin": "md",
  //                 "adjustMode": "shrink-to-fit"
  //               }
  //             ],
  //             "margin": "md"
  //           }
  //         ]
  //       }
  //     },
  //     {
  //       "type": "bubble",
  //       "body": {
  //         "type": "box",
  //         "layout": "vertical",
  //         "contents": []
  //       }
  //     }
  //   ]
  // }

  makeAccountChoice: (text) => {
    const flexMessage = {
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
                  "text": "科目を選んでください",
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
                    "label": "売上",
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
                    "label": "源泉所得税",
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
                    "label": "交通費",
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
                    "label": "会議費",
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
                  "text": "科目を選んでください",
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
                    "label": "接待交際費",
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
                    "label": "通信費",
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
                    "label": "衣装費",
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
                    "label": "郵便代",
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
                  "text": "科目を選んでください",
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
                    "label": "保険料",
                    "data": `account&${text}&8`
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
                    "label": "家賃",
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
                    "label": "従業員報酬",
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
                  "text": "科目を選んでください",
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
                    "label": "その他",
                    "data": `account&${text}&12`
                  }
                },
                {
                  "type": "separator"
                }
              ]
            }
          }
        ]
      }
    }
    return flexMessage;
  },

  makeDateChoice: (amount,selectedAccount) => {
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
                "data": `date&${amount}&${selectedAccount}`,
                "mode": "date"
              }
            }
          ]
        }
      }
    };
    return flexMessage;
  },

  makeDateChoiceForConfirmation: (mode) => {
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
                "data": mode,
                "mode": "date"
              }
            }
          ]
        }
      }
    };
    return flexMessage;
  },

  //削除用の科目選択カルーセルを動的に生成
  makeAccountChoiceForDelete: (selectedDate,foundValues) => {
    console.log('foundValues',foundValues);
    const accountsExist = [];
    foundValues.forEach((obj,index)=>{
      accountsExist.push([ACCOUNTS.indexOf(obj.account),obj.value])
    })
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
            label: `${ACCOUNTS[accountsExist[NUMBER_OF_BUTTONS*i+j][0]]} ￥${accountsExist[NUMBER_OF_BUTTONS*i+j][1]}`,
            data: `deleteAccount&${selectedDate}&${accountsExist[NUMBER_OF_BUTTONS*i+j][0]}`
          }
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

  makeAccountChoiceForConfirmation: () => {
    const flexMessage = {
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
                  "text": "科目を選んでください",
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
                    "label": "売上",
                    "data": "confirmationByAccount&0"
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
                    "data": "confirmationByAccount&1"
                  }
                },
                {
                  "type": "separator"
                },
                {
                  "type": "button",
                  "action": {
                    "type": "postback",
                    "label": "交通費",
                    "data": "confirmationByAccount&2"
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
                    "data": "confirmationByAccount&3"
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
                  "text": "科目を選んでください",
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
                    "label": "接待交際費",
                    "data": "confirmationByAccount&4"
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
                    "data": "confirmationByAccount&5"
                  }
                },
                {
                  "type": "separator"
                },
                {
                  "type": "button",
                  "action": {
                    "type": "postback",
                    "label": "衣装費",
                    "data": "confirmationByAccount&6"
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
                    "data": "confirmationByAccount&7"
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
                  "text": "科目を選んでください",
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
                    "label": "保険料",
                    "data": "confirmationByAccount&8"
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
                    "data": "confirmationByAccount&9"
                  }
                },
                {
                  "type": "separator"
                },
                {
                  "type": "button",
                  "action": {
                    "type": "postback",
                    "label": "家賃",
                    "data": "confirmationByAccount&10"
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
                    "data": "confirmationByAccount&11"
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
                  "text": "科目を選んでください",
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
                    "label": "その他",
                    "data": "confirmationByAccount&12"
                  }
                },
                {
                  "type": "separator"
                }
              ]
            }
          }
        ]
      }
    }
    return flexMessage;
  },

  // 1/26これを追加
  makeTransactionChoice: (amount,selectedAccount) => {
    console.log('selectedAccount in flex',selectedAccount);
    const flexMessage = {
      "type":"flex",
      "altText":"取引方法選択",
      "contents":
      {
        "type": "bubble",
        "header": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "取引方法を選択してください",
              "size": "lg",
              "margin": "md",
              "align": "center"
            },
          ]
        },
        "hero": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "（1つのみ選択可能です）",
              "size": "md",
              "align": "center"
            },
            {
              "type": "separator",
              "margin": "md"
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
                "label": `${ACCOUNTS[parseInt(selectedAccount)]}`,
                "data": `transaction&${amount}&${selectedAccount}&0`
              },
              "style": "primary",
              "margin": "md",
              "adjustMode": "shrink-to-fit"
            },
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": `${ACCOUNTS[parseInt(selectedAccount)]}(振込・振替)`,
                "data": `transaction&${amount}&${selectedAccount}&1`
              },
              "style": "primary",
              "margin": "md",
              "adjustMode": "shrink-to-fit"
            },
            {
              "type": "button",
              "action": {
                "type": "postback",
                "label": `${ACCOUNTS[parseInt(selectedAccount)]}（クレカ）`,
                "data": `transaction&${amount}&${selectedAccount}&2`
              },
              "margin": "md",
              "style": "primary",
              "adjustMode": "shrink-to-fit"
            }
          ]
        }
      }
    }
    return flexMessage;
  }
}