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
            createCancelPage(); //すでに課金
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
  pMenu1.innerHTML = '月額 ¥500';
  pMenu1.setAttribute('class','p-menu');
  divMenu1.appendChild(pMenu1);
  const btnMenu1 = document.createElement('button');
  btnMenu1.setAttribute('class','btn btn-secondary pay-button');
  btnMenu1.innerHTML = '購入する';
  divMenu1.appendChild(btnMenu1);
  divPage.appendChild(divMenu1);

  //メニュー２
  const divMenu2 = document.createElement('div');
  divMenu2.setAttribute('class','menu-contents');
  const pMenu2 = document.createElement('p');
  pMenu2.innerHTML = '年額 ¥3,000';
  pMenu2.setAttribute('class','p-menu');
  divMenu2.appendChild(pMenu2);
  const btnMenu2 = document.createElement('button');
  btnMenu2.setAttribute('class','btn btn-secondary pay-button');
  btnMenu2.innerHTML = '購入する';
  divMenu2.appendChild(btnMenu2);
  divPage.appendChild(divMenu2);
}