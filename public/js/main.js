window.onload = () => {
  // import liff from '@line/liff';
  const myLiffId = '1655219547-2QEXPwR1';
  const divPage = document.getElementById('input-page');

  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{
      liff.getProfile()
        .then(profile=>{
          const title = document.getElementById('top-font');
          title.innerHTML = '会計データ入力';
          const lineId = profile.userId;
          const userLabel = document.getElementById('user-name');
          userLabel.innerHTML = lineId;

        })
        .catch(err=>console.log(err));
    })
    .catch(err=>alert(JSON.stringify(err)));
}