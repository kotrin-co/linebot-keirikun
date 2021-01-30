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
      liff.getProfile()
        .then(async(profile)=>{
          const lineId = profile.userId;
          const response = await fetch(`api?line_uid=${lineId}`);
          const data = await response.json();

          //タイトル生成
          const title = document.createElement('p');
          title.innerHTML = `${data.display_name}さん!<br>「けーりくん」ご契約ありがとうございます！`;
          divPage.appendChild(title);

          if(sessionId){
            let subscription;
            fetch('/settings/checkout-session?sessionId='+sessionId)
              .then((result)=>{
                return result.json();
              })
              .then(session=>{
                // customerId = session.customer;
                const sessionJSON = JSON.stringify(session,null,2);
                const pre = document.createElement('pre');
                pre.textContent = sessionJSON;

                //subscriptionのPUT
                subscription = session.subscription;
                fetch('/api',{
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    subscription,
                    lineId
                  })
                })
                .then(response=>{
                  if(response.ok){
                    response.text()
                      .then(text=>{
                        alert(text);
                        const backButton = document.createElement('button');
                        backButton.setAttribute('class','btn btn-secondary');
                        backButton.innerHTML = '戻る';
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
                    alert('HTTPレスポンスエラーです');
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
}