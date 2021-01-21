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
            fetch('/checkout-session?sessionId='+sessionId)
              .then((result)=>{
                return result.json();
              })
              .then(session=>{
                // customerId = session.customer;
                const sessionJSON = JSON.stringify(session,null,2);
                const pre = document.createElement('pre');
                pre.textContent = sessionJSON;
                subscription = session.subscription;

                const manageBillingForm = document.createElement('form');
                const submitButton = document.createElement('button');
                manageBillingForm.appendChild(submitButton);
                // const manageBillingForm = document.querySelector('#manage-billing-form');
                manageBillingForm.addEventListener('submit',(e)=>{
                  e.preventDefault();
                  fetch('/customer-portal',{
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      sessionId: sessionId
                    })
                  })
                  .then(response=>response.json())
                  .then(data=>{
                    liff.openWindow({
                      url: data.url,
                      external: false
                    });
                    // window.location.href=data.url;
                  })
                  .catch(error=>{
                    console.error('error:',error);
                  });
                });
                divPage.appendChild(manageBillingForm);
                divPage.appendChild(pre);
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