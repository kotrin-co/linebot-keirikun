
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
  }
}