const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('session_id');
const divPage = document.getElementById('paid-success-page');
let customerId;

window.onload = () => {
  const myLiffId = '1655219547-2EG4LMYx';
  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{

      //idトークンの取得
      const idToken = liff.getIDToken();
      const jsonData = JSON.stringify({
        id_token: idToken
      });

      fetch('/api/idToken',{
        method: 'POST',
        headers: {
          'Content-Type':'application/json'
        },
        body: jsonData,
        creadentials: 'same-origin'
      })
      .then(res=>{
        res.json()
          .then(data=>{
            
            //タイトル生成
            const title = document.createElement('p');
            title.innerHTML = `${data.display_name}さん!<br>「けーり君」ご契約ありがとうございます！`;
            divPage.appendChild(title);

            if(sessionId){
              let subscription;
              fetch('/settings/checkout-session?sessionId='+sessionId)
                .then((result)=>{
                  return result.json();
                })
                .then(session=>{
                  // customerId = session.customer;
                  // const sessionJSON = JSON.stringify(session,null,2);
                  // const pre = document.createElement('pre');
                  // pre.textContent = sessionJSON;
  
                  const divImg = document.createElement('div');
                  const thanksImg = document.createElement('img');
                  thanksImg.setAttribute('class','thanks-img');
                  thanksImg.src = '/thankyou.png';
                  thanksImg.alt = 'thanks';
                  divImg.appendChild(thanksImg);
                  divPage.appendChild(divImg);
  
                  //subscriptionのPUT
                  subscription = session.subscription;
                  fetch('/api',{
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      subscription,
                      lineId: data.line_uid
                    })
                  })
                  .then(response=>{
                    if(response.ok){
                      response.text()
                        .then(text=>{
                          // alert(text);
                          const backButton = document.createElement('button');
                          backButton.setAttribute('class','btn btn-secondary back-button');
                          backButton.innerHTML = '設定ページへ戻る';
                          backButton.addEventListener('click',()=>{
                            liff.openWindow({
                              url:'https://liff.line.me/1655219547-eobVGLdB',
                              external: false
                            });
                          });
                          divPage.appendChild(backButton);
                          divPage.appendChild(pre);
                        })
                    }else{
                      makeAlert('HTTPレスポンスエラーです');
                    }
                  })
                  //カスターマーポータルの生成(本番環境でないとできない)
                  // const manageBillingForm = document.createElement('form');
                  // const submitButton = document.createElement('button');
                  // manageBillingForm.appendChild(submitButton);
                  // manageBillingForm.addEventListener('submit',(e)=>{
                  //   e.preventDefault();
                  //   fetch('/customer-portal',{
                  //     method: 'POST',
                  //     headers: {
                  //       'Content-Type': 'application/json'
                  //     },
                  //     body: JSON.stringify({
                  //       sessionId: sessionId
                  //     })
                  //   })
                  //   .then(response=>response.json())
                  //   .then(data=>{
                  //     liff.openWindow({
                  //       url: data.url,
                  //       external: false
                  //     });
                  //     // window.location.href=data.url;
                  //   })
                  //   .catch(error=>{
                  //     console.error('error:',error);
                  //   });
                  // });
                  // divPage.appendChild(manageBillingForm);
                })
                .catch(err=>{
                  console.log('Error when fetching Checkout session', err);
                });
            
                // const cancelButton = document.getElementById('cancel-button').addEventListener('click',(e)=>{
                //   e.preventDefault();
                //   fetch(`/cancel-subscription?sub=${subscription}`);
                // })
            }
          })
      })
    })
}

//アラート生成
const makeAlert = (text) => {

  const divAlert = document.createElement('div');
  divAlert.setAttribute('class','alert alert-warning alert-dismissible fade show make-alert');
  divAlert.setAttribute('role','alert');

  divAlert.innerHTML = text;

  //閉じるボタン
  const closeButton = document.createElement('button');
  closeButton.setAttribute('type','button');
  closeButton.setAttribute('class','close');
  closeButton.setAttribute('data-dismiss','alert');
  closeButton.setAttribute('aria-label','Close');

  const span = document.createElement('span');
  span.setAttribute('aria-hidden','true');
  span.innerHTML = '&times;'

  closeButton.appendChild(span);
  divAlert.appendChild(closeButton);
  divPage.appendChild(divAlert);
}