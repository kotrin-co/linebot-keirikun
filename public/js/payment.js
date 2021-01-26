const divPage = document.getElementById('payment-page');

window.onload = () => {
  const myLiffId = '1655219547-eobVGLdB';

  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{
      liff.getProfile()
        .then(async(profile) => {
          const lineId = profile.userId;
          const response = await fetch(`api?line_uid=${lineId}`);
          const data = await response.json();

          //タイトル生成
          const title = document.createElement('p');
          title.innerHTML = `ようこそ${data.display_name}さん!<br>「けーりくん」お支払いページ`;
          divPage.appendChild(title);

          //課金しているかどうかで表示コンテンツを変える
          if(!data.subscription){
            createPaymentPage(); //未課金
          }else{
            createCancelPage(data.subscription,lineId); //すでに課金
          }
        })
        .catch(e=>console.log(e));
    })
}

const createPaymentPage = () => {
  //メニュー１
  const divMenu1 = document.createElement('div');
  divMenu1.setAttribute('class','menu-contents');
  const pMenu1 = document.createElement('p');
  pMenu1.innerHTML = '日額 ¥50（テスト）';
  pMenu1.setAttribute('class','p-menu');
  divMenu1.appendChild(pMenu1);
  const btnMenu1 = document.createElement('button');
  btnMenu1.setAttribute('class','btn btn-secondary pay-button');
  btnMenu1.innerHTML = '購入する';
  divMenu1.appendChild(btnMenu1);
  divPage.appendChild(divMenu1);

  //クリック時の動作
  btnMenu1.addEventListener('click',(e)=>{
    e.preventDefault();
    fetch('/setup')
      .then(handleFetchResult)
      .then(json=>{
        const publishableKey = json.publishableKey;
        const monthlyPriceId = json.monthlyPrice;
        // const yearlyPriceId = json.yearlyPrice;

        const stripe = Stripe(publishableKey);

        createCheckoutSession(monthlyPriceId)
          .then(data=>{
            stripe.redirectToCheckout({
              sessionId: data.sessionId
            })
            .then(handleResult);
          });
      });
  });
  //メニュー２
  const divMenu2 = document.createElement('div');
  divMenu2.setAttribute('class','menu-contents');
  const pMenu2 = document.createElement('p');
  pMenu2.innerHTML = '月額 ¥500（テスト）';
  pMenu2.setAttribute('class','p-menu');
  divMenu2.appendChild(pMenu2);
  const btnMenu2 = document.createElement('button');
  btnMenu2.setAttribute('class','btn btn-secondary pay-button');
  btnMenu2.innerHTML = '購入する';
  divMenu2.appendChild(btnMenu2);
  divPage.appendChild(divMenu2);

  btnMenu2.addEventListener('click',(e)=>{
    e.preventDefault();
    fetch('/setup')
      .then(handleFetchResult)
      .then(json=>{
        const publishableKey = json.publishableKey;
        // const monthlyPriceId = json.monthlyPrice;
        const yearlyPriceId = json.yearlyPrice;

        const stripe = Stripe(publishableKey);

        createCheckoutSession(yearlyPriceId)
          .then(data=>{
            stripe.redirectToCheckout({
              sessionId: data.sessionId
            })
            .then(handleResult);
          });
      });
  });
}

const createCancelPage = (subscription,lineId) => {
  const p = document.createElement('p');
  p.innerHTML = 'すでにご契約いただいております';
  divPage.appendChild(p);

  const btnCancel = document.createElement('button');
  btnCancel.setAttribute('class','btn btn-danger pay-button');
  btnCancel.innerHTML ='解約する';
  btnCancel.addEventListener('click',()=>{
    fetch(`/api/cancel/${lineId}?sub=${subscription}`)
      .then(response=>{
        if(response.ok){
          response.text()
            .then(text=>{
              alert(text);
              liff.openWindow({
                url: 'https://liff.line.me/1655219547-eobVGLdB',
                external: false
              });
            })
            .catch(e=>console.log(e));
        }else{
          alert('HTTPレスポンスエラーです');
        }
      })
  })
  divPage.appendChild(btnCancel);
}

const createCheckoutSession = (yearlyPriceId) => {
  return fetch('/create-checkout-session',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      priceId: yearlyPriceId
    })
  })
  .then(handleFetchResult);
}

const handleFetchResult = (result) => {
  if(!result.ok){
    return result.json()
      .then(json=>{
        if(json.error && json.error.message){
          throw new Error(result.url+' '+result.status+' '+json.error.message);
        }
      })
      .catch(err=>{
        showErrorMessage(err);
        throw err;
      });
  }
  return result.json();
}

const handleResult = (result) => {
  if(result.error){
    showErrorMessage(result.error.message);
  }
}

const showErrorMessage = (message) => {
  const errorEl = document.createElement('div');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}