const divPage = document.getElementById('payment-page');
const FREE_TRIAL_PERIOD = 3;

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
          const divTitle = document.createElement('div');
          divTitle.setAttribute('class','div-center');
          const title = document.createElement('p');
          const titleText = data.subscription ? `ようこそ${data.display_name}さん!<br>「けーり君」各種情報ページ``ようこそ${data.display_name}さん!<br>「けーりくん」各種情報ページ` : `ようこそ${data.display_name}さん!<br>「けーり君」ご購入ページ`;
          title.innerHTML = titleText;
          divTitle.appendChild(title);
          divPage.appendChild(divTitle);

          //課金しているかどうかで表示コンテンツを変える
          if(!data.subscription){
            createPaymentPage(); //未課金
          }else{
            createMemberPage(data,lineId); //すでに課金
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

  const imgMenu1 = document.createElement('img');
  imgMenu1.src = '/starter.png';
  imgMenu1.alt = '月額';
  divMenu1.appendChild(imgMenu1);
  
  const btnMenu1 = document.createElement('button');
  btnMenu1.setAttribute('class','btn btn-primary pay-button');
  btnMenu1.innerHTML = '購入する';
  divMenu1.appendChild(btnMenu1);
  divPage.appendChild(divMenu1);

  //クリック時の動作
  btnMenu1.addEventListener('click',(e)=>{
    e.preventDefault();
    fetch('/settings/setup')
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
  btnMenu2.setAttribute('class','btn btn-primary pay-button');
  btnMenu2.innerHTML = '購入する';
  divMenu2.appendChild(btnMenu2);
  divPage.appendChild(divMenu2);

  btnMenu2.addEventListener('click',(e)=>{
    e.preventDefault();
    fetch('/settings/setup')
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

const createMemberPage = (userInfo,lineId) => {

  //契約情報
  const label_contract = document.createElement('label');

  let contractInfo;
  switch(userInfo.subscription){
    case 'guest':
      contractInfo = '■ご契約情報<br>　ゲストユーザーです'
      break;

    case 'trial':
      const registeredDate = userInfo.timestamp;
      const today = new Date().getTime();
      const left = FREE_TRIAL_PERIOD - ((today-registeredDate)/(24*60*60*1000));
      contractInfo = `■ご契約情報<br>　試用期間中です(残り${left}日)`;
      break;
    
    default:
      contractInfo = `■ご契約情報<br>　ご契約中です(${userInfo.subscription})`;
      break;
  }
  label_contract.innerHTML = contractInfo;
  divPage.appendChild(label_contract);

  //スプレッドシート情報
  const label_ss = document.createElement('label');
  if(userInfo.ssid){
    label_ss.innerHTML = `■スプレッドシート：作成済<br>　ID:${userInfo.ssid}`;
  }else{
    label_ss.innerHTML = '■スプレッドシート：未作成'
  }
  divPage.appendChild(label_ss);

  //Gmail
  //form要素の生成
  const formElement = document.createElement('form');
  formElement.setAttribute('name','gmail-input');

  const label_gmail = document.createElement('label');
  label_gmail.setAttribute('class','label-gmail');
  if(userInfo.gmail){
    label_gmail.innerHTML = '■スプレッドシートに紐づくGmailアドレス';
  }else{
    label_gmail.innerHTML = '■スプレッドシート作成のためのGmailアドレスを登録してください';
  }
  
  divPage.appendChild(label_gmail);

  const div_form_gmail = document.createElement('div');
  div_form_gmail.setAttribute('class','input-group mb-3');

  const input_gmail = document.createElement('input');
  input_gmail.setAttribute('class','form-control');
  input_gmail.setAttribute('type','text');
  input_gmail.setAttribute('name','gmail');
  input_gmail.setAttribute('aria-describedby','gmail-address');
  const span_gmail = document.createElement('span');
  span_gmail.setAttribute('class','input-group-text');
  span_gmail.setAttribute('id','gmail-address');
  span_gmail.innerHTML = '@gmail.com';
  const postButton = document.createElement('input');
  postButton.type = 'button';
  postButton.value = '登録';
  postButton.setAttribute('class','btn btn-primary mail-post-button');
  postButton.setAttribute('id','gmail-address');
  postButton.addEventListener('click',(e)=>{
    const formData = new FormData(formElement);
    const gmail = formData.get('gmail');

  })

  if(userInfo.gmail){
    const gmail = userInfo.gmail.split('@');
    input_gmail.value = gmail[0];
    input_gmail.readOnly = true;
    postButton.value = '登録済'
    // postButton.disabled = true;
  }

  div_form_gmail.appendChild(input_gmail);
  div_form_gmail.appendChild(span_gmail);
  div_form_gmail.appendChild(postButton);
  formElement.appendChild(div_form_gmail);
  divPage.appendChild(formElement);

  //お問合せ先
  const label_contact = document.createElement('label');
  label_contact.innerHTML = '■お問合せ先<br>　電話：090-xxxx-xxxx<br>　メール：kentaro523@gmail.com';
  divPage.appendChild(label_contact);


  //解約ボタン
  const divCancel = document.createElement('div');
  divCancel.setAttribute('class','div-right');

  const btnCancel = document.createElement('button');
  btnCancel.setAttribute('class','btn-outline-secondary');
  btnCancel.innerHTML ='解約する';
  btnCancel.addEventListener('click',()=>{
    fetch(`/api/cancel/${lineId}?sub=${userInfo.subscription}`)
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
  divCancel.appendChild(btnCancel);
  divPage.appendChild(divCancel);
}

const createCheckoutSession = (priceId) => {
  return fetch('/settings/create-checkout-session',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      priceId: priceId
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