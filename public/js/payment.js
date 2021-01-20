window.onload = () => {
  const myLiffId = '1655219547-eobVGLdB';
  const divPage = document.getElementById('payment-page');

  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{
      liff.getProfile()
        .then(profile=>{
          const lineId = profile.userId;
          const response = await fetch(`api?line_uid=${lineId}`);
          const data = await response.json();

          //タイトル生成
          const title = document.createElement('p');
          title.innerHTML = `${data.display_name}さんの「けーりくん」お支払いページ`;
          divPage.appendChild(title);
          
        })
    })
}