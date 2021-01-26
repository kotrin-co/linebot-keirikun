const ACCOUNTS = ['売上','源泉所得税','交通費','会議費','接待交際費','通信費','衣装費','郵便代','保険料','年金','家賃','従業員報酬','その他'];
const NUMBER_OF_BUTTONS =4; //カルーセルの中のボタン数

module.exports = {

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

  makeAccountChoiceForDelete: (selectedDate) => {
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
                    "data": `deleteAccount&${selectedDate}&0`
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
                    "data": `deleteAccount&${selectedDate}&1`
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
                    "data": `deleteAccount&${selectedDate}&2`
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
                    "data": `deleteAccount&${selectedDate}&3`
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
                    "data": `deleteAccount&${selectedDate}&4`
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
                    "data": `deleteAccount&${selectedDate}&5`
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
                    "data": `deleteAccount&${selectedDate}&6`
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
                    "data": `deleteAccount&${selectedDate}&7`
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
                    "data": `deleteAccount&${selectedDate}&8`
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
                    "data": `deleteAccount&${selectedDate}&9`
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
                    "data": `deleteAccount&${selectedDate}&10`
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
                    "data": `deleteAccount&${selectedDate}&11`
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
                    "data": `deleteAccount&${selectedDate}&12`
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

  makeAccountChoiceForDelete2: (selectedDate,foundValues) => {
    console.log('foundValues',foundValues);
    const accountsExist = [];
    foundValues.forEach((obj,index)=>{
      accountsExist.push([ACCOUNTS.indexOf(obj.account),obj.value])
    })
    const messageContents = [];
    const numberOfSlides = Math.ceil(foundValues/NUMBER_OF_BUTTONS); //カルーセルの中のスライド枚数

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
            label: `${ACCOUNTS[accountsExist[NUMBER_OF_BUTTONS*i+j][0]]} ￥${accountsExist[NUMBER_OF_BUTTONS*i+j][1]}`
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
    console.log('mainMessage',mainMessage);
    // accountsExist.forEach(array=>{
    //   messageContents.push({
    //     type: 'button',
    //     action: {
    //       type: 'postback',
    //       label: `${ACCOUNTS[array[0]]} ￥${array[1]}`,
    //       data: `deleteAccount&${selectedDate}&${array[0]}`
    //     }
    //   });
    // });

    // const flexMessage = {
    //   type:'flex',
    //   altText:'勘定科目選択',
    //   contents:
    //   {
    //     type:'carousel',
    //     contents:[
    //       {
    //         type:'bubble',
    //         header:{
    //           type:'box',
    //           layout:'vertical',
    //           contents:[
    //             {
    //               type:'text',
    //               text:'削除する項目を選んでください',
    //               align:'center'
    //             }
    //           ]
    //         },
    //         body:{
    //           type:'box',
    //           layout:'vertical',
    //           contents: messageContents
    //         }
    //       },
          // {
          //   type:'bubble',
          //   header:{
          //     type:'box',
          //     layout:'vertical',
          //     contents:[
          //       {
          //         type:'text',
          //         text:'科目を選んでください',
          //         align:'center'
          //       }
          //     ]
          //   },
            // body:{
            //   type:'box',
            //   layout:'vertical',
            //   contents:[
            //     messageContents[0]
            //   ]
            // }
          // }
    //     ]
    //   }
    // }
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
  }
}