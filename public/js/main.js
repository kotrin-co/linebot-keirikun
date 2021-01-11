window.onload = () => {
  const myLiffId = '1655219547-2QEXPwR1';
  const divPage = document.getElementById('input-page');

  liff
    .init({
      liffId: myLiffId
    })
    .then(()=>{
      liff.getProfile()
        .then(profile=>{
          const lineId = profile.userId;
          const userLabel = document.getElementById('user-name');
          userLable.innerHTML = lineId;
        })
        .catch(err=>console.log(err));
    })
    .catch(err=>alert(JSON.stringify(err)));
}